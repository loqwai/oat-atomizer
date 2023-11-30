import { createShader } from "./shaderUtils.js";

export class ShaderToy {
  constructor(canvas, shaderUrl) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.startTime = performance.now();
    this.shaderUrl = shaderUrl;
    this.state = {};
  }

  init = async () => {
    const { gl } = this;
    const program = await this.createRenderProgram();
    this.imageTexture = await this.createImageTexture("/public/boy-cliff-mask.png");
    const positionBuffer = this.createPositionBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "inPosition"));
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.state.program = program;
    this.state.vao = vao;

    console.log({ program });
    requestAnimationFrame(this.render);
  };

  createPositionBuffer = () => {
    const { gl } = this;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    return buffer;
  };

  createRenderProgram = async () => {
    const { gl, shaderUrl } = this;
    const program = gl.createProgram();

    const vertexShader = await createShader(gl, gl.VERTEX_SHADER, `/src/shaders/generic-vertex.glsl`);
    const fragmentShader = await createShader(gl, gl.FRAGMENT_SHADER, `/src/shaders/${shaderUrl}.glsl`);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    // Check for linking status
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
      console.error(`Could not link render program: ${gl.getProgramInfoLog(program)}`);
      throw new Error(`Could not link render program. ${gl.getProgramInfoLog(program)}\n`);
    }

    // Use the program to retrieve the uniform location
    gl.useProgram(program);
    const iChannel1Location = gl.getUniformLocation(program, "iChannel1");
    if (iChannel1Location === null) {
      console.warn("iChannel1Location is null. Check if iChannel1 is declared and used in the shader.");
    }

    // Store the program and uniform location in the state
    console.log({ iChannel1Location });
    const iResolution = gl.getUniformLocation(program, "iResolution");
    const iTime = gl.getUniformLocation(program, "iTime");

    this.state = { ...this.state, iChannel1Location, iResolution, iTime };
    return program;
  };

  createImageTexture = async (url) => {
    const { gl } = this;
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    return texture;
  };

  render = () => {
    if (!this.running) return;
    const { gl } = this;

    gl.bindVertexArray(this.state.vao);
    gl.uniform3f(this.state.iResolution, this.canvas.width, this.canvas.height, 1.0);
    gl.uniform1f(this.state.iTime, (performance.now() - this.startTime) / 1000);

    gl.useProgram(this.state.program);
    gl.bindVertexArray(this.state.vao);

    // Set the texture for iChannel1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.uniform1i(this.state.iChannel1Location, 1);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(this.render);
  };

  start = () => {
    this.running = true;
    requestAnimationFrame(this.render);
  };

  stop = () => {
    this.running = false;
  };
}

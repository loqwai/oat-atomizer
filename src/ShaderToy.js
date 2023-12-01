import { createShader, tagObject } from "./shaderUtils.js";
export class ShaderToy {
  constructor(canvas, audioData, shaderUrl, initialImageUrl) {
    this.audioData = audioData;
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.startTime = performance.now();
    this.shaderUrl = shaderUrl;
    this.initialImageUrl = initialImageUrl || "/public/boy-cliff-mask.png";
    this.pixels = new Uint8Array(canvas.width * canvas.height * 4); // 4 channels (RGBA) per pixel
    this.state = {};
    const ext = this.gl.getExtension('GMAN_debug_helper');
    if (ext) {
     ext.setConfiguration({
      warnUndefinedUniforms: false,
     });
    }
  }

  _createAudioTexture = (size) => {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, 2, 0, gl.RED, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };

  initAudioUniforms = () => {
    const { gl, audioData } = this;
    const program = this.state.program;

    for (const key in audioData.features) {
      if (typeof audioData.features[key] === "number") {
        // Create uniform locations for each audio feature
        this.state[key] = gl.getUniformLocation(program, key);
      }
    }

    // Create the audio texture
    this.state.audioTexture = this._createAudioTexture(1024);
  };

  writeAudioDataToTexture = () => {
    const { gl, audioData, state } = this;
    gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);

    for (const key in audioData.features) {
      if (typeof audioData.features[key] === "number") {
        console.log(key, audioData.features[key])
        // Update the audio texture and corresponding uniform values
        gl.uniform1f(state[key], audioData.features[key] || 0);
      }
    }
  };

  init = async () => {
    await this.audioData.start();
    this.state.audioData = { ...this.audioData.features }
    console.log(this.state.audioData)
    const { gl } = this;
    const program = await this.createRenderProgram();
    this.imageTexture = await this.createImageTexture(this.initialImageUrl);
    const positionBuffer = this.createPositionBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, "inPosition"));
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.state.program = program;
    this.state.vao = vao;
    this.state.iResolution = gl.getUniformLocation(program, "iResolution");
    this.state.iTime = gl.getUniformLocation(program, "iTime");
    this.state.iChannel1Location = gl.getUniformLocation(program, "iChannel1");

    // Initialize audio feature uniforms
    for (const key in this.audioData.features) {
      if (typeof this.audioData.features[key] === "number") {
        this.state[key] = gl.getUniformLocation(program, key);
      }
    }
    // Initialize audio uniforms
    this.initAudioUniforms();
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

    const iResolution = gl.getUniformLocation(program, "iResolution");
    const iTime = gl.getUniformLocation(program, "iTime");
    const spectralSpread = gl.getUniformLocation(program, "spectralSpread");
    console.log(this.state.audioData)
    // Create uniform locations for each audio feature from the audioData map
    const audioState = {};
    for (const key in this.audioData.features) {
      if (typeof this.audioData.features[key] === "number") {
        audioState[key] = gl.getUniformLocation(program, key);
      }
    }

    this.state = { ...this.state, iChannel1Location, iResolution, iTime, ...audioState };
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
    const { gl, state } = this;
    const { pixels, canvas } = this;
    const { width, height } = canvas;

    gl.bindVertexArray(this.state.vao);
    gl.uniform3f(this.state.iResolution, this.canvas.width, this.canvas.height, 1.0);
    gl.uniform1f(this.state.iTime, (performance.now() - this.startTime) / 1000);
    for (const i in this.state.features) {
      gl.uniform1f(this.state[i], this.audioData.features[i] || 0);
      tagObject(gl, this.state[i], i);
    }

    this.writeAudioDataToTexture();
    gl.useProgram(this.state.program);
    gl.bindVertexArray(this.state.vao);

    // Set the texture for iChannel1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    const imagePixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, imagePixels);
    this.prevPixels = imagePixels;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);

    gl.uniform1i(this.state.iChannel1Location, 1);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);


    this.imageTexture = texture;
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

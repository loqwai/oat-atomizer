"use strict";

(async () => {

  /**
   * Creates and compiles a shader.
   *
   * @param {!WebGLRenderingContext} gl The WebGL Context.
   * @param {string} shaderSource The GLSL source code for the shader.
   * @param {number} shaderType The type of shader, VERTEX_SHADER or
   *     FRAGMENT_SHADER.
   * @return {!WebGLShader} The shader.
   */
  function compileShader(gl, shaderSource, shaderType) {
    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check if it compiled
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw ("could not compile shader:" + gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  /**
   * Creates a program from 2 shaders.
   *
   * @param {!WebGLRenderingContext} gl The WebGL context.
   * @param {!WebGLShader} vertexShader A vertex shader.
   * @param {!WebGLShader} fragmentShader A fragment shader.
   * @return {!WebGLProgram} A program.
   */
  function createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    const program = gl.createProgram();

    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // link the program.
    gl.linkProgram(program);

    // Check if it linked.
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      // something went wrong with the link; get the error
      throw ("program failed to link:" + gl.getProgramInfoLog(program));
    }

    return program;
  };

  function createGeometry(gl) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        // triangle 1
        -1, -1, 0,
        -1,  1, 0,
        1, -1, 0,
        // triangle 2
        1, -1, 0,
        -1,  1, 0,
        1,  1, 0,
      ]),
      gl.STATIC_DRAW
    )
  }

  /**
   * @param {!WebGLRenderingContext} gl The WebGL Context.
   */
  function setTexcoords(gl) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      // triangle 1
      0, 0,
      0, 1,
      1, 0,
      // triangle 2
      1, 0,
      0, 1,
      1, 1,
    ]), gl.STATIC_DRAW) // Two triangles covering the entire screen
  }

  /**
   * @param {!WebGLRenderingContext} gl The WebGL Context.
   */
  function draw(gl) {
    /** @type {!HTMLCanvasElement} */
    // const equalizerCanvas = document.querySelector('#equalizer');


    if (window.frequencyData) {
      /** @type {!Float32Array} */
      const data = window.frequencyData;

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 512, 1, 0, gl.RED, gl.FLOAT, data, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 512, 1, 0, gl.RED, gl.UNSIGNED_BYTE, data, 0);
      // gl.generateMipmap(gl.TEXTURE_2D);
    }

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => draw(gl));
  }

  const vertexShaderSource = `#version 300 es
    in vec4 a_position;
    in vec2 a_texcoord;

    out vec2 v_texcoord;

    void main() {
      gl_Position = a_position;
      v_texcoord = a_texcoord;
    }
  `;

  const fragmentShaderSource = await fetch('./fragment_shader.glsl').then(r => r.text())

  /**
   * @return {!WebGLRenderingContext} The created context.
   */
  function getWebGLContext() {
    const canvas = document.querySelector('#visualizer');
    return canvas.getContext('webgl2', { antialias: false });
  }

  const gl = getWebGLContext();

  const program = createProgram(gl,
    compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER),
    compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER),
  )


  // Load the texture
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const textcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");


  const positionBuffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  createGeometry(gl)
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  const textcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textcoordBuffer);
  setTexcoords(gl);

  gl.enableVertexAttribArray(textcoordAttributeLocation);
  gl.vertexAttribPointer(textcoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);


  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  // const image = new Image();
  // image.src  = './test_img.png';
  // image.addEventListener('load', () => {
  //   gl.bindTexture(gl.TEXTURE_2D, texture);

  // })
  requestAnimationFrame(() => draw(gl));
})()

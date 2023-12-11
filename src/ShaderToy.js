import { createShader, tagObject } from "./shaderUtils.js";
import { StatTracker } from "./StatTracker.js";

const STAT_HISTORY_LENGTH = 500;
export class ShaderToy {
  constructor(canvas, audioData, shaderUrl, initialImageUrl) {
    console.log("ShaderToy constructor called");
    this.startTime = performance.now();
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.audioData = audioData;
    this.shaderUrl = shaderUrl;
    this.initialImageUrl = initialImageUrl || "/src/images/placeholder-image.png"
    this.gl = canvas.getContext("webgl2");
    this.pixels = new Uint8Array(canvas.width * canvas.height * 4); // 4 channels (RGBA) per pixel
    this.startTime = performance.now();
    this.state = {
      audioUniforms: {},
    };
    this.audioStatTrackers = {};
    console.log("ShaderToy constructor finished");
    // Enable the GMAN_debug_helper extension
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
    const { gl, audioData, state, } = this;
    const program = state.program;

    for (const key in audioData.features) {
      if (typeof audioData.features[key] === "number") {
        //console.log(`initializing audio uniform for ${key}`);
        // Create uniform locations for each audio feature
        state.audioUniforms[key] = gl.getUniformLocation(program, key);
      }
    }
    state.audioUniforms.bpm = gl.getUniformLocation(program, "bpm");

    // Create the audio texture
    state.audioTexture = this._createAudioTexture(1024);
  };

  writeAudioDataToTexture = () => {
    const { gl, audioData, state } = this;
    gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);

    //
    const fft = audioData.getFrequencyData();
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, fft.length, 1, gl.RED, gl.UNSIGNED_BYTE, fft);
    // write to iChannel0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);
    if (state.iChannel0Location) {
      gl.uniform1i(state.iChannel0Location, 0);
    }
    gl.uniform1f(state.iBpmLocation, audioData.bpm || 10)
  };

  initializeAudioStatTrackers = () => {
    for (const key in this.audioData.features) {
      if (typeof this.audioData.features[key] === "number") {
        console.log('initializing audio stat tracker for', key)
        this.audioStatTrackers[key] = new StatTracker(STAT_HISTORY_LENGTH);
      }
    }
    this.audioStatTrackers.bpm = new StatTracker(STAT_HISTORY_LENGTH);
  }

  initializeAudioStatTrackerUniforms = () => {
    const { gl, audioStatTrackers } = this;
    const program = this.state.program;

    for (const key in audioStatTrackers) {
      const statTracker = audioStatTrackers[key];
      // get the key/value pairs from the stat tracker
      this.state.audioUniforms[key] = gl.getUniformLocation(program, key);
      console.log('creating uniform location for', key);
      for (let stat in statTracker.get()) {
        stat = stat.charAt(0).toUpperCase() + stat.slice(1);
        const uniformName = `${key}${stat}`;
        console.log(`creating uniform location for ${uniformName}`);
        this.state.audioUniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
    }
    this.state.audioUniforms.beat = gl.getUniformLocation(program, "beat");
    gl.uniform1f(this.state.audioUniforms.beat, 0);
  }

  isBeat = () => {
    const spectralFluxTracker = this.audioStatTrackers.spectralFlux;
    const fluxZScore = spectralFluxTracker.get().zScore;
    if (fluxZScore < 1.8) return false;
    return true;
  }

  init = async () => {
    await this.audioData.start();
    this.initializeAudioStatTrackers();

    const { gl, width, height } = this;
    gl.viewport(0, 0, width, height);
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
    this.initAudioUniforms();
    this.initializeAudioStatTrackerUniforms();
  };

  createPositionBuffer = () => {
    const { gl } = this;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Define the vertices with 1/4 scale and stretching to fill the canvas
    const vertices = [
      -2.0, -2.0,
      -2.0, 2.0,
      2.0, -2.0,
      2.0, -2.0,
      -2.0, 2.0,
      2.0, 2.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    return buffer;
  };


  createRenderProgram = async () => {
    const { gl, shaderUrl, audioStatTrackers, state, audioData } = this;
    const program = gl.createProgram();

    const vertexShader = await createShader(gl, gl.VERTEX_SHADER, `/src/shaders/generic-vertex.glsl`);
    const fragmentShader = await createShader(gl, gl.FRAGMENT_SHADER, `/src/shaders/${shaderUrl}.glsl`);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    // Check for linking status
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
      throw new Error(`Could not link render program. ${gl.getProgramInfoLog(program)}\n`);
    }

    // Use the program to retrieve the uniform locations
    gl.useProgram(program);

    // Get the location of iChannel0 and iChannel1 if they exist
    const iChannel0Location = gl.getUniformLocation(program, "iChannel0");
    const iChannel1Location = gl.getUniformLocation(program, "iChannel1");

    state.iBpmLocation = gl.getUniformLocation(program, "bpm");



    // Create uniform locations for each audio feature from the audioData map
    for (const key in audioData.features) {
      if (typeof audioData.features[key] === "number") {
        //console.log('creating uniform location for', key);
        state.audioUniforms[key] = gl.getUniformLocation(program, key);
      }
    }


    for (const key in audioStatTrackers) {
      const statTracker = audioStatTrackers[key];
      for (let stat in statTracker.get()) {
        stat = stat.charAt(0).toUpperCase() + stat.slice(1);
        const uniformName = `${key}${stat}`;
        console.log(`creating uniform location for ${uniformName}`);
        state.audioUniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
    }

    // set uniform locations for each audio stat tracker
    for (const key in audioStatTrackers) {
      state.audioUniforms[`${key}ZScore`] = gl.getUniformLocation(program, `${key}ZScore`);
      state.audioUniforms[`${key}Mean`] = gl.getUniformLocation(program, `${key}Mean`);
      state.audioUniforms[`${key}StandardDeviation`] = gl.getUniformLocation(program, `${key}StandardDeviation`);
      state.audioUniforms[`${key}Min`] = gl.getUniformLocation(program, `${key}Min`);
      state.audioUniforms[`${key}Max`] = gl.getUniformLocation(program, `${key}Max`);
    }

    state.audioUniforms.beat = gl.getUniformLocation(program, "beat");


    // Set iChannel0 and iChannel1 locations if found
    // Set other uniform locations like iResolution and iTime
    state.iChannel0Location = iChannel0Location;
    state.iChannel1Location = iChannel1Location;
    state.iResolution = gl.getUniformLocation(program, "iResolution");
    state.iTime = gl.getUniformLocation(program, "iTime");

    return program;
  };

  createImageTexture = async (url) => {
    const { gl } = this;
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
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

  renderAudioData = () => {
    const { gl, audioData, state } = this;
    for (const key in audioData.features) {
      if (typeof audioData.features[key] === "number") {
        // Update the audio texture and corresponding uniform values

        const statTracker = this.audioStatTrackers[key];
        statTracker.set(audioData.features[key] || 0);

        gl.uniform1f(state.audioUniforms[key], audioData.features[key] || 0);
        tagObject(gl, state.audioUniforms[key], key);
      }
      const statTracker = this.audioStatTrackers.bpm;
      statTracker.set(audioData.bpm || 10);
      gl.uniform1f(state.audioUniforms.bpm, audioData.bpm || 10);
    }
  }

  renderAudioStatTrackers = () => {
    const { gl } = this;
    for (const key in this.audioStatTrackers) {
      const statTracker = this.audioStatTrackers[key];
      const { zScore, mean, standardDeviation, min, max } = statTracker.get();
      let keyName = `${key}ZScore`;
      gl.uniform1f(this.state.audioUniforms[keyName], zScore || -1);
      tagObject(gl, this.state.audioUniforms[keyName], keyName);

      keyName = `${key}Mean`;
      gl.uniform1f(this.state.audioUniforms[`${key}Mean`], mean || -1);
      tagObject(gl, this.state.audioUniforms[keyName], keyName);

      keyName = `${key}StandardDeviation`;
      gl.uniform1f(this.state.audioUniforms[`${key}StandardDeviation`], standardDeviation || -1);
      tagObject(gl, this.state.audioUniforms[keyName], keyName);

      keyName = `${key}Min`;
      gl.uniform1f(this.state.audioUniforms[`${key}Min`], min || -1);
      tagObject(gl, this.state.audioUniforms[keyName], keyName);

      keyName = `${key}Max`;
      gl.uniform1f(this.state.audioUniforms[`${key}Max`], max || -1);
      tagObject(gl, this.state.audioUniforms[keyName], keyName);

    }
    gl.uniform1f(this.state.audioUniforms.beat, this.isBeat());
  }
  render = () => {
    if (!this.running) return;
    const { gl, state } = this;
    const { pixels } = this;
    const { width, height } = this;
    gl.viewport(0, 0, width, height);

    gl.bindVertexArray(state.vao);
    gl.uniform3f(state.iResolution, width, height, 1.0);
    gl.uniform1f(state.iTime, (performance.now() - this.startTime) / 1000);

    this.writeAudioDataToTexture();
    gl.useProgram(state.program);
    gl.bindVertexArray(state.vao);

    // Set the texture for iChannel1
    if (state.iChannel1Location) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.uniform1i(state.iChannel1Location, 1);
    }

    if (state.iChannel0Location) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, state.audioTexture);
    }

    this.renderAudioData();
    this.renderAudioStatTrackers();

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

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
    this.render();
  };

  stop = () => {
    this.running = false;
  };
}

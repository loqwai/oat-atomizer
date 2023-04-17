const fetchShader = async (filename) => (await fetch(filename)).text()

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} url
 * @returns {Promise<WebGLShader>}
*/
export const createShader = async (gl, type, url) => {
  const shader = gl.createShader(type)
  const shaderSource = await fetchShader(url)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader, shaderSource)

  var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!status) {
    throw new Error(`Could not compile shader "${url}": ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/**
 * @param {number} n
 * @returns {number}
 */
export const toBytes = (n) => n * Float32Array.BYTES_PER_ELEMENT

/**
 * Tags webgl objects with names so that the debug helper extension can display them
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLTexture | WebGLProgram | WebGLVertexArrayObject | WebGLFramebuffer} obj
 * @param {string} tag
 * @returns
 */
export const tagObject = (gl, obj, tag) => {
  const ext = gl.getExtension('GMAN_debug_helper');
  if (!ext) return;
  ext.tagObject(obj, tag);
}


/**
 * Tags webgl objects with names so that the debug helper extension can display them
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLBuffer} buffer
 * @param {string} label
 * @param {number} bufferSize
 */
export function printResults(gl, buffer, label, bufferSize) {
  const results = new Float32Array(bufferSize);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.getBufferSubData(
    gl.ARRAY_BUFFER,
    0,    // byte offset into GPU buffer,
    results,
  );
  // print the results
  console.log(`${label}: ${results}`);
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
}
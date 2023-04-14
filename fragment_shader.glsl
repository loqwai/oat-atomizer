#version 300 es
precision mediump float;

in vec2 v_texcoord;
uniform sampler2D u_texture;
out vec4 outColor;

void main() {
  // vec2 coord = v_texcoord;
  // vec4 c = texture(u_texture, coord);
  // float v = c.r;
  // outColor = vec4(v, v, v, 1.0);

  vec2 coord = vec2(v_texcoord.x, 0.75);
  vec4 c = texture(u_texture, coord);

  // float v = c.r;
  // float v = 0.0;
  // if (v_texcoord.y == c.r) {
  //   v = 1.0;
  // }
  float v = 1.0 / (v_texcoord.y - c.r);

  outColor = vec4(v, v, v, 1.0);
}

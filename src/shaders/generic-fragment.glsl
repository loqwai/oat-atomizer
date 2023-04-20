#version 300 es

uniform sampler2D iChannel0;

// REPLACE_ME

void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}

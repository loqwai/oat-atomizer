#version 300 es
precision highp float;

in vec3 inPosition;

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(inPosition.x, inPosition.y, 0.0, 1.0);
}

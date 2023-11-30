#version 300 es

precision highp float;

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec3 iResolution;
uniform float iTime;
uniform int iIters;
out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
  vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;

    // Create a vertical gradient
  vec3 topColor = vec3(0.0f, 0.0f, 0.8f); // Medium blue
  vec3 bottomColor = vec3(0.4f, 0.0f, 0.6f); // Dark purple
  vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Sample the silhouette texture
  vec4 silhouetteColor = texture(iChannel1, uv); // Assuming the silhouette is in iChannel0

    // //Determine if the pixel should be part of the silhouette
  if(silhouetteColor.r < 0.01f) { // Adjust threshold as needed
    fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f); // Render silhouette
  } else {
    fragColor = vec4(gradientColor, 1.0f); // Render gradient
  }

}

void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

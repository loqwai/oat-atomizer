#version 300 es

precision highp float;

uniform sampler2D iChannel0; // Audio data texture
uniform sampler2D iChannel1; // Silhouette texture
uniform vec3 iResolution;
uniform float iTime;
uniform float iStarCenterX;
out vec4 fragColor;

// Function to create a fuzzy circle/star
float circle(vec2 uv, vec2 position, float radius) {
  float len = length(uv - position);
  return smoothstep(radius, radius - 0.01f, len);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
  vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;

    // Sample the audio texture for intensity
  float audioIntensity = texture(iChannel0, vec2(0.0f, 0.5f)).r;

    // Modify the speed of orbiting based on audio intensity
  float orbitSpeed = 1.0f;

    // Create a vertical gradient
  vec3 topColor = vec3(0.0f, 0.0f, 0.8f); // Medium blue
  vec3 bottomColor = vec3(0.4f, 0.0f, 0.6f); // Dark purple

  vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Calculate distortion radius based on star intensity and audio intensity
  float distortionRadius = audioIntensity * 0.05f; // Adjust the factor for the desired distortion radius
    // Offset the UV coordinates to create distortion
  vec2 distortedUV = uv + distortionRadius * (uv - 1.5f);

    // Sample the silhouette texture
  vec4 silhouetteColor = texture(iChannel1, uv);

    // Check if the silhouette is close to black, make it the gradient color; otherwise, make it black
  // silhouetteColor.rgb = mix(gradientColor, vec3(0.0f), step(0.1f, silhouetteColor.g));
    // Orbiting stars
  vec3 starColor = vec3(0.0f);
  for(int i = 0; i < 5; i++) {
    float angle = orbitSpeed * iTime + float(i) * 0.628f;
    vec2 starPos = vec2(0.5f) + iStarCenterX * vec2(cos(angle), sin(angle));
    float starSize = 0.0009f * pow(1.f + audioIntensity, 10.f);

    float starIntensity = circle(uv, starPos, starSize);

    // Check if the star is touching the silhouette
    float starDistance = texture(iChannel1, starPos).r;
    if(starDistance < 0.01f) {
      // Star overlaps with silhouette, make only the overlapping part dark red
      // inverse gradient

      vec3 altColor = mix(gradientColor, vec3(0.0f), step(0.1f, silhouetteColor.g));
      starColor += mix(starColor, altColor,starIntensity/audioIntensity);
      vec3 prevColor = texture(iChannel1, distortedUV).rgb;
      // invert prevColor
      // prevColor = vec3(1.0f) - prevColor;
      // if prevColor is not black, mix with starColor
      if(prevColor.r > 0.0f || prevColor.g > 0.0f || prevColor.b > 0.0f) {
        starColor = mix(starColor, prevColor, starIntensity * 0.1);
      }
    } else {
      // vec4 prevColor = texture(iChannel1, distortedUV);
      // starColor = mix(starColor, prevColor.rgb, 0.0001);
      gradientColor = mix(gradientColor, vec3(1.0f, 0.1f, 0.4f), pow(starDistance, 0.1) * starIntensity);
    }
  }

    // Combine the gradient and stars
  vec3 color = mix(gradientColor, starColor, step(0.01f, silhouetteColor.r));

  // if the current color is black, but the previous color isn't, use the previous color
  vec3 prevColor = texture(iChannel1, distortedUV).rgb;
  if( color.r < 0.1 && color.g < 0.1 && color.b < 0.1) {
    // use the inverse of the previous color
    color  = mix(color, prevColor, 0.1);

  }
  fragColor = vec4(color, silhouetteColor.a);
}

void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

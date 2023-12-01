#version 300 es

precision highp float;

uniform sampler2D iChannel0; // Audio data texture
uniform sampler2D iChannel1; // Silhouette texture
uniform vec3 iResolution;
uniform float iTime;
uniform float iStarCenterX;
uniform float spectralSpread;
out vec4 fragColor;

// Function to create a fuzzy circle/star
float circle(vec2 uv, vec2 position, float radius) {
  float len = length(uv - position);
  return smoothstep(radius, radius - 0.01f, len);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
  vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;
  float myTime = iTime * 0.001f;
    // Sample the audio texture for intensity
  float audioIntensity = texture(iChannel0, vec2(0.0f, 0.5f)).r;
  // get the high frequency content
  float highFreq = texture(iChannel0, vec2(0.0f, 0.75f)).r;
  // get the low frequency content
  float lowFreq = texture(iChannel0, vec2(0.0f, 0.25f)).r;

    // Modify the speed of orbiting based on audio intensity
  float orbitSpeed = 1.0f + spectralSpread * 10.0f;

    // Create a vertical gradient
  vec3 topColor = vec3(0.0f, 0.0f, 0.9f); // Medium blue
  vec3 bottomColor = vec3(0.4f, 0.0f, 0.6f); // Dark purple
  vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Calculate distortion radius based on star intensity and audio intensity
  float distortionRadius = audioIntensity * 0.005f; // Adjust the factor for the desired distortion radius
    // Offset the UV coordinates to create distortion
  vec4 silhouetteColor = texture(iChannel1, uv);

    // Check if the silhouette is close to black, make it the gradient color; otherwise, make it black
  // silhouetteColor.rgb = mix(gradientColor, vec3(0.0f), step(0.1f, silhouetteColor.g));
    // Orbiting stars
  vec3 starColor = vec3(0.0f);
  for(int i = 0; i < 5; i++) {
    float angle = orbitSpeed * myTime + float(i) * 0.628f;
    vec2 starPos = vec2(0.5f) + iStarCenterX * vec2(cos(angle), sin(angle));
    // half of the time, move the center of orbit to the left. The other half, move it to the right
    if(mod(myTime, 2000.0f) > 1000.0f) {
      starPos.x -= .01f;
    } else {
      starPos.x += .01f;
    }
    float starSize = 0.0009f * pow(1.f + audioIntensity, 10.f);
    // modulate starSize based off of the previous color
    float prevColor = texture(iChannel1, starPos).r;
    starSize = mix(starSize, starSize * 0.5f, prevColor);

    float starIntensity = circle(uv, starPos, starSize);

    // Check if the star is touching the silhouette
    float starDistance = texture(iChannel1, starPos).r;
    if(starDistance < 0.01f) {
      // set the star to bright red
      starColor = vec3(1.0f, 0.1f, 0.4f) * 1.f - starDistance;
      starColor = mix(gradientColor, starColor, starIntensity);
      if(audioIntensity > 0.7f) {
        gradientColor = mix(gradientColor, vec3(1.0f, 0.f, 0.f), 2.f);
      }
    } else {
      gradientColor = mix(gradientColor, vec3(1.0f, 0.1f, 0.4f), pow(starDistance, 0.1f) * starIntensity);
    }
  }

    // Combine the gradient and stars
  vec3 color = mix(gradientColor, starColor, step(0.01f, silhouetteColor.r));
  vec3 prevColor = texture(iChannel1, uv).rgb;
  vec2 currentUV = uv + distortionRadius * (uv - 1.5f);
  vec3 distortedPrevColor = texture(iChannel1, currentUV).rgb;
  if(distortedPrevColor.r > 0.1f) {
    color = mix(color, distortedPrevColor, 0.1f);
  }

  currentUV = uv - distortionRadius * (uv - 1.5f);
  distortedPrevColor = texture(iChannel1, currentUV).rgb;
  if(distortedPrevColor.r > 0.1f) {
    color = mix(color, distortedPrevColor, 0.1f);
  }
  currentUV.x = uv.y + distortionRadius * (uv.x - 1.5f) * cos(myTime);
  currentUV.y = uv.x - distortionRadius * (uv.y - 1.5f) * sin(myTime);
  distortedPrevColor = texture(iChannel1, currentUV).rgb;
  if(distortedPrevColor.g > 0.1f) {
    color = mix(color, distortedPrevColor, 0.1f);
  }
  // if the current pixel is black, add color based off of the high and low frequency content
  if(silhouetteColor.r < 0.1f) {
    color = mix(color, vec3(0.0f, lowFreq * 10.f / highFreq, 0.0f), 0.1f);
  }
  // if the distorted color and the current color are both dark, make the new one brighter
  if(distortedPrevColor.r < 0.1f && color.r < 0.1f) {
    color = mix(color, vec3(1.0f), 0.5f);
    color += distortedPrevColor;
  }
  // if the new color is much greyer than the previous color, make it the previous color
  // find the grayness of this color
  float grayness = abs(color.r - color.g) + abs(color.r - color.b) + abs(color.g - color.b);
  // find the grayness of the previous color
  float prevGrayness = abs(prevColor.r - prevColor.g) + abs(prevColor.r - prevColor.b) + abs(prevColor.g - prevColor.b);
  if(grayness > prevGrayness * 1.00001f) {
    vec3 shuffledPrevColor = vec3(prevColor.g, prevColor.r, prevColor.b);
    color = shuffledPrevColor;
  }
  // make the current color closer to the previous color
  color = mix(prevColor, color, 0.01f);
  // if the current color is too gray, don't use it
  if(abs(color.r - color.g) < 0.1f && abs(color.r - color.b) < audioIntensity * 0.05f) {
    // increase the contrast
    float maxColor = max(color.r, max(color.g, color.b));
    float minColor = min(color.r, min(color.g, color.b));
    if(sin(myTime + audioIntensity) > 0.0f) {
      color = vec3(maxColor * 1.5f, minColor * 0.1f, minColor * 0.1f);
    } else {
      color = vec3(minColor * 0.1f, maxColor * 1.5f, minColor * 0.1f);
    }
    if(cos(audioIntensity) > 0.0f) {
      color = vec3(minColor * 0.1f, minColor * 0.1f, maxColor * 1.5f);
    }
  }
  // add more red with spectral spread
  if(spectralSpread > 400.f) {
    color.r += spectralSpread * 0.00001f;
  }
  fragColor = vec4(color, silhouetteColor.a);
}

void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

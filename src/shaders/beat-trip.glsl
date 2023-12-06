#version 300 es
precision highp float;

uniform bool beat;
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel1; // Image texture
out vec4 fragColor;

vec4 getLastFrameColor(vec2 uv) {
  return texture(iChannel1, vec2(uv.x, iResolution.y - uv.y) / iResolution.xy);
}

// Function to convert RGB to HSL
vec3 rgb2hsl(vec3 color) {
    float maxColor = max(max(color.r, color.g), color.b);
    float minColor = min(min(color.r, color.g), color.b);
    float delta = maxColor - minColor;

    float h = 0.0;
    float s = 0.0;
    float l = (maxColor + minColor) / 2.0;

    if (delta != 0.0) {
        s = l < 0.5 ? delta / (maxColor + minColor) : delta / (2.0 - maxColor - minColor);

        if (color.r == maxColor) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
        } else if (color.g == maxColor) {
            h = (color.b - color.r) / delta + 2.0;
        } else {
            h = (color.r - color.g) / delta + 4.0;
        }
        h /= 6.0;
    }

    return vec3(h, s, l);
}

// Helper function for HSL to RGB conversion
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

// Function to convert HSL to RGB
vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    float r, g, b;

    if (s == 0.0) {
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }

    return vec3(r, g, b);
}

float getGrayPercent(vec4 color) {
    return (color.r + color.g + color.b) / 3.0;
}
// Function to apply a dynamic and beat-reactive distortion effect
vec4 applyDistortion(vec2 uv, float time, bool beat) {
    // Spatially varying hue rotation
    float hueOffset = sin(uv.x * 10.0 + uv.y * 10.0) * 0.5;

    // Beat-reactive hue rotation speed
    float hueRotationSpeed = beat ? 0.05 : 0.01;

    // Apply distortion (optional, based on your effect preference)
    float waveX = sin(uv.y * 20.0 + time) * 0.005;
    float waveY = cos(uv.x * 20.0 + time) * 0.005;
    // if the last frame's color was mostly red, increase the distortion
    waveX -= beat ? 0.1 : 0.;
    waveY += beat ? 0. : 0.1 ;


    vec2 distortedUv = uv + vec2(waveX, waveY);
    distortedUv = fract(distortedUv);

    // Sample the texture with distorted coordinates
    vec4 originalColor = texture(iChannel1, distortedUv);
    float grayPercent = getGrayPercent(originalColor);
    // the gray threshold is a function of time, and is beat-reactive. varies between 0.1 and 0.8
    float grayThreshold = 0.1 + 0.7 * sin(time * 0.1) * (beat ? 1.0 : 0.0);
    if(grayPercent > 0.1) {
      // get the originalColor by the inverted distortion uv
      // and modulated by the sin of time
      originalColor = texture(iChannel1, vec2(sin(time) - distortedUv.x, cos(time) - distortedUv.y));
      vec4 colorToMixIn =  beat? vec4(1.0, 0.0, 0.0, 1.0) : vec4(0.0, 0.0, 1.0, 1.0);
      originalColor = mix(originalColor, colorToMixIn, 0.1);
    }

    // Convert to HSL, apply spatially varied hue rotation, and convert back to RGB
    vec3 hslColor = rgb2hsl(originalColor.rgb);
    // if there's a beat, increas saturation
    hslColor.y += beat ? 0.5 : 0.0;
    hslColor.x += hueOffset + hueRotationSpeed * time; // Rotate the hue
    hslColor.x = fract(hslColor.x); // Ensure hue stays in the [0, 1] range

    vec3 rgbColor = hsl2rgb(hslColor);
    return vec4(rgbColor, 1.0);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;

    // Apply the beat-reactive distortion and color effect
    fragColor = applyDistortion(uv, iTime, beat);
}

void main(void) {
    vec4 color = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

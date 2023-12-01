#version 300 es

precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0; // Raw audio data texture
uniform sampler2D iChannel1; // FFT texture
// Additional uniforms for audio features
uniform float energy;
uniform float spectralCentroid;
uniform float zcr;
uniform float rms;

out vec4 FragColor; // Define the output color variable

void main() {
    // Normalize pixel coordinates to the range [-1, 1]
    vec2 uv = (gl_FragCoord.xy / iResolution.xy) * 2.0 - 1.0;

    // Time-based animation
    float time = iTime * 0.5;

    // Audio-reactive color based on energy
    vec3 color = vec3(energy, 1.0 - energy, 0.5);

    // Audio-reactive pattern based on spectral centroid
    float pattern = spectralCentroid * 2.0;

    // Kaleidoscope effect
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float kaleidoscope = mod(angle + time, pattern);

    // Apply kaleidoscope transformation
    uv = vec2(cos(kaleidoscope) * radius, sin(kaleidoscope) * radius);

    // Create an ever-changing pattern
    float patternValue = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time);

    // Final color
    vec3 finalColor = color * patternValue;

    FragColor = vec4(finalColor, 1.0); // Assign the output color
}

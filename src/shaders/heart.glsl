#version 300 es
precision highp float;

uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform float iTime;

uniform float anomaly;

uniform float energy;
uniform float spectralFlatness;
uniform float spectralCentroid;
uniform float spectralSpread;
uniform float spectralSkewness;
uniform float spectralKurtosis;
uniform float spectralCrest;
uniform float spectralSlope;
uniform float spectralRolloff;

out vec4 fragColor;


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
		uv *= 1.0 + spectralSpread * 0.01;
    // Center and scale
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    // Adjust heart size and position based on audio
    // uv.y -= 0.25 + bass * 0.1; // Move heart with bass
    float a = atan(uv.x, uv.y) / 3.1416;
    float r = length(uv) * (1.0 + energy * 0.5); // Scale with volume
    float h = abs(a) * sqrt(1.0 - r);

	  vec3 colorShift = vec3(spectralCentroid * 0.01, spectralSkewness * 0.01, spectralSpread * 0.01);

    // Color changes with treble
    vec3 heartColor = vec3(0,0,0);
		heartColor += colorShift;
    // Draw the heart
    vec3 col = (r < h) ? heartColor : vec3(1.0, 1.0, 1.0);

	    // Adjust glow based on Energy
    // float glowIntensity = g * (0.035 + 0.015 * energy);
    // vec3 glowColor = col + glowIntensity;

    // Background spectrum visualization
    float spectrum = texture(iChannel0, vec2(uv.x * 0.5 + 0.5, 0.0)).x;
    col = mix(col, vec3(spectrum, spectrum * 0.5, spectrum * 0.25), 0.5);

    // Adjust glow based on Energy

    // Output to screen
    fragColor = vec4(col, 1.0);
}


void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

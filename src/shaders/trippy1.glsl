#version 300 es
precision highp float;

uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform float iTime;
uniform float RADIUS;
uniform float SPEED;
uniform vec2 colorScheme1;
uniform vec2 colorScheme2;
uniform float colorSchemeMix;
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

// credit: https://www.shadertoy.com/view/ls3BDH
// ... existing shader code ...
// Palette function
vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);  // Base color
    vec3 b = vec3(0.5, 0.5, 0.5);  // Amplitude of the cosine waves
    vec3 c = vec3(1.0, 1.0, 1.0);  // Frequency of the cosine waves
    vec3 d = vec3(0.263,0.416,0.557);  // Phase shift of the cosine waves

    // Generating color using cosine waves
    return a + b * cos( 6.28318 * (c * t + d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * (1.5 + spectralFlatness * 0.5)) - 0.5; // Modify pattern based on spectral flatness

        float d = length(uv) * exp(-length(uv0) * energy); // Use energy to control the intensity

        vec3 col = palette(length(uv0) + i * .4 + iTime * .4 + spectralCentroid * 0.005); // Shift color palette with spectral centroid

        d = sin(d * (8. + spectralSkewness * 0.5) + iTime) / 8.; // Modify pattern with spectral skewness
        d = abs(d);

        d = pow(0.01 / d, 1.2 + spectralKurtosis * 0.01); // Use spectral kurtosis to control the sharpness

        finalColor += col * d * (1.0 + spectralCrest * 0.1); // Modify color intensity based on spectral crest
    }

    fragColor = vec4(finalColor, 1.0);
}


void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

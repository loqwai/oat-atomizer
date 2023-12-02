#version 300 es
precision highp float;

#define S smoothstep
#define PI 3.14159265359

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1; // Previous frame texture
uniform float spectralKurtosis;
uniform float energy;
uniform float spectralSkewness;

out vec4 fragColor;

// Function to tile the background with low opacity
vec3 TileBackground(vec2 uv) {
    vec2 tiledUV = fract(uv * vec2(10.0, 10.0));

    float bgAmplitude = 0.05 + 0.2 * energy; // Adjust background amplitude with energy

    vec3 bgColor = texture(iChannel1, tiledUV).rgb * bgAmplitude;
    return mix(vec3(0.0), bgColor, 0.9);
}

// Function to calculate color based on spectral skewness
vec3 CalculateWaveColor(float skewness) {
    float redFactor = 1.0 + skewness;
    float darkRedFactor = 0.6 + skewness;

    return vec3(redFactor, 0.0, darkRedFactor);
}

vec4 Line(vec2 uv, float speed, float height, vec3 col) {
    float waveAmplitude = 0.005 * spectralKurtosis;

    uv.y += S(1.0, 0.0, abs(uv.x)) * sin(iTime * speed + uv.x * height * 2.0) * waveAmplitude;

    float lineThickness = 0.008; // Make the line thinner
    col = clamp(col * 2.9, 0.0, 1.0);

    return vec4(S(0.06 * S(0.2, 0.9, abs(uv.x)), 0.0, abs(uv.y) - lineThickness) * col, 1.0) * S(1.1, 0.3, abs(uv.x));
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    vec3 col = vec3(0.0);

    col += TileBackground(uv);

    for (float i = 0.0; i <= 5.0; i += 1.0) {
        float t = i / 5.0;
        col += Line(p, 1.0 + t, 4.0 + t, vec3(0.2 + t * 0.7, 0.2 + t * 0.4, 0.3)).rgb;
    }

    vec4 lineColor1 = Line(p, 2.0, 6.0, vec3(1.0, 0.5, 0.0));
    col += lineColor1.rgb;

    vec4 lineColor2 = Line(p, 2.2, 5.5, vec3(0.5, 1.0, 0.0));
    col += lineColor2.rgb;

    float size = texture(iChannel0, vec2(0.1, 0.1)).x;

    vec4 lineColor3 = Line(p, PI, size * 2.0, CalculateWaveColor(spectralSkewness)); // Adjust wave size
    col += lineColor3.rgb;

    col /= 2.3;

    fragColor = vec4(col, 1.0);
}

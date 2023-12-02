#version 300 es
#define S smoothstep
#define PI 3.14159265359
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform float spectralSlopeZScore;
uniform float spectralSlopeStandardDeviation;
uniform float spectralCentroidZScore;
uniform float energyZScore;

const float waveAmplitudeFactor = 0.99; // Adjust this constant as needed

out vec4 fragColor;
uniform sampler2D iChannel0;

vec4 Line(vec2 uv, float speed, float height, vec3 col, float amplitudeFactor) {
    float waveAmplitude = 0.16 + waveAmplitudeFactor * (amplitudeFactor); // Adjust the effect of amplitudeFactor on the wave here

    uv.y += S(1.0, 0.0, abs(uv.x)) * sin((iTime + amplitudeFactor) * speed + uv.x * height) * waveAmplitude;

    float lineThickness = 0.006;
    col = clamp(col * 2.9, 0.0, 1.0);

    return vec4(S(0.06 * S(0.2, 0.9, abs(uv.x)), 0.0, abs(uv.y) - lineThickness) * col, 1.0) * S(1.1, 0.3, abs(uv.x));
}

float smoothPulse(float center, float width, float t) {
    return smoothstep(center - width, center + width, sin(t));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float amplitudeFactor = (spectralCentroidZScore +1.) / (energyZScore + 1. * 20.) * 3.;
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    vec3 col = vec3(0.0);

    for (float i = 0.0; i <= 5.0; i += 1.0) {
        float t = i / 5.0;
        col += Line(p, energyZScore + 1., 4.0 + t, vec3(0.0, 1.0, 0.0), amplitudeFactor).rgb;
    }

    vec4 lineColor1 = Line(p, 2.0 + amplitudeFactor, 6.0, vec3(1.0, 0.5, 0.0), amplitudeFactor);

    // make the line color redder with increasing spectralSlopeStandardDeviation
    lineColor1.rgb += spectralSlopeStandardDeviation * 0.5;

    col += lineColor1.rgb;

    vec4 lineColor2 = Line(p, 2.2 + amplitudeFactor * 0.5, 5.5, vec3(0.5, 1.0, 0.0), amplitudeFactor);
    col += lineColor2.rgb;

    float size = texture(iChannel0, vec2(0.1, 0.1)).x;

    vec4 lineColor3 = Line(p, PI + amplitudeFactor, size * 2.2, vec3(0.0, 1.0, 1.0), amplitudeFactor);

    col += lineColor3.rgb;

    col /= 2.3;

    fragColor = vec4(col, 1.0);
}

void main(void) {

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

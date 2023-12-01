#version 300 es
precision highp float;

#define S smoothstep
#define PI 3.14159265359

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

out vec4 fragColor;

vec4 Line(vec2 uv, float speed, float height, vec3 col) {
    highp float waveAmplitude = 0.1; // Reduce the wave amplitude

    uv.y += S(1.0, 0.0, abs(uv.x)) * sin(iTime * speed + uv.x * height) * waveAmplitude;

    highp float lineThickness = 0.016;
    col = clamp(col * 2.9, 0.0, 1.0);

    return vec4(S(0.06 * S(0.2, 0.9, abs(uv.x)), 0.0, abs(uv.y) - lineThickness) * col, 1.0) * S(1.1, 0.3, abs(uv.x));
}

void main() {
    highp vec2 uv = gl_FragCoord.xy / iResolution.xy;
    highp vec2 p = uv * 2.0 - 1.0;
    p.x *= iResolution.x / iResolution.y;

    highp vec3 col = vec3(0.0);

    for (highp float i = 0.0; i <= 5.0; i += 1.0) {
        highp float t = i / 5.0;
        col += Line(p, 1.0 + t, 4.0 + t, vec3(0.2 + t * 0.7, 0.2 + t * 0.4, 0.3)).rgb;
    }

    highp vec4 lineColor1 = Line(p, 2.0, 6.0, vec3(1.0, 0.5, 0.0));
    col += lineColor1.rgb;

    highp vec4 lineColor2 = Line(p, 2.2, 5.5, vec3(0.5, 1.0, 0.0));
    col += lineColor2.rgb;

    highp float size = texture(iChannel0, vec2(0.1, 0.1)).x;

    highp vec4 lineColor3 = Line(p, PI, size * 2.2, vec3(3.5, 8.7, 1.6));
    col += lineColor3.rgb;

    col /= 2.3;

    fragColor = vec4(col, 1.0);
}

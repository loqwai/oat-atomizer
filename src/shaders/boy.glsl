#version 300 es

precision highp float;

uniform sampler2D iChannel0; // Audio data texture
uniform sampler2D iChannel1; // Silhouette texture
uniform vec3 iResolution;
uniform float iTime;
out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
    vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;

    // Sample the audio texture
    float audioSample = texture(iChannel0, vec2(0.0, 0.5)).r; // Sampling a specific point in the audio texture

    // Create a vertical gradient affected by audio
    vec3 topColor = vec3(audioSample, 0.0, 0.8); // Audio affects the red channel
    vec3 bottomColor = vec3(0.4, audioSample, 0.6); // Audio affects the green channel
    vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Sample the silhouette texture
    vec4 silhouetteColor = texture(iChannel1, uv);

    // Determine if the pixel should be part of the silhouette
    if (silhouetteColor.r < 0.01) {
        fragColor = vec4(bottomColor, 1.0); // Render gradient unaffected by audio
    } else {
        fragColor = vec4(topColor, 1.0); // Render gradient affected by audio
    }
}

void main(void) {
    vec4 color = vec4(0);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

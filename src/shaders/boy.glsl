#version 300 es

precision highp float;

uniform sampler2D iChannel0; // Audio data texture
uniform sampler2D iChannel1; // Silhouette texture
uniform vec3 iResolution;
uniform float iTime;
out vec4 fragColor;

// Function to create a fuzzy circle/star
float circle(vec2 uv, vec2 position, float radius) {
    float len = length(uv - position);
    return smoothstep(radius, radius - 0.01, len);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
    vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;

    // Sample the audio texture for intensity
    float audioIntensity = texture(iChannel0, vec2(0.0, 0.5)).r;

    // Modify the speed of orbiting based on audio intensity
    float orbitSpeed = 1.0 + 2.0 * audioIntensity;

    // Create a vertical gradient
    vec3 topColor = vec3(0.0, 0.0, 0.8); // Medium blue
    vec3 bottomColor = vec3(0.4, 0.0, 0.6); // Dark purple
    vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Sample the silhouette texture
    vec4 silhouetteColor = texture(iChannel1, uv);
    // if the silhouette is close to black, make it the gradient color
    if(silhouetteColor.g < 0.1) {
        silhouetteColor.rgb = gradientColor;
    } else {
        // otherwise, make it black
        silhouetteColor.rgb = vec3(0.0);
    }

    // Orbiting stars
    vec3 starColor = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float angle = orbitSpeed * iTime + float(i) * 0.628;
        vec2 starPos = vec2(0.5) + 0.25 * vec2(cos(angle), sin(angle));
        float starSize = 0.02;
        float starIntensity = circle(uv, starPos, starSize);

        // Check if the star is touching the silhouette
        if (texture(iChannel1, starPos).r < 0.01) {
            // Star overlaps with silhouette, make only the overlapping part dark red
            starColor += vec3(starIntensity * (1.0 - silhouetteColor.r), 0.0, 0.0);
            // make the silhouette transparent
            silhouetteColor.rgb = mix(silhouetteColor.rgb, vec3(1.0, 0.0, 0.0), starIntensity);
        } else {
            gradientColor = mix(gradientColor, vec3(1.0, 1.0, 1.0), starIntensity);
        }
    }
    // Combine the gradient and stars
    vec3 color = mix(gradientColor, starColor, step(0.01, silhouetteColor.r));

    fragColor = vec4(color, silhouetteColor.a);
}

void main(void) {
    vec4 color = vec4(0);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}


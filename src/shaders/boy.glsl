#version 300 es

precision highp float;

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec3 iResolution;
uniform float iTime;
uniform int iIters;
out vec4 fragColor;



void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates
    vec2 uv = vec2(fragCoord.x, iResolution.y - fragCoord.y) / iResolution.xy;

    // Create a vertical gradient
    vec3 topColor = vec3(0.0, 0.0, 0.8); // Medium blue
    vec3 bottomColor = vec3(0.4, 0.0, 0.6); // Dark purple
    vec3 gradientColor = mix(bottomColor, topColor, uv.y);

    // Sample the silhouette texture
    vec4 silhouetteColor = texture(iChannel1, uv); // Assuming the silhouette is in iChannel0

    // //Determine if the pixel should be part of the silhouette
    // if (silhouetteColor.r < 0.1) { // Adjust threshold as needed
    //     fragColor = vec4(1.0, 0.0, 0.0, 1.0); // Render silhouette
    // } else {
    //      fragColor = vec4(0.,1.0,0.0,1.0); // Render silhouette
    // }
    fragColor = silhouetteColor;

    // fragColor = vec4(gradientColor, 1.0); // Render gradient
}

void main(void) {
	vec4 color = vec4(0);
	mainImage(color, gl_FragCoord.xy);
	fragColor = color;
}

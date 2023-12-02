#version 300 es

precision highp float;
out vec4 fragColor;

uniform sampler2D iChannel0; // Audio data texture
uniform sampler2D iChannel1; // Silhouette texture

uniform vec3 iResolution;
uniform float iTime;
uniform float energyZScore;
uniform float energy;
uniform float energyStandardDeviation;

// Function to render a colored bar based on a single uniform value and bar number
vec3 renderBar(float uniformValue, int barNumber, vec2 fragCoord)
{
    // Define the bar width and gap between bars
    float barWidth = 0.1; // Adjust the width as needed
    float barGap = 0.05;  // Adjust the gap as needed

    // Calculate the bar's start and end positions based on barNumber
    float barStart = float(barNumber) * (barWidth + barGap);
    float barEnd = barStart + barWidth;

    // Check if the current fragment is within the bar's bounds
    if (fragCoord.x >= (barStart * iResolution.x) && fragCoord.x <= (barEnd * iResolution.x)) {
        // Set the color of the bar based on uniform value (example colors)
        if (uniformValue >= 0.8) {
            return vec3(0.0, 1.0, 0.0); // Green color for high values
        } else if (uniformValue >= 0.4) {
            return vec3(1.0, 1.0, 0.0); // Yellow color for medium values
        } else {
            return vec3(1.0, 0.0, 0.0); // Red color for low values
        }
    } else {
        // Set the background color
        return vec3(0.0, 0.0, 0.0);
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec3 color1 = renderBar(energy, 0, fragCoord);
    vec3 color2 = renderBar(energyZScore, 1, fragCoord);
    vec3 color3 = renderBar(energyStandardDeviation, 2, fragCoord);

    // Combine the colors of the bars
    vec3 finalColor = color1 + color2 + color3;

    // Set the output color
    fragColor = vec4(finalColor, 1.0);
}

void main(void) {
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0); // Black color with alpha 1.0
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

#version 300 es
precision mediump float;

uniform bool beat;
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel1; // Image texture
uniform float spectralSpreadZScore;
uniform float spectralCentroidZScore;
uniform float energyZScore;
uniform float energyNormalized;
uniform float spectralCentroidNormalized;
out vec4 fragColor;
vec4 getLastFrameColor(vec2 uv) {
    return texture(iChannel1, vec2(uv.x, iResolution.y - uv.y) / iResolution.xy);
}

// Function to convert RGB to HSL
vec3 rgb2hsl(vec3 color) {
    float maxColor = max(max(color.r, color.g), color.b);
    float minColor = min(min(color.r, color.g), color.b);
    float delta = maxColor - minColor;

    float h = 0.0f;
    float s = 0.0f;
    float l = (maxColor + minColor) / 2.0f;

    if(delta != 0.0f) {
        s = l < 0.5f ? delta / (maxColor + minColor) : delta / (2.0f - maxColor - minColor);

        if(color.r == maxColor) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0f : 0.0f);
        } else if(color.g == maxColor) {
            h = (color.b - color.r) / delta + 2.0f;
        } else {
            h = (color.r - color.g) / delta + 4.0f;
        }
        h /= 6.0f;
    }

    return vec3(h, s, l);
}

// Helper function for HSL to RGB conversion
float hue2rgb(float p, float q, float t) {
    if(t < 0.0f)
        t += 1.0f;
    if(t > 1.0f)
        t -= 1.0f;
    if(t < 1.0f / 6.0f)
        return p + (q - p) * 6.0f * t;
    if(t < 1.0f / 2.0f)
        return q;
    if(t < 2.0f / 3.0f)
        return p + (q - p) * (2.0f / 3.0f - t) * 6.0f;
    return p;
}

// Function to convert HSL to RGB
vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    float r, g, b;

    if(s == 0.0f) {
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5f ? l * (1.0f + s) : l + s - l * s;
        float p = 2.0f * l - q;
        r = hue2rgb(p, q, h + 1.0f / 3.0f);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0f / 3.0f);
    }

    return vec3(r, g, b);
}

float getGrayPercent(vec3 color) {
    return (color.r + color.g + color.b) / 3.0f;
}
// Function to render the beam at specified coordinates with given colors
vec3 adventure(vec3 hairColor, vec3 bodyColor, vec3 legsColor, vec2 uv) {
    // Time-based transformation for the twisting, looping beam
    float time = iTime;
    float twist = sin(uv.y * 10.0 + time) * (energyNormalized/4.);
    uv.x += twist;

    // Directly use beamWidth to determine the width of the beam
    float beamWidth = 0.1; // Adjust this value to change the beam width
    float beam = smoothstep(beamWidth, 0.0, abs(uv.x));

    // Vertical color bands
    float third = 1.0 / 3.0; // One third of the height
    third += (energyNormalized/10.);
    vec3 color;
    if (uv.y > (1.7 * third)) {
        color = hairColor; // Top section: hair
    } else if (uv.y > third) {
        color = bodyColor; // Middle section: body
    } else {
        color = legsColor; // Bottom section: legs
    }

    // Apply the color to the beam
    if (beam > 0.01) {
        return color * beam; // Use beam as intensity mask
    } else {
        return vec3(0.0); // Transparent where beam is not present
    }
}

vec3 hslMix(vec3 color1, vec3 color2, float m) {
    vec3 hsl1 = rgb2hsl(color1);
    vec3 hsl2 = rgb2hsl(color2);
    // rotate color1 hue towards color2 hue by mix amount
    hsl1.x += (hsl2.x - hsl1.x) * m;
    // mix saturation and lightness
    hsl1.y += (hsl2.y - hsl1.y) * m;
    // hsl1.z += (hsl2.z - hsl1.z) * m;

    return hsl2rgb(hsl1);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv.x *= iResolution.x / iResolution.y; // Aspect ratio correction
    uv.y = (uv.y + 1.0) * 0.5; // Normalize uv.y to range from 0 to 1


    // marcy color variables
    vec3 marcyHairColor = vec3(0.07451, 0.043137, 0.168627); // dark purple for hair
    vec3 marcyBodyColor = vec3(0.45098, 0.458824, 0.486275); // gray skin
    vec3 marcyLegsColor = vec3(0.180392, 0.109804, 0.113725); // boots

    // bubblegum color variables
    vec3 bubblegumHairColor = vec3(0.988235, 0.278431, 0.756863); // pink hair
    vec3 bubblegumBodyColor = vec3(0.992157,0.745098,0.996078); // light pink skin
    vec3 bubblegumLegsColor = vec3(0.803922, 0.286275, 0.898039); // pink boots


    // Render the beam using the adventure function
    vec3 marcy = adventure(marcyHairColor, marcyBodyColor, marcyLegsColor, uv);

    vec3 bubble = adventure(bubblegumHairColor, bubblegumBodyColor, bubblegumLegsColor, uv);
    // combine the 2 beams as a function of the normalized energy, using hsl

    vec3 primaryBeamColor = spectralCentroidNormalized < 0.5 ? bubble : marcy;
    vec3 secondaryBeamColor = spectralCentroidNormalized < 0.5 ? marcy : bubble;
    vec3 primaryHairColor = spectralCentroidNormalized < 0.5 ? bubblegumHairColor : marcyHairColor;
    vec3 secondaryHairColor = spectralCentroidNormalized < 0.5 ? marcyHairColor : bubblegumHairColor;

    // vec3 primaryBeamColor = hslMix(bubble, marcy, energyNormalized);
    vec3 darkerPrevFrameColor = getLastFrameColor(fragCoord).rgb * 0.5;
    // if the previous frame color wasn't completely black, mix in the bubble
    if (getGrayPercent(darkerPrevFrameColor) > 0.1) {
        darkerPrevFrameColor = mix(secondaryHairColor, darkerPrevFrameColor, 0.5);
    }
    vec3 finalColor = (primaryBeamColor != vec3(0.0)) ? primaryBeamColor : darkerPrevFrameColor;
    // if the spectral centroid is high, make the beam more saturated
    // finalColor = mix(finalColor, hslMix(finalColor, bubblegumHairColor, spectralCentroidZScore), spectralCentroidZScore);
    finalColor = mix(finalColor, primaryBeamColor, 0.5);

    // Output to screen
    fragColor = vec4(finalColor, 1.0);
}


void main(void) {
    vec4 color = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

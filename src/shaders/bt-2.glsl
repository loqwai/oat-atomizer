#version 300 es
precision highp float;

uniform bool beat;
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel1; // Image texture
uniform float spectralSpreadZScore;
uniform float spectralSpread;
uniform float spectralCentroidZScore;
uniform float spectralCentroidMin;
uniform float spectralCentroidMax;
uniform float spectralCentroid;
uniform float energyZScore;
uniform float energyMin;
uniform float energyMax;
uniform float energy;
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

float getGrayPercent(vec4 color) {
    return (color.r + color.g + color.b) / 3.0f;
}
// Function to apply a dynamic and beat-reactive distortion effect
vec4 applyDistortion(vec2 uv, float time, bool beat) {
    float normalizedSpectralCentroid = (spectralCentroid - spectralCentroidMin) / (spectralCentroidMax - spectralCentroidMin);
    float normalizedEnergy = (energyZScore - energyMin) / (energyMax - energyMin);
    // Modify the hue rotation based on various factors
    float hueOffset = sin(uv.x * 10.0f + uv.y * 10.0f) * 0.5f;
    // float hueVariation = sin(time * spectralSpreadZScore) + cos(time * spectralCentroidZScore);

    // Beat-reactive hue rotation speed
    float hueRotationSpeed = beat ? 0.5f : 0.1f;

    // Apply distortion
    float waveX = sin(uv.y + time * energyZScore) * 0.005f;
    float waveY = cos(uv.x + time * energyZScore) * 0.005f;
    if(beat) {
        waveX *= 5.0f;
        waveY *= 5.0f;
    }
    if(spectralCentroidZScore > 2.5) {
        waveX *= -2.0f;
        waveY *= -2.0f;
    }
    if(spectralCentroidZScore < -2.5) {
        waveX *= 2.0f;
        waveY *= 2.0f;
    }
    vec2 distortedUv = uv + vec2(waveX, waveY);
    distortedUv = fract(distortedUv);

    // Sample the texture with distorted coordinates
    vec4 originalColor = texture(iChannel1, distortedUv);
    float grayPercent = getGrayPercent(originalColor);
    float grayMax = 0.2;
    float grayThreshold = grayMax * normalizedEnergy;
    if(beat) {
        grayThreshold = grayMax;
    }

    if(grayPercent > grayThreshold) {
       // convert color to hsl
         vec3 hslColor = rgb2hsl(originalColor.rgb);
         float contrastAmount = 0.4f;
         // if the z-score of the spectral centroid is greater than 2, increase the contrast
            hslColor.y += contrastAmount;
            hslColor.y = clamp(hslColor.y, 0.0f, 1.0f);
            originalColor.rgb = hsl2rgb(hslColor);
    }
    // pick a new hue based off of the spectral centroid
    float newHue = hue2rgb(normalizedSpectralCentroid, 1.0f, 0.5f);
    // mix this new color with the original color
    vec3 newColor = hsl2rgb(vec3(newHue, 0.0f, 0.8f));
    originalColor.rgb = mix(originalColor.rgb, newColor, 0.1);
    // if the z-score of the spectral centroid is greater than 2, invert the original color
    if(spectralCentroidZScore > 1.5) {
         vec3 hslColor = rgb2hsl(originalColor.rgb);
          hslColor.y += (1.0f - hslColor.y)/2.;
          originalColor.rgb = hsl2rgb(hslColor);
    }
    if (spectralCentroidZScore < -2.5) {
        // make it bluer
        vec3 hslColor = rgb2hsl(originalColor.rgb);
        hslColor.x += 0.5f;
        hslColor.x = fract(hslColor.x);
        originalColor.rgb = hsl2rgb(hslColor);
    }
    // if the z-score of the energy is greater than 2.5
    if(energyZScore > 2.5) {
        // look at the neighboring pixels last frame
        vec4 lastFrameColor = getLastFrameColor(uv);
        // if the last frame color is brighter than the current frame color
        if(getGrayPercent(lastFrameColor) > grayPercent) {
            // invert the color
            vec3 hslColor = rgb2hsl(originalColor.rgb);
            hslColor.y = 1.0f - hslColor.y;
            originalColor.rgb = hsl2rgb(hslColor);
        }

    }
    if (energyZScore < -2.5) {
        // make it darker
        vec3 hslColor = rgb2hsl(originalColor.rgb);
        hslColor.z -= 0.1f;
        hslColor.z = clamp(hslColor.z, 0.0f, 1.0f);
        originalColor.rgb = hsl2rgb(hslColor);
    }
    // if the z-score of the spectral spread is greater than 2, invert the original color
    if(spectralSpreadZScore > 2.5) {
       vec3 hslColor = rgb2hsl(originalColor.rgb);
        hslColor.y += (1.0f - hslColor.y)/2.;
        originalColor.rgb = hsl2rgb(hslColor);
    }
    if (spectralSpreadZScore < -2.5) {
        // make it bluer
        vec3 hslColor = rgb2hsl(originalColor.rgb);
        hslColor.x += 0.5f;
        hslColor.x = fract(hslColor.x);
        originalColor.rgb = hsl2rgb(hslColor);
    }

    return originalColor;
}
vec4 defragColor(
    in vec4 origColor,
    in vec2 uv
) {
    if(int(uv.x) % 100 == 0) return origColor;
    // look at the nearest 10 pixels, and see if they are the same color
    vec4 colors[100];
    for (int i = 0; i < 100; i++) {
        colors[i] = texture(iChannel1, uv + vec2(i, 0.));
        if (i == 0) continue;
        if (colors[i].r != colors[0].r || colors[i].g != colors[0].g || colors[0].b != colors[i].b) return origColor;
    }
    float angle = iTime * 0.1;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rotationMatrix = mat2(c, -s, s, c);
    vec2 rotatedUV = rotationMatrix * uv;
    vec4 color = texture(iChannel1, rotatedUV);
    vec3 hslColor = rgb2hsl(color.rgb);
    // make the saturation a function of time and x position
    hslColor.y = sin(iTime * 0.1 + uv.x * 0.1) * 0.5 + 0.5;
    // make the hue a function of time and y position
    hslColor.x = sin(iTime * 0.1 + uv.y * 0.1) * 0.5 + 0.5;
    color.rgb = hsl2rgb(hslColor);
    fract(color.rgb);
    return color;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    // if any of the base attributtes are -1, don't apply the effect
    if(spectralCentroidZScore == 0. || energyZScore == 0. || spectralSpreadZScore == 0.){
        fragColor = texture(iChannel1, uv);
        return;
    }
    vec4 color = vec4(0.);
    // Apply the beat-reactive distortion and color effect
    vec4 first = applyDistortion(uv, iTime, beat);
    vec4 second = -0.1 * applyDistortion(uv, iTime - 0.1f, beat);
    color = first + second;
    // if the z-score of the spectral centroid is greater than 2, make the color crazy different
    vec3 third = applyDistortion(uv, iTime * spectralCentroidZScore, beat).rgb;
    color.rgb = mix(color.rgb, third, energyZScore);
    vec4 fourth = applyDistortion(uv, spectralSpreadZScore, beat);
    color = mix(color, fourth, energyZScore / 3.);
    if (int(iTime) % 1000 == 0){
        color = defragColor(color, uv);
    }
    // if the color was still grayish in the end, just replace it with cool colors
    if (getGrayPercent(color) > 0.9) {
        vec3 hslColor = rgb2hsl(color.rgb);
        hslColor.x = sin(iTime * 0.1 + uv.y * 0.1) * 0.5 + 0.5;
        hslColor.y = sin(iTime * 0.1 + uv.x * 0.1) * 0.5 + 0.5;
        color.rgb = hsl2rgb(hslColor);
    }
    fragColor = fract(color);
}

void main(void) {
    vec4 color = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    mainImage(color, gl_FragCoord.xy);
    fragColor = color;
}

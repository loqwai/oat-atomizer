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
out vec4 fragColor;

// credit: https://www.shadertoy.com/view/ls3BDH

#define BEATMOVE 1

const float FREQ_RANGE = 64.0;
const float PI = 3.1415;
// const float RADIUS = 0.6;
const float BRIGHTNESS = 0.2;
// const float SPEED = 0.5;

//convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 mixHue(float hue1, float hue2, float amount) {
	vec3 color1 = hsv2rgb(vec3(hue1, 1.0, 1.0));
	vec3 color2 = hsv2rgb(vec3(hue2, 1.0, 1.0));
	return mix(color1, color2, amount);
}

vec3 value2rgb(float value) {
	vec3 color1 = mixHue(colorScheme1[0], colorScheme2[0], colorSchemeMix);
	vec3 color2 = mixHue(colorScheme1[1], colorScheme2[1], colorSchemeMix);

	return mix(color1, color2, fract(value * 0.23 + iTime * 0.12));
}

// use colorSchemeIndex to index in to a vector of 12 different colors that are equally spaced around the color wheel
// vec3 getColor() {
// 		// find mod 12 of the colorScheme

// 		// float hue = colorSchemeIndex % 12.0;
// 		// get the value after the decimal point and use it as the brightness
// 		// float brightness = fract(colorSchemeIndex);
// 		// return hsv2rgb(vec3(colorScheme[0][0], 1.0, 0.1));
// 		return colorScheme[0];
// }
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float getfrequency(float x) {
	return texture(iChannel0, vec2(floor(x * FREQ_RANGE + 1.0) / FREQ_RANGE, 0.25)).x + 0.06;
}

float getfrequency_smooth(float x) {
	float index = floor(x * FREQ_RANGE) / FREQ_RANGE;
    float next = floor(x * FREQ_RANGE + 1.0) / FREQ_RANGE;
	return mix(getfrequency(index), getfrequency(next), smoothstep(0.0, 1.0, fract(x * FREQ_RANGE)));
}

float getfrequency_blend(float x) {
    return mix(getfrequency(x), getfrequency_smooth(x), 0.5);
}

vec3 doHalo(vec2 fragment, float radius) {
	float dist = length(fragment);
	float ring = 1.0 / abs(dist - radius);

	float b = dist < radius ? BRIGHTNESS * 0.3 : BRIGHTNESS;

	vec3 col = vec3(0.0);

	float angle = atan(fragment.x, fragment.y);
	// col += hsv2rgb( vec3( ( angle + iTime * 0.25 ) / (PI * 2.0), 1.0, 1.0 ) ) * ring * b;
	col += value2rgb(angle) * ring * b;

	float frequency = max(getfrequency_blend(abs(angle / PI)) - 0.02, 0.0);
	col *= frequency;

	// Black halo
	col *= smoothstep(radius * 0.5, radius, dist);
	return col;
}

vec3 doLine(vec2 fragment, float radius, float x) {
	// vec3 col = hsv2rgb(vec3(x * 0.23 + iTime * 0.12, 1.0, 1.0));
	vec3 col = value2rgb(x);

	float freq = abs(fragment.x * 0.5);

	col *= (1.0 / abs(fragment.y)) * BRIGHTNESS * getfrequency(freq);
	col = col * smoothstep(radius, radius * 1.8, abs(fragment.x));

	return col;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 fragPos = fragCoord / iResolution.xy;
	fragPos = (fragPos - 0.5) * 2.0;
    fragPos.x *= iResolution.x / iResolution.y;

	vec3 color = vec3(0.0134, 0.052, 0.1);
	// color = getColor();
	// color = mix(color, doHalo(fragPos, RADIUS), 0.5);
	color += doHalo(fragPos, RADIUS);
	// mix in the color scheme
	// color = mix(color, getColor(colorSchemeIndex), 0.5);

    float c = cos(iTime * SPEED);
    float s = sin(iTime * SPEED);
    vec2 rot = mat2(c,s,-s,c) * fragPos;
	color += doLine(rot, RADIUS, rot.x);
	// mix in a color representing the number of anomalies
	vec3 anomalyColor = hsv2rgb(vec3((anomaly/ 5.0), 1.0, 1.0));
	color = mix(color, anomalyColor, 0.5);
	// color += max(luma(color) - 1.0, 0.0);

	fragColor = vec4(color, 1.0);
}

void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

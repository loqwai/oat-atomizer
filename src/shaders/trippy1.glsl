#version 300 es
precision highp float;

// uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform float iTime;

uniform float energy;
uniform float spectralFlatness;
uniform float spectralCentroid;
uniform float spectralSpread;
uniform float spectralSkewness;
uniform float spectralKurtosis;
uniform float spectralCrest;
uniform float spectralSlope;
uniform float spectralRolloff;
uniform float anomaly;
uniform float bpm;

out vec4 fragColor;

float smoothedEnergy = 0.0f;
float smoothedSpectralCentroid = 0.0f;
float smoothedSpectralSkewness = 0.0f;
float smoothedSpectralKurtosis = 0.0f;
float smoothedSpectralCrest = 0.0f;
float smoothedSpectralFlatness = 0.0f;

float smoothAndClamp(float value, float target, float smoothness) {
	return clamp(mix(value, target, smoothness), 0.0f, 1.0f);
}

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);

		if (anomaly > 0.0f) a = vec3(0.1, 0.1, 0.0);
		if(anomaly > 1.0f) a = vec3(0.3, 0.04, 0.0);
		if(anomaly > 2.0f) a = vec3(1.0, 0.0, 0.0);
		if(anomaly > 3.0f) a = vec3(1.0, 0.5, 0.0);
		if(anomaly > 4.0f) a = vec3(1.0, 1.0, 0.0);
		if(anomaly > 5.0f) a = vec3(0.0, 1.0, 0.0);

    vec3 b = vec3(smoothedSpectralSkewness/100., smoothedSpectralCrest/100., smoothedSpectralFlatness/100.);
		b = vec3(0.263,0.416,0.557);

    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

//https://www.shadertoy.com/view/mtyGWy
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	smoothedEnergy = smoothAndClamp(smoothedEnergy, energy, 0.01f);
	smoothedSpectralCentroid = smoothAndClamp(smoothedSpectralCentroid, spectralCentroid, 0.1f);
	smoothedSpectralSkewness = smoothAndClamp(smoothedSpectralSkewness, spectralSkewness, 0.1f);
	smoothedSpectralKurtosis = smoothAndClamp(smoothedSpectralKurtosis, spectralKurtosis, 0.1f);
	smoothedSpectralCrest = smoothAndClamp(smoothedSpectralCrest, spectralCrest, 0.1f);
	smoothedSpectralFlatness = smoothAndClamp(smoothedSpectralFlatness, spectralFlatness, 0.1f);

    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < anomaly + 4.; i++) {
        uv = fract(uv * 1.5) - 0.5;

         float d = length(uv) * exp(-length(uv0) * smoothedEnergy*2.); // Use energy to control the intensity
				float modulatedTime = iTime * bpm / 60.0f;
        vec3 col = palette(length(uv0) + i*.4 + modulatedTime*.4);

        d = sin(d*8. + modulatedTime)/8.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }

    fragColor = vec4(finalColor, 1.0);
}

void main(void) {
	vec4 color = vec4(0);
	mainImage(color, gl_FragCoord.xy);
	fragColor = color;
}

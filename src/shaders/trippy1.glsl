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

vec3 palette(float t) {
		// switch to different palletes based off of anomaly, a value between 0 and 5

	vec3 base = vec3(0.5f, 0.5f, 0.5f);  // Base color

	if(anomaly > 0.0f) {
		base = vec3(1.0f, 0, 0);
	}

		// rotate base by anomaly
		// base = mix(base, base.yzx, anomaly / 5.0);

	vec3 b = vec3(0.5f, 0.5f, 0.5f);  // Amplitude of the cosine waves
	vec3 c = vec3(1.0f, 1.0f, 1.0f);  // Frequency of the cosine waves
	vec3 d = vec3(0.263f, 0.416f, 0.557f * 1.0);  // Phase shift of the cosine waves

    // Generating color using cosine waves
	return base + b * cos(6.28318f * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;
	vec2 uv0 = uv;
	vec3 finalColor = vec3(0.0f);

	smoothedEnergy = smoothAndClamp(smoothedEnergy, energy, 0.01f);
	smoothedSpectralCentroid = smoothAndClamp(smoothedSpectralCentroid, spectralCentroid, 0.1f);
	smoothedSpectralSkewness = smoothAndClamp(smoothedSpectralSkewness, spectralSkewness, 0.1f);
	smoothedSpectralKurtosis = smoothAndClamp(smoothedSpectralKurtosis, spectralKurtosis, 0.1f);
	smoothedSpectralCrest = smoothAndClamp(smoothedSpectralCrest, spectralCrest, 0.1f);
	smoothedSpectralFlatness = smoothAndClamp(smoothedSpectralFlatness, spectralFlatness, 0.1f);

		// smoothedSpectralSkewness = smoothstep(smoothedSpectralSkewness, spectralSkewness, 0.1);
		// smoothedSpectralKurtosis = smoothstep(smoothedSpectralKurtosis, spectralKurtosis, 0.1);
		// smoothedSpectralCrest = smoothstep(smoothedSpectralCrest, spectralCrest, 0.1);
		// smoothedSpectralFlatness = smoothstep(smoothedSpectralFlatness, spectralFlatness, 0.1);

		// smoothedEnergy = 1.0;
		// smoothedSpectralCentroid = 1.0;
		// smoothedSpectralSkewness = 1.0;
		// smoothedSpectralKurtosis = 1.0;
		// smoothedSpectralCrest = 1.0;
		// smoothedSpectralFlatness = 1.0;

	for(float i = 0.0f; i < (spectralFlatness * 10.0f) + 4.f; i++) {
		uv = fract(uv * (1.5f + smoothedSpectralFlatness * 0.5f)) - 0.5f; // Modify pattern based on spectral flatness

		float d = length(uv) * exp(-length(uv0) * smoothedEnergy); // Use energy to control the intensity

		float bpmTimePeriod = 60.0f / bpm;
		float modulatedTime = mod(iTime, bpmTimePeriod) / bpmTimePeriod;

		vec3 col = palette(length(uv0) + i + modulatedTime); // Shift color palette with spectral centroid

    // Use BPM to modulate time

		d = sin(d * (8.f + smoothedSpectralSkewness * 0.5f)) / 8.f; // Modify pattern with spectral skewness
		d = abs(d);

		d = pow(0.01f / d, 1.2f + modulatedTime * 0.1f); // Use spectral kurtosis to control the sharpness

		finalColor += col * d * (1.0f + smoothedSpectralCrest * 0.1f); // Modify color intensity based on spectral crest
	}

	fragColor = vec4(finalColor, 1.0f);
}

void main(void) {
	vec4 color = vec4(0);
	mainImage(color, gl_FragCoord.xy);
	fragColor = color;
}

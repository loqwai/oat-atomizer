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

float smoothedEnergy = 0.0;
float smoothedSpectralCentroid = 0.0;
float smoothedSpectralSkewness = 0.0;
float smoothedSpectralKurtosis = 0.0;
float smoothedSpectralCrest = 0.0;
float smoothedSpectralFlatness = 0.0;

float smoothAndClamp(float value, float target, float smoothness) {
	return clamp(mix(value, target, smoothness), 0.0, 1.0);
}

vec3 palette( float t ) {
		// switch to different palletes based off of anomaly, a value between 0 and 5

    vec3 base = vec3(0.5, 0.5, 0.5);  // Base color

		if(anomaly > 0.0) {
			base = vec3(1.0, 0, 0);
		}

		// rotate base by anomaly
		// base = mix(base, base.yzx, anomaly / 5.0);

    vec3 b = vec3(0.5, 0.5, 0.5);  // Amplitude of the cosine waves
    vec3 c = vec3(1.0, 1.0, 1.0);  // Frequency of the cosine waves
    vec3 d = vec3(0.263,0.416,0.557);  // Phase shift of the cosine waves

    // Generating color using cosine waves
    return base + b * cos( 6.28318 * (c * t + d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

		smoothedEnergy = smoothAndClamp(smoothedEnergy, energy, 0.1);
		smoothedSpectralCentroid = smoothAndClamp(smoothedSpectralCentroid, spectralCentroid, 1.0);
		smoothedSpectralSkewness = smoothAndClamp(smoothedSpectralSkewness, spectralSkewness, 1.0);
		smoothedSpectralKurtosis = smoothAndClamp(smoothedSpectralKurtosis, spectralKurtosis, 1.0);
		smoothedSpectralCrest = smoothAndClamp(smoothedSpectralCrest, spectralCrest, 1.0);
		smoothedSpectralFlatness = smoothAndClamp(smoothedSpectralFlatness, spectralFlatness, 1.0);

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


    for (float i = 0.0; i < (spectralFlatness * 10.0) + 4.; i++) {
        uv = fract(uv * (1.5 + smoothedSpectralFlatness * 0.5)) - 0.5; // Modify pattern based on spectral flatness



        float d = length(uv) * exp(-length(uv0) * smoothedEnergy); // Use energy to control the intensity

        vec3 col = palette(length(uv0) + i  + smoothedSpectralCentroid * 0.1); // Shift color palette with spectral centroid

        d = sin(d * (8. + smoothedSpectralSkewness * 0.5)) / 8.; // Modify pattern with spectral skewness
        d = abs(d);

        d = pow(0.01 / d, 1.2 + smoothedSpectralKurtosis * 0.1); // Use spectral kurtosis to control the sharpness

        finalColor += col * d * (1.0 + smoothedSpectralCrest * 0.1); // Modify color intensity based on spectral crest
    }

    fragColor = vec4(finalColor, 1.0);
}


void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

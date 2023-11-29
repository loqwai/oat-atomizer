#version 300 es
precision highp float;

// uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform float iTime;

uniform sampler2D iChannel0;

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
float smoothedSpectralSpread = 0.0f;

float smoothAndClamp(float value, float target, float smoothness) {
	return clamp(mix(value, target, smoothness), 0.0f, 1.0f);
}//A small experiment


// Returns normalized value representing clock-wise angular distance between two vectors
// To get angular distance in radians multiply by 2PI, for degrees multiply by 360.

float NormAngle(vec2 a, vec2 b,int dir)
{
   vec2 r =  vec2(a.y,-a.x)*sign(float(dir));
    //is it on the right side?
   float rs = float(dot(r,b)>.0);
   //-1 to 1 re-mapped to 0.0 - 1
   float transformedDot = (1.0+dot(a,normalize(b)))/2.0;

   // for 0 deg - 180 deg: 0.0 - 0.5
   // for >180 deg: 0
   float rightSide = rs * (0.5* (1.0-transformedDot));

    // for 180 deg - 360 deg: 0.5 - 1.0
   // for < 180 deg: 0
   float leftSide = float(!(rs>0.0))*(0.5+transformedDot*0.5);

  return leftSide+rightSide;

}



// Draws indicator
void Ring(vec2 uv,vec2 position, float radius, float level,int dir, vec2 up, inout vec3 col)
{

    vec3 COL1 = vec3(1.0,0.0,0.0) * spectralFlatness; // full color
    if(int(anomaly) == 1) COL1 = vec3(0.,1.0,0.0);
    if(int(anomaly) == 2) COL1 = vec3(1.,1.0,0.0);
    vec3 COL2 = col;// middle part color
    if(int(anomaly) > 3) COL2 *= energy;
    if(length(position - uv) > radius) return; //is within bounds?
   // vec2 up = normalize(vec2(0.0,1.0)); // UP vector

    //Calculate angular distance
    float theta = NormAngle(up,uv-position,dir);

    //Addd full color gradient
    COL1 = mix(vec3(0.0,0.0,0.3),COL1,pow(theta,1.0/3.0));
    // rotate color by spectral centroid
    COL1 = mix(COL1,vec3(0.0),mod(theta+spectralCentroid,0.21));
  //  COL1 = mix(COL1,vec3(0.0),mod(theta,0.21));
    //Modify full color show level
    COL1 = mix(vec3(0.1,0.0,0.05)+col*0.7,COL1,float(theta<level));
    //output mix
    col = mix(COL2,COL1,float(length(position - uv) > radius-0.06));
    col /= spectralFlatness/1.;
}




void Bkg(inout vec3 col, vec2 fragCoord )
{
    vec3 COL1 = vec3(1.0,1.0,1.0);
    vec3 COL2 = vec3(1.0,0.0,1.0);
    vec2 uvorg = fragCoord;
    vec2 uv = uvorg - vec2(0.023,0.01);

    float grid = float(mod(floor(uv.x * 500.0),14.0) < 0.5);
    grid += float(mod(floor(uv.y * 200.0),11.0) < 0.4);
    grid = float(grid>0.5);

    vec2 uvn = 2.0 * uvorg - 1.0;
    grid *= 1.0-clamp(0.0,1.0,pow(length(uvn),6.6));;
    col = mix(COL1,COL2,length(uvn))*grid*0.03;

     // aquire frequency
    float fr = texture(iChannel0,vec2(uv.x,0.75)).x;
    //atenuate
    float i = pow(1.0-abs(uvorg.y+0.3-fr),90.0);
    i = max(0.01,i);
    col+= vec3(i)*0.2* mix(COL2,COL1,uvorg.x);
    // add vignetes
    col += vec3(0.06,0.0,0.01)*pow(length(2.0 * uv - 1.0),3.0)*0.8;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    float ar = iResolution.x/iResolution.y;
    uv.x *= ar;


    vec3 col = vec3(0.0);
     Bkg(col, uv/vec2(ar,1.0));

    float level = texture(iChannel0, vec2(0.01,0.25)).x;
    level += texture(iChannel0, vec2(0.1,0.25)).x;
    level += texture(iChannel0, vec2(0.15,0.25)).x;
    level /= 3.0;
    vec2 up = normalize(vec2(0.0,1.0));
    Ring(uv,vec2(0.5*ar,0.5),0.35+ 0.15*level,level,1,up,col);

    level = texture(iChannel0, vec2(0.2,0.25)).x;
    level += texture(iChannel0, vec2(0.25,0.25)).x;
    level += texture(iChannel0, vec2(0.27,0.25)).x;
    level /= 3.0;
    up = normalize(vec2(-1.0,0.0));
    Ring(uv,vec2(0.5*ar,0.5),0.2 + 0.13*level,level,1,up,col);

    level = texture(iChannel0, vec2(0.3,0.25)).x;
    level += texture(iChannel0, vec2(0.4,0.25)).x;
    level += texture(iChannel0, vec2(0.5,0.25)).x;
    level /= 3.0;
    up = normalize(vec2(0.0,-1.0));
    Ring(uv,vec2(0.5*ar,0.5),0.1 + 0.13*level,level,1,up,col);
    // Output to screen
    fragColor = vec4(col,1.0);
}
void main(void) {
  vec4 color = vec4(0);
  mainImage(color, gl_FragCoord.xy);
  fragColor = color;
}

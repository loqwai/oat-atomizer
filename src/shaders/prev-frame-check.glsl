#version 300 es
precision highp float;

uniform sampler2D iChannel1;// The texture of the previous frame
uniform vec3 iResolution;// The iResolution of the canvas
uniform float iTime;
uniform int frame;
out vec4 fragColor;

vec4 getLastFrameColor(vec2 uv){
  // I don't know why, but the texture is always flipped vertically
  return texture(iChannel1,uv);
}

vec4 mainImage(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  return getLastFrameColor(uv);

  if(frame==0){
    return vec4(.3529,.1882,.098,1.);
  }
  if(uv.x<.5){
    return getLastFrameColor(uv);
  }
  return vec4(0.,1.,1.,1.);
}

void main(){
  fragColor=mainImage();
}

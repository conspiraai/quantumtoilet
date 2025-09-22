precision mediump float;

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float swirl = sin(angle * 8.0 + uTime * 2.0);
  float glow = smoothstep(1.0, 0.0, radius);
  vec3 color = mix(uColorA, uColorB, swirl * 0.5 + 0.5);
  float depth = exp(-radius * 3.0);
  gl_FragColor = vec4(color * glow * depth, 1.0);
}

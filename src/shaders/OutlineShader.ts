export const OutlineVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const OutlineFragmentShader = `
uniform float outlineThickness;
uniform vec3 outlineColor;
uniform float outlineAlpha;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Calculate the rim factor based on the dot product of normal and view direction
  float rimFactor = 1.0 - abs(dot(normal, viewDir));
  
  // Apply power to control the outline thickness
  rimFactor = pow(rimFactor, outlineThickness);
  
  // Set the final color with rim-based alpha
  gl_FragColor = vec4(outlineColor, rimFactor * outlineAlpha);
}
`;
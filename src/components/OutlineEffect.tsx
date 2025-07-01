import React, { useMemo } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';

// Extend R3F with post-processing classes
extend({ EffectComposer, RenderPass, ShaderPass, UnrealBloomPass });

// Outline detection shader
const OutlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    resolution: { value: new THREE.Vector2() },
    outlineThickness: { value: 1.0 },
    outlineColor: { value: new THREE.Color(0x000000) },
    outlineAlpha: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec2 resolution;
    uniform float outlineThickness;
    uniform vec3 outlineColor;
    uniform float outlineAlpha;
    
    varying vec2 vUv;
    
    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * fragCoordZ - cameraFar);
      return viewZ;
    }
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      vec2 texelSize = 1.0 / resolution;
      float depth = readDepth(tDepth, vUv);
      
      // Sample neighboring depths
      float depthN = readDepth(tDepth, vUv + vec2(0.0, texelSize.y) * outlineThickness);
      float depthS = readDepth(tDepth, vUv + vec2(0.0, -texelSize.y) * outlineThickness);
      float depthE = readDepth(tDepth, vUv + vec2(texelSize.x, 0.0) * outlineThickness);
      float depthW = readDepth(tDepth, vUv + vec2(-texelSize.x, 0.0) * outlineThickness);
      
      // Calculate depth differences
      float depthDiffX = abs(depthE - depthW);
      float depthDiffY = abs(depthN - depthS);
      float depthDiff = max(depthDiffX, depthDiffY);
      
      // Threshold for edge detection
      float threshold = 0.1;
      float edge = step(threshold, depthDiff);
      
      // Mix original color with outline
      vec3 finalColor = mix(color.rgb, outlineColor, edge * outlineAlpha);
      
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
};

interface OutlineEffectProps {
  outlineThickness?: number;
  outlineColor?: THREE.Color;
  outlineAlpha?: number;
}

export function OutlineEffect({ 
  outlineThickness = 1.0, 
  outlineColor = new THREE.Color(0x000000),
  outlineAlpha = 0.8 
}: OutlineEffectProps) {
  const { gl, scene, camera, size } = useThree();
  
  const composer = useMemo(() => {
    const composer = new EffectComposer(gl);
    
    // Render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Outline pass
    const outlinePass = new ShaderPass(OutlineShader);
    outlinePass.uniforms.resolution.value.set(size.width, size.height);
    outlinePass.uniforms.outlineThickness.value = outlineThickness;
    outlinePass.uniforms.outlineColor.value = outlineColor;
    outlinePass.uniforms.outlineAlpha.value = outlineAlpha;
    outlinePass.uniforms.cameraNear.value = camera.near;
    outlinePass.uniforms.cameraFar.value = camera.far;
    composer.addPass(outlinePass);
    
    return composer;
  }, [gl, scene, camera, size.width, size.height, outlineThickness, outlineColor, outlineAlpha]);
  
  // Update composer size when canvas size changes
  React.useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  
  // Render the effect
  useFrame(() => {
    composer.render();
  }, 1);
  
  return null;
}
<template>
  <div ref="canvasContainer" class="three-canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';

const canvasContainer = ref(null);
let renderer, effectComposer, animationId, glitchInterval;

onMounted(() => {
  // --- 初始化场景 ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010118);
  scene.fog = new THREE.FogExp2(0x010118, 0.006);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(3, 1.5, 5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.5;
  canvasContainer.value.appendChild(renderer.domElement);

  // --- 后期特效 ---
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.3, 0.4, 0.85);
  bloomPass.threshold = 0.1; bloomPass.strength = 0.9; bloomPass.radius = 0.8;
  
  const glitchPass = new GlitchPass();
  glitchPass.goWild = false; glitchPass.enabled = true;
  
  const rgbShiftPass = new ShaderPass(RGBShiftShader);
  rgbShiftPass.uniforms['amount'].value = 0.005;
  
  const filmPass = new FilmPass(0.25, 0.5, 2048, false);
  filmPass.renderToScreen = true;
  
  effectComposer = new EffectComposer(renderer);
  effectComposer.addPass(renderScene);
  effectComposer.addPass(bloomPass);
  effectComposer.addPass(glitchPass);
  effectComposer.addPass(rgbShiftPass);
  effectComposer.addPass(filmPass);
  
  // 随机故障特效
  glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
          glitchPass.goWild = true;
          setTimeout(() => { glitchPass.goWild = false; }, 200);
      }
  }, 3000);

  // --- 核心几何体生成 (照搬你的优秀逻辑) ---
  const coreGeo = new THREE.IcosahedronGeometry(0.95, 0);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x33aaff, emissive: 0x2266cc, emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.2 });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat); scene.add(coreMesh);
  
  const innerMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending });
  const innerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 32), innerMat); scene.add(innerGlow);
  
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x0ff, wireframe: true, transparent: true, opacity: 0.35 });
  const wireframe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 0), wireMat); scene.add(wireframe);
  
  const knotMat = new THREE.MeshStandardMaterial({ color: 0xff44aa, emissive: 0x441133, emissiveIntensity: 0.5 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.05, 200, 32, 3, 4), knotMat); scene.add(knot);
  
  // 粒子系统
  const ringGeo = new THREE.BufferGeometry(); const ringPositions = new Float32Array(2500 * 3);
  for (let i = 0; i < 2500; i++) {
      const radius = 1.6 + Math.random() * 0.4; const angle = Math.random() * Math.PI * 2;
      ringPositions[i*3] = Math.cos(angle) * radius; ringPositions[i*3+1] = (Math.random() - 0.5) * 1.2; ringPositions[i*3+2] = Math.sin(angle) * radius;
  }
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
  const ringParticles = new THREE.Points(ringGeo, new THREE.PointsMaterial({ color: 0x0ff, size: 0.025, blending: THREE.AdditiveBlending })); scene.add(ringParticles);
  
  const dustGeo = new THREE.BufferGeometry(); const dustPositions = new Float32Array(1800 * 3);
  for (let i = 0; i < 1800; i++) {
      dustPositions[i*3] = (Math.random() - 0.5) * 5; dustPositions[i*3+1] = (Math.random() - 0.5) * 3; dustPositions[i*3+2] = (Math.random() - 0.5) * 5;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustCloud = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x88aaff, size: 0.015, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending })); scene.add(dustCloud);
  
  const gridHelper = new THREE.GridHelper(18, 40, 0x00aaff, 0x3366aa); gridHelper.position.y = -1.4; gridHelper.material.transparent = true; gridHelper.material.opacity = 0.25; scene.add(gridHelper);
  
  const ringFloor = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 64, 200), new THREE.MeshStandardMaterial({ color: 0x0ff, emissive: 0x0aa, emissiveIntensity: 0.6 }));
  ringFloor.rotation.x = Math.PI / 2; ringFloor.position.y = -1.2; scene.add(ringFloor);

  // 光源
  scene.add(new THREE.AmbientLight(0x111122));
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2); mainLight.position.set(2, 3, 4); scene.add(mainLight);
  scene.add(new THREE.PointLight(0x3366ff, 0.6).position.set(-1, 2, 2));
  const movingLight = new THREE.PointLight(0x00ffff, 0.8); scene.add(movingLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05; controls.enableZoom = false;

  let time = 0;
  const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.016;
      coreMesh.rotation.set(Math.sin(time * 0.3) * 0.2, time * 0.5, Math.cos(time * 0.4) * 0.15);
      wireframe.rotation.copy(coreMesh.rotation); innerGlow.rotation.copy(coreMesh.rotation);
      knot.rotation.set(time * 0.2, time * 0.3, time * 0.1);
      ringParticles.rotation.set(Math.sin(time * 0.2) * 0.1, time * 0.15, 0);
      dustCloud.rotation.set(time * 0.03, time * 0.05, 0);
      const scaleRing = 1 + Math.sin(time * 2.5) * 0.05; ringFloor.scale.set(scaleRing, scaleRing, 1);
      movingLight.position.set(Math.sin(time) * 2.5, 1 + Math.sin(time * 1.2) * 1, Math.cos(time * 0.7) * 2.5);
      rgbShiftPass.uniforms['amount'].value = 0.005 + Math.sin(time * 1.8) * 0.002;
      controls.update();
      effectComposer.render();
  };
  animate();

  window.addEventListener('resize', onWindowResize);
  function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      effectComposer.setSize(window.innerWidth, window.innerHeight); renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// 组件卸载时清理内存，防止内存泄漏
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  clearInterval(glitchInterval);
  window.removeEventListener('resize', onWindowResize);
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.three-canvas-container {
  position: absolute;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 0; /* 垫底 */
  pointer-events: auto; /* 允许鼠标拖拽视角 */
}
</style>
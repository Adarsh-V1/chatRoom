"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(128, 128, 12, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.28, "rgba(186,230,253,0.95)");
  gradient.addColorStop(0.58, "rgba(56,189,248,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

function createOrbitRing(radiusX: number, radiusY: number, color: string, opacity: number) {
  const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(220).map((point) => new THREE.Vector3(point.x, point.y, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  });

  return {
    line: new THREE.LineLoop(geometry, material),
    geometry,
    material,
  };
}

export function HeroScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const root = new THREE.Group();
    root.position.set(0, 0.2, 0);
    scene.add(root);

    const glowTexture = createGlowTexture();
    if (glowTexture) {
      textures.push(glowTexture);
    }

    const auraBackMaterial = new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      color: "#67e8f9",
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const auraFrontMaterial = new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      color: "#fbbf24",
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(auraBackMaterial, auraFrontMaterial);

    const auraBack = new THREE.Sprite(auraBackMaterial);
    auraBack.scale.set(7.8, 7.8, 1);
    auraBack.position.set(-0.3, 0.15, -1.3);
    scene.add(auraBack);

    const auraFront = new THREE.Sprite(auraFrontMaterial);
    auraFront.scale.set(5.4, 5.4, 1);
    auraFront.position.set(1.15, -1.2, 0.4);
    scene.add(auraFront);

    const shellGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.1, 1));
    const shellMaterial = new THREE.LineBasicMaterial({
      color: "#93c5fd",
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    geometries.push(shellGeometry);
    materials.push(shellMaterial);
    const shell = new THREE.LineSegments(shellGeometry, shellMaterial);
    shell.rotation.set(0.6, 0.2, -0.4);
    root.add(shell);

    const knotGeometry = new THREE.TorusKnotGeometry(1.48, 0.34, 220, 28);
    const knotMaterial = new THREE.MeshBasicMaterial({
      color: "#e0f2fe",
      wireframe: true,
      transparent: true,
      opacity: 0.48,
    });
    geometries.push(knotGeometry);
    materials.push(knotMaterial);
    const knot = new THREE.Mesh(knotGeometry, knotMaterial);
    knot.rotation.set(Math.PI / 5, 0.45, 0.2);
    root.add(knot);

    const accentGeometry = new THREE.TorusKnotGeometry(0.92, 0.18, 180, 22, 2, 5);
    const accentMaterial = new THREE.MeshBasicMaterial({
      color: "#67e8f9",
      wireframe: true,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
    });
    geometries.push(accentGeometry);
    materials.push(accentMaterial);
    const accentKnot = new THREE.Mesh(accentGeometry, accentMaterial);
    accentKnot.rotation.set(-0.45, 0.2, 0.7);
    root.add(accentKnot);

    const orbitRings = [
      createOrbitRing(2.55, 1.8, "#7dd3fc", 0.28),
      createOrbitRing(2.1, 2.95, "#7dd3fc", 0.18),
      createOrbitRing(3.15, 1.35, "#f59e0b", 0.14),
    ];
    orbitRings.forEach(({ line, geometry, material }, index) => {
      geometries.push(geometry);
      materials.push(material);
      line.rotation.x = index === 0 ? Math.PI / 2.8 : index === 1 ? Math.PI / 1.9 : Math.PI / 2.2;
      line.rotation.y = index === 2 ? Math.PI / 4.2 : Math.PI / 5.6;
      line.rotation.z = index === 1 ? Math.PI / 5 : Math.PI / 8;
      root.add(line);
    });

    const networkPointCount = 86;
    const networkPositions = new Float32Array(networkPointCount * 3);
    const networkPoints: Array<[number, number, number]> = [];

    for (let index = 0; index < networkPointCount; index += 1) {
      const radius = 2.1 + Math.random() * 1.35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      networkPositions[index * 3] = x;
      networkPositions[index * 3 + 1] = y;
      networkPositions[index * 3 + 2] = z;
      networkPoints.push([x, y, z]);
    }

    const networkGeometry = new THREE.BufferGeometry();
    networkGeometry.setAttribute("position", new THREE.BufferAttribute(networkPositions, 3));
    const networkMaterial = new THREE.PointsMaterial({
      color: "#ecfeff",
      size: 0.055,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    geometries.push(networkGeometry);
    materials.push(networkMaterial);
    const network = new THREE.Points(networkGeometry, networkMaterial);
    root.add(network);

    const lineVertices: number[] = [];
    for (let i = 0; i < networkPoints.length; i += 1) {
      for (let j = i + 1; j < networkPoints.length; j += 1) {
        const a = networkPoints[i];
        const b = networkPoints[j];
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < 1.52) {
          lineVertices.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lineVertices, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: "#67e8f9",
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
    });
    geometries.push(lineGeometry);
    materials.push(lineMaterial);
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    root.add(lines);

    const dustCount = 180;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      const radius = 3.9 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      dustPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      dustPositions[index * 3 + 2] = radius * Math.cos(phi);
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: "#f8fafc",
      size: 0.045,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    geometries.push(dustGeometry);
    materials.push(dustMaterial);
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    scene.add(new THREE.AmbientLight("#eff6ff", 1.4));

    const directional = new THREE.DirectionalLight("#67e8f9", 1.8);
    directional.position.set(4.2, 2.8, 6);
    scene.add(directional);

    const pointer = { x: 0, y: 0 };
    let impulse = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const handlePointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };

    const handlePointerDown = () => {
      impulse = 1;
    };

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.position.z = width < 768 ? 9.3 : 8.2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);

      const t = performance.now() * 0.00045;
      const pulse = (Math.sin(t * 3.2) + 1) * 0.5;
      impulse += (0 - impulse) * 0.075;

      root.position.x += (pointer.x * 0.55 - root.position.x) * 0.04;
      root.position.y += (pointer.y * 0.4 + 0.2 - root.position.y) * 0.04;
      root.rotation.y = t * 0.62 + pointer.x * 0.18;
      root.rotation.x = Math.sin(t * 1.4) * 0.1 + pointer.y * 0.12;
      root.scale.setScalar(1 + pulse * 0.035 + impulse * 0.1);

      camera.position.x += (pointer.x * 0.45 - camera.position.x) * 0.03;
      camera.position.y += (pointer.y * 0.35 - camera.position.y) * 0.03;
      camera.lookAt(0, 0.1, 0);

      knot.rotation.x = Math.PI / 5 + t * 0.55;
      knot.rotation.y = 0.45 + t * 0.32;
      knot.rotation.z = Math.sin(t * 2.4) * 0.08;

      accentKnot.rotation.x = -0.45 - t * 0.48;
      accentKnot.rotation.y = 0.2 + t * 0.72;
      accentKnot.rotation.z = 0.7 + Math.cos(t * 2.1) * 0.12;

      shell.rotation.x = 0.6 - t * 0.16;
      shell.rotation.y = 0.2 + t * 0.22;
      shell.rotation.z = -0.4 + Math.sin(t * 1.6) * 0.08;

      orbitRings[0].line.rotation.z += 0.0026;
      orbitRings[1].line.rotation.y -= 0.002;
      orbitRings[2].line.rotation.x += 0.0015;
      orbitRings[2].line.rotation.z -= 0.0022;

      network.rotation.y = -t * 0.42;
      lines.rotation.y = t * 0.3;
      dust.rotation.y = t * 0.08;
      dust.rotation.x = -t * 0.05;

      auraBackMaterial.opacity = 0.12 + pulse * 0.08 + impulse * 0.12;
      auraFrontMaterial.opacity = 0.1 + pulse * 0.06 + impulse * 0.08;
      shellMaterial.opacity = 0.14 + pulse * 0.08;
      knotMaterial.opacity = 0.4 + pulse * 0.06 + impulse * 0.08;
      accentMaterial.opacity = 0.22 + pulse * 0.08;
      lineMaterial.opacity = 0.1 + pulse * 0.08 + impulse * 0.05;

      renderer.render(scene, camera);
    };

    resize();
    tick();

    window.addEventListener("resize", resize);
    mount.addEventListener("pointermove", handlePointerMove);
    mount.addEventListener("pointerleave", handlePointerLeave);
    mount.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", handlePointerMove);
      mount.removeEventListener("pointerleave", handlePointerLeave);
      mount.removeEventListener("pointerdown", handlePointerDown);

      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}

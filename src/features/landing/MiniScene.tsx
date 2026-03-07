"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function MiniScene({ hue = 165 }: { hue?: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const group = new THREE.Group();
    scene.add(group);

    const color = new THREE.Color(`hsl(${hue} 82% 58%)`);
    const accent = new THREE.Color(`hsl(${(hue + 28) % 360} 92% 76%)`);
    const star = new THREE.Color("#e0f2fe");

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.34, 24, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
      })
    );
    group.add(halo);

    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.05, 2),
      new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      })
    );
    group.add(orb);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.08, 20, 80),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.72,
      })
    );
    ring.rotation.x = 1.2;
    ring.rotation.y = 0.5;
    group.add(ring);

    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshBasicMaterial({
        color: accent,
      })
    );
    satellite.position.set(1.15, -0.6, 0.8);
    group.add(satellite);

    const starPositions = new Float32Array(24 * 3);
    const starColors = new Float32Array(24 * 3);
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 2 + (i % 5) * 0.08;
      starPositions[i * 3] = Math.cos(angle) * radius;
      starPositions[i * 3 + 1] = Math.sin(angle) * radius * 0.7;
      starPositions[i * 3 + 2] = (i % 3) * 0.06;
      starColors[i * 3] = star.r;
      starColors[i * 3 + 1] = star.g;
      starColors[i * 3 + 2] = star.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.06,
        transparent: true,
        opacity: 0.9,
        vertexColors: true,
      })
    );
    group.add(stars);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      const t = performance.now() * 0.001;
      halo.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
      orb.rotation.x = t * 0.7;
      orb.rotation.y = t * 0.9;
      ring.rotation.z = -t * 0.8;
      stars.rotation.z = t * 0.18;
      satellite.position.x = Math.cos(t * 1.5) * 1.25;
      satellite.position.y = Math.sin(t * 1.5) * 0.7;
      renderer.render(scene, camera);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      halo.geometry.dispose();
      (halo.material as THREE.Material).dispose();
      orb.geometry.dispose();
      (orb.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      satellite.geometry.dispose();
      (satellite.material as THREE.Material).dispose();
      starGeometry.dispose();
      (stars.material as THREE.Material).dispose();
    };
  }, [hue]);

  return (
    <div ref={mountRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}

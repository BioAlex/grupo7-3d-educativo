import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimulationDef, SceneElement } from '../types/simulation';
import { soundFx } from '../utils/audio';

interface ThreeSimulationCanvasProps {
  simulation: SimulationDef;
  parameterValues: Record<string, number>;
  onSelectElement: (element: SceneElement) => void;
  selectedElementId: string | null;
  isPlaying: boolean;
  playbackSpeed: number;
}

export const ThreeSimulationCanvas: React.FC<ThreeSimulationCanvasProps> = ({
  simulation,
  parameterValues,
  onSelectElement,
  selectedElementId,
  isPlaying,
  playbackSpeed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const particlesMapRef = useRef<Map<string, { points: THREE.Points; origPositions: Float32Array; type: string }>>(
    new Map()
  );
  const animationFrameId = useRef<number | null>(null);

  // Mouse orbit controls state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const sphericalCoordsRef = useRef({ radius: 14, theta: Math.PI / 4, phi: Math.PI / 3 });
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Tooltip & hovering state
  const [hoveredElement, setHoveredElement] = useState<SceneElement | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Initialize and tear down Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(simulation.environment.background || '#0f172a');

    if (simulation.environment.fogColor) {
      scene.fog = new THREE.FogExp2(
        simulation.environment.fogColor,
        simulation.environment.fogDensity || 0.015
      );
    }

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      simulation.camera.fov || 50,
      width / height,
      0.1,
      1000
    );
    const [camX, camY, camZ] = simulation.camera.position;
    camera.position.set(camX, camY, camZ);
    const [targetX, targetY, targetZ] = simulation.camera.lookAt || [0, 0, 0];
    targetLookAtRef.current.set(targetX, targetY, targetZ);
    camera.lookAt(targetLookAtRef.current);
    cameraRef.current = camera;

    // Init spherical coords from camera position relative to target
    const offset = new THREE.Vector3().subVectors(camera.position, targetLookAtRef.current);
    const radius = offset.length();
    sphericalCoordsRef.current = {
      radius: Math.max(4, Math.min(60, radius)),
      theta: Math.atan2(offset.x, offset.z),
      phi: Math.acos(Math.max(-1, Math.min(1, offset.y / (radius || 1)))),
    };

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(
      simulation.environment.ambientLightColor || '#ffffff',
      simulation.environment.ambientLightIntensity || 0.8
    );
    scene.add(ambientLight);

    const [lx, ly, lz] = simulation.environment.mainLightPosition || [5, 10, 5];
    const dirLight = new THREE.DirectionalLight('#ffffff', simulation.environment.mainLightIntensity || 1.2);
    dirLight.position.set(lx, ly, lz);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#334155', 0.4);
    scene.add(hemiLight);

    // 5. Optional Stars background
    if (simulation.environment.stars) {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 450;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 120;
        starPos[i + 1] = (Math.random() - 0.5) * 120;
        starPos[i + 2] = (Math.random() - 0.5) * 120;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        opacity: 0.8,
      });
      const starPoints = new THREE.Points(starGeo, starMat);
      scene.add(starPoints);
    }

    // 6. Build Scene Elements
    meshesMapRef.current.clear();
    particlesMapRef.current.clear();

    simulation.elements.forEach((elem) => {
      const obj = createElementMesh(elem);
      if (obj) {
        obj.userData = { elementId: elem.id, element: elem };
        scene.add(obj);
        meshesMapRef.current.set(elem.id, obj);
      }
    });

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [simulation.id]);

  // Create Three.js meshes based on SceneElement type
  const createElementMesh = (elem: SceneElement): THREE.Object3D | null => {
    const [px, py, pz] = elem.position;
    const [sx, sy, sz] = elem.scale || [1, 1, 1];
    const [rx, ry, rz] = elem.rotation || [0, 0, 0];

    let mesh: THREE.Object3D | null = null;
    const baseColor = new THREE.Color(elem.color);

    if (elem.type === 'particle_system') {
      const count = 180;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 3;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: baseColor,
        size: 0.28,
        transparent: true,
        opacity: elem.opacity || 0.8,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geo, mat);
      points.position.set(px, py, pz);

      particlesMapRef.current.set(elem.id, {
        points,
        origPositions: new Float32Array(pos),
        type: elem.animation?.type || 'particle_fountain',
      });
      return points;
    }

    if (elem.type === 'cloud_group') {
      const group = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.1,
      });

      const offsets = [
        [0, 0, 0, 1.2],
        [-1.1, -0.2, 0, 0.9],
        [1.1, -0.2, 0, 0.9],
        [-0.5, 0.6, 0.2, 0.85],
        [0.6, 0.5, -0.2, 0.8],
      ];
      offsets.forEach(([ox, oy, oz, r]) => {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), cloudMat);
        ball.position.set(ox, oy, oz);
        group.add(ball);
      });

      group.position.set(px, py, pz);
      group.scale.set(sx, sy, sz);
      return group;
    }

    if (elem.type === 'water_surface') {
      const geo = new THREE.CylinderGeometry(sx / 2, sx / 2, 0.4, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        transparent: true,
        opacity: elem.opacity || 0.85,
        roughness: 0.1,
        metalness: 0.2,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      return mesh;
    }

    if (elem.type === 'magnetic_field') {
      const group = new THREE.Group();
      const lineCount = 12;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(-2.2, 0, 0),
          new THREE.Vector3(-1.0, Math.sin(angle) * 2.2, Math.cos(angle) * 2.2),
          new THREE.Vector3(1.0, Math.sin(angle) * 2.2, Math.cos(angle) * 2.2),
          new THREE.Vector3(2.2, 0, 0)
        );
        const points = curve.getPoints(24);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.55,
        });
        const line = new THREE.Line(geo, mat);
        group.add(line);
      }
      group.position.set(px, py, pz);
      return group;
    }

    if (elem.type === 'ring') {
      const group = new THREE.Group();
      // Inner planet sphere
      const planetMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.7 });
      const planet = new THREE.Mesh(new THREE.SphereGeometry(sx * 0.55, 32, 32), planetMat);
      group.add(planet);

      // Rings
      const ringGeo = new THREE.RingGeometry(sx * 0.75, sx * 1.35, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      group.add(ring);

      group.position.set(px, py, pz);
      return group;
    }

    if (elem.type === 'cutaway_sphere') {
      // Create a cutaway sphere showing layers
      const geo = new THREE.SphereGeometry(sx, 32, 32, 0, Math.PI * 1.5, 0, Math.PI);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        side: THREE.DoubleSide,
        roughness: 0.6,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      return mesh;
    }

    let geometry: THREE.BufferGeometry;
    switch (elem.type) {
      case 'sphere':
      case 'sun_glow':
        geometry = new THREE.SphereGeometry(sx, 32, 32);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(sx, sy, sz);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(sx / 2, sy, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(sx, sy / 3, 16, 48);
        break;
      case 'arrow':
        geometry = new THREE.ConeGeometry(sx, sy, 16);
        break;
      case 'leaf_shape': {
        geometry = new THREE.SphereGeometry(sx, 16, 16);
        break;
      }
      default:
        geometry = new THREE.SphereGeometry(sx, 24, 24);
    }

    let material: THREE.Material;
    if (elem.material === 'glow') {
      material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: elem.emissive ? new THREE.Color(elem.emissive) : baseColor,
        emissiveIntensity: elem.emissiveIntensity || 1.5,
        roughness: 0.2,
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: elem.roughness ?? 0.5,
        metalness: elem.metalness ?? 0.1,
        transparent: (elem.opacity ?? 1) < 1,
        opacity: elem.opacity ?? 1,
      });
    }

    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    if (elem.type === 'leaf_shape') {
      mesh.scale.set(sx, sy, sz);
    }
    return mesh;
  };

  // Main animation render loop
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const speedMult = isPlaying ? playbackSpeed : 0;

      // Update camera position from spherical coordinates
      if (cameraRef.current) {
        const { radius, theta, phi } = sphericalCoordsRef.current;
        const x = radius * Math.sin(phi) * Math.sin(theta) + targetLookAtRef.current.x;
        const y = radius * Math.cos(phi) + targetLookAtRef.current.y;
        const z = radius * Math.sin(phi) * Math.cos(theta) + targetLookAtRef.current.z;

        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(targetLookAtRef.current);
      }

      // Animate scene elements & apply parameters
      simulation.elements.forEach((elem) => {
        const obj = meshesMapRef.current.get(elem.id);
        if (!obj) return;

        // Apply parameter modulations
        if (elem.parameterModulated) {
          const mod = elem.parameterModulated;
          const currentVal = parameterValues[mod.paramId] ?? 0;
          const paramDef = simulation.parameters.find((p) => p.id === mod.paramId);

          if (paramDef) {
            const range = paramDef.max - paramDef.min;
            const progress = range > 0 ? (currentVal - paramDef.min) / range : 0;
            const targetModVal = mod.minVal + progress * (mod.maxVal - mod.minVal);

            if (mod.property === 'scale') {
              obj.scale.setScalar(targetModVal);
            } else if (mod.property === 'position_x') {
              obj.position.x = targetModVal;
            } else if (mod.property === 'position_y') {
              obj.position.y = targetModVal;
            } else if (mod.property === 'color' && mod.sourceColor && mod.targetColor) {
              const src = new THREE.Color(mod.sourceColor);
              const dst = new THREE.Color(mod.targetColor);
              const lerped = src.lerp(dst, Math.max(0, Math.min(1, progress)));
              obj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
                  const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                  m.color.copy(lerped);
                }
              });
            } else if (mod.property === 'emissive_intensity') {
              obj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                  if (m.emissiveIntensity !== undefined) {
                    m.emissiveIntensity = targetModVal;
                  }
                }
              });
            }
          }
        }

        // Highlight selected object
        if (selectedElementId === elem.id) {
          const pulse = 1 + Math.sin(elapsed * 6) * 0.08;
          obj.scale.set(
            (elem.scale?.[0] || 1) * pulse,
            (elem.scale?.[1] || 1) * pulse,
            (elem.scale?.[2] || 1) * pulse
          );
        }

        // Run animations
        if (elem.animation && speedMult > 0) {
          const anim = elem.animation;
          const animSpeed = (anim.speed || 1) * speedMult;

          if (anim.type === 'rotate') {
            const axis = anim.axis || 'y';
            obj.rotation[axis] += animSpeed * delta;
          } else if (anim.type === 'orbit') {
            const center = anim.orbitCenter || [0, 0, 0];
            const radius = anim.orbitRadius || 5;
            const currentAngle = elapsed * animSpeed;
            obj.position.x = center[0] + Math.cos(currentAngle) * radius;
            obj.position.z = center[2] + Math.sin(currentAngle) * radius;
            obj.rotation.y += animSpeed * delta * 2;
          } else if (anim.type === 'float') {
            const amp = anim.amplitude || 0.2;
            obj.position.y = elem.position[1] + Math.sin(elapsed * animSpeed * 2) * amp;
          } else if (anim.type === 'pulse') {
            const amp = anim.amplitude || 0.1;
            const s = 1 + Math.sin(elapsed * animSpeed * 3) * amp;
            obj.scale.setScalar(s * (elem.scale?.[0] || 1));
          } else if (anim.type === 'balance_tilt') {
            // Tilts lever based on applied parameters
            const fulcroPos = parameterValues['posicion_fulcro'] ?? 50;
            const tilt = ((fulcroPos - 50) / 50) * 0.35 + Math.sin(elapsed * 1.2) * 0.03;
            obj.rotation.z = tilt;
          }
        }
      });

      // Animate particle systems (water drops, vapor, sparks)
      particlesMapRef.current.forEach(({ points, origPositions, type }) => {
        const positions = points.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          if (type === 'particle_fountain') {
            // Vapor or magma rising upwards
            positions[idx + 1] += 0.04 * speedMult;
            positions[idx] += Math.sin(elapsed * 2 + i) * 0.01;
            if (positions[idx + 1] > 3.5) {
              positions[idx + 1] = -0.5;
              positions[idx] = origPositions[idx];
              positions[idx + 2] = origPositions[idx + 2];
            }
          } else if (type === 'particle_rain') {
            // Rain droplets falling down
            positions[idx + 1] -= 0.08 * speedMult;
            if (positions[idx + 1] < -2.0) {
              positions[idx + 1] = 2.0;
              positions[idx] = (Math.random() - 0.5) * 3;
            }
          } else if (type === 'flow') {
            positions[idx] += 0.02 * speedMult;
            if (positions[idx] > 2.0) {
              positions[idx] = -2.0;
            }
          }
        }
        points.geometry.attributes.position.needsUpdate = true;
      });

      // Render Three.js scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [simulation, parameterValues, isPlaying, playbackSpeed, selectedElementId]);

  // Raycasting for Mouse click & hover detection
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Drag orbit camera
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      const rotateSpeed = 0.007;
      sphericalCoordsRef.current.theta -= deltaX * rotateSpeed;
      sphericalCoordsRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, sphericalCoordsRef.current.phi - deltaY * rotateSpeed)
      );
      return;
    }

    // 2. Hover Raycasting
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    let foundElem: SceneElement | null = null;

    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur && cur !== sceneRef.current) {
        if (cur.userData?.element) {
          foundElem = cur.userData.element;
          break;
        }
        cur = cur.parent;
      }
      if (foundElem) break;
    }

    if (foundElem) {
      setHoveredElement(foundElem);
      setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredElement(null);
      setHoverPosition(null);
    }
  };

  // Native non-passive wheel listener to allow preventDefault safely without browser warnings
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.015;
      sphericalCoordsRef.current.radius = Math.max(
        3.5,
        Math.min(50, sphericalCoordsRef.current.radius + e.deltaY * zoomSpeed)
      );
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    for (const hit of intersects) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur && cur !== sceneRef.current) {
        if (cur.userData?.element) {
          const elem = cur.userData.element as SceneElement;
          soundFx.playInspect();
          onSelectElement(elem);
          return;
        }
        cur = cur.parent;
      }
    }
  };

  // Quick camera reset
  const handleResetCamera = () => {
    soundFx.playClick();
    const [camX, camY, camZ] = simulation.camera.position;
    const [targetX, targetY, targetZ] = simulation.camera.lookAt || [0, 0, 0];
    targetLookAtRef.current.set(targetX, targetY, targetZ);

    const offset = new THREE.Vector3(camX - targetX, camY - targetY, camZ - targetZ);
    const radius = offset.length();
    sphericalCoordsRef.current = {
      radius,
      theta: Math.atan2(offset.x, offset.z),
      phi: Math.acos(Math.max(-1, Math.min(1, offset.y / (radius || 1)))),
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating 3D Tooltip for kids */}
      {hoveredElement && hoverPosition && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-400/40 text-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
          style={{ left: hoverPosition.x, top: hoverPosition.y - 12 }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <p className="font-bold text-sm text-cyan-200">{hoveredElement.name}</p>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xs">{hoveredElement.tooltip || 'Toca para descubrir sus secretos'}</p>
          <p className="text-[10px] text-amber-300 font-medium mt-1">✨ ¡Toca con el dedo o clic para explorar!</p>
        </div>
      )}

      {/* Camera & View Helper Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleResetCamera}
          title="Centrar y reiniciar vista de cámara"
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-md flex items-center gap-1.5"
        >
          <span>🎯</span> Centrar Vista
        </button>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 text-xs text-slate-300">
          <span>🖱️ Arrastra para girar • Rueda para zoom</span>
        </div>
      </div>
    </div>
  );
};

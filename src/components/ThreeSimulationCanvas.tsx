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
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

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
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const [lx, ly, lz] = simulation.environment.mainLightPosition || [5, 10, 5];
    const dirLight = new THREE.DirectionalLight('#ffffff', simulation.environment.mainLightIntensity || 1.2);
    dirLight.position.set(lx, ly, lz);
    dirLightRef.current = dirLight;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#334155', 0.4);
    scene.add(hemiLight);

    // Planetary Orbit Guide Rings for Sistema Solar
    if (simulation.id === 'sistema-solar') {
      const orbitRadii = [3.4, 4.6, 6.0, 7.5, 10.2];
      orbitRadii.forEach((r) => {
        const orbitCurve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
        const points = orbitCurve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: 0x64748b,
          transparent: true,
          opacity: 0.35,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
      });
    }

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

    // 7. Resize Observer with requestAnimationFrame to prevent 'ResizeObserver loop completed with undelivered notifications'
    let resizeRafId: number | null = null;
    let lastWidth = width;
    let lastHeight = height;

    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const entry = entries[0];
        const w = entry ? Math.floor(entry.contentRect.width) : containerRef.current.clientWidth;
        const h = entry ? Math.floor(entry.contentRect.height) : containerRef.current.clientHeight;

        if (w <= 0 || h <= 0 || (w === lastWidth && h === lastHeight)) return;
        lastWidth = w;
        lastHeight = h;

        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h, false);
      });
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
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

    // Dedicated 3D Model for Boat in Buoyancy simulation
    if (elem.id === 'barco_flotante') {
      const boatGroup = new THREE.Group();

      // 1. Boat Main Hull (Casco estilizado)
      const hullGeo = new THREE.BoxGeometry(sx * 0.85, sy * 0.7, sz);
      const hullMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.35,
        metalness: 0.25,
      });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.name = 'hull_mesh';
      hull.position.set(-sx * 0.08, 0, 0);
      boatGroup.add(hull);

      // Pointed bow at the front (Proa triangular)
      const bowGeo = new THREE.ConeGeometry(sz * 0.5, sx * 0.32, 4);
      bowGeo.rotateZ(-Math.PI / 2);
      bowGeo.rotateY(Math.PI / 4);
      const bow = new THREE.Mesh(bowGeo, hullMat);
      bow.name = 'bow_mesh';
      bow.position.set(sx * 0.44, 0, 0);
      bow.scale.set(1, (sy * 0.7) / sz, 1);
      boatGroup.add(bow);

      // Red Waterline stripe (Línea de flotación náutica en la quilla)
      const lineGeo = new THREE.BoxGeometry(sx * 0.9, sy * 0.16, sz * 1.02);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.5,
      });
      const waterlineStripe = new THREE.Mesh(lineGeo, lineMat);
      waterlineStripe.position.set(-sx * 0.08, -sy * 0.27, 0);
      boatGroup.add(waterlineStripe);

      // 2. Captain's Bridge / Cabin (Puente de mando blanco)
      const cabinGeo = new THREE.BoxGeometry(sx * 0.32, sy * 0.65, sz * 0.6);
      const cabinMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.3,
      });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(-sx * 0.2, sy * 0.55, 0);
      boatGroup.add(cabin);

      // Blue Windows on cabin
      const winGeo = new THREE.BoxGeometry(sx * 0.14, sy * 0.25, sz * 0.64);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
      });
      const windows = new THREE.Mesh(winGeo, winMat);
      windows.position.set(-sx * 0.2, sy * 0.65, 0);
      boatGroup.add(windows);

      // 3. Smokestack / Chimney (Chimenea naval roja con anillo oscuro)
      const chimneyGeo = new THREE.CylinderGeometry(sx * 0.06, sx * 0.06, sy * 0.5, 16);
      const chimneyMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.4,
      });
      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(-sx * 0.22, sy * 1.05, 0);
      boatGroup.add(chimney);

      const ringGeo = new THREE.CylinderGeometry(sx * 0.065, sx * 0.065, sy * 0.12, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const chimneyRing = new THREE.Mesh(ringGeo, ringMat);
      chimneyRing.position.set(-sx * 0.22, sy * 1.22, 0);
      boatGroup.add(chimneyRing);

      // 4. Mast with observation flag
      const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, sy * 0.9, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(sx * 0.2, sy * 0.65, 0);
      boatGroup.add(mast);

      const flagGeo = new THREE.BoxGeometry(sx * 0.12, sy * 0.18, 0.02);
      const flagMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(sx * 0.27, sy * 0.95, 0);
      boatGroup.add(flag);

      // 5. Translucent Hollow Air Chamber representation
      // Displays the volume of air inside the hull (Forma Hueca)
      const airGeo = new THREE.BoxGeometry(sx * 0.65, sy * 0.35, sz * 0.65);
      const airMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.45,
      });
      const airChamber = new THREE.Mesh(airGeo, airMat);
      airChamber.name = 'air_chamber';
      airChamber.position.set(0, sy * 0.15, 0);
      boatGroup.add(airChamber);

      boatGroup.position.set(px, py, pz);
      boatGroup.rotation.set(rx, ry, rz);
      return boatGroup;
    }

    if (elem.type === 'water_surface') {
      const group = new THREE.Group();
      // Main transparent water volume
      const waterGeo = new THREE.BoxGeometry(sx, 2.4, sz);
      const waterMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        transparent: true,
        opacity: elem.opacity || 0.75,
        roughness: 0.1,
        metalness: 0.15,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.name = 'water_mesh';
      waterMesh.position.set(0, -1.0, 0);
      group.add(waterMesh);

      // Sandy seabed at bottom
      const sandGeo = new THREE.BoxGeometry(sx * 1.05, 0.35, sz * 1.05);
      const sandMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.9,
      });
      const sandMesh = new THREE.Mesh(sandGeo, sandMat);
      sandMesh.position.set(0, -2.25, 0);
      group.add(sandMesh);

      group.position.set(px, py, pz);
      return group;
    }

    // Realistic Bipolar Bar Magnets (North Red / South Blue)
    if (elem.id === 'iman_1' || elem.id === 'iman_2') {
      const magnetGroup = new THREE.Group();
      const halfLen = sx * 0.48;
      const h = sy;
      const d = sz;

      // North Pole (Red half)
      const northMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.35,
        metalness: 0.3,
      });
      const northMesh = new THREE.Mesh(new THREE.BoxGeometry(halfLen, h, d), northMat);
      northMesh.name = 'north_pole';
      northMesh.position.set(-halfLen / 2, 0, 0);
      magnetGroup.add(northMesh);

      // South Pole (Blue half)
      const southMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.35,
        metalness: 0.3,
      });
      const southMesh = new THREE.Mesh(new THREE.BoxGeometry(halfLen, h, d), southMat);
      southMesh.name = 'south_pole';
      southMesh.position.set(halfLen / 2, 0, 0);
      magnetGroup.add(southMesh);

      // Silver Center Band
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.8,
      });
      const silverMesh = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.05, h * 1.02, d * 1.02), silverMat);
      magnetGroup.add(silverMesh);

      magnetGroup.position.set(px, py, pz);
      magnetGroup.rotation.set(rx, ry, rz);
      return magnetGroup;
    }

    if (elem.type === 'magnetic_field') {
      const group = new THREE.Group();
      const lineCount = 14;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(-2.2, 0, 0),
          new THREE.Vector3(-1.0, Math.sin(angle) * 2.4, Math.cos(angle) * 2.4),
          new THREE.Vector3(1.0, Math.sin(angle) * 2.4, Math.cos(angle) * 2.4),
          new THREE.Vector3(2.2, 0, 0)
        );
        const points = curve.getPoints(28);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.65,
        });
        const line = new THREE.Line(geo, mat);
        group.add(line);
      }
      group.position.set(px, py, pz);
      return group;
    }

    // Triangular Fulcrum Pivot for Simple Machine
    if (elem.id === 'fulcro') {
      const fulcroGroup = new THREE.Group();
      const coneGeo = new THREE.ConeGeometry(sx * 0.55, sy, 4);
      coneGeo.rotateY(Math.PI / 4);
      const coneMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.4,
        metalness: 0.3,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      fulcroGroup.add(cone);
      fulcroGroup.position.set(px, py, pz);
      return fulcroGroup;
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

    if (elem.type === 'arrow') {
      const arrowGroup = new THREE.Group();
      const stemHeight = sy * 0.7;
      const stemRadius = Math.max(0.08, sx * 0.35);
      const stemGeo = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 16);
      const arrowMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: elem.emissive ? new THREE.Color(elem.emissive) : baseColor,
        emissiveIntensity: elem.emissiveIntensity || 1.4,
        roughness: 0.2,
      });
      const stem = new THREE.Mesh(stemGeo, arrowMat);
      stem.position.set(0, -sy * 0.15, 0);
      arrowGroup.add(stem);

      const headHeight = sy * 0.35;
      const headRadius = Math.max(0.2, sx * 0.9);
      const headGeo = new THREE.ConeGeometry(headRadius, headHeight, 16);
      const head = new THREE.Mesh(headGeo, arrowMat);
      head.position.set(0, sy * 0.35, 0);
      arrowGroup.add(head);

      arrowGroup.position.set(px, py, pz);
      arrowGroup.rotation.set(rx, ry, rz);
      return arrowGroup;
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

        // Determine stable target scale (1.0 default, modulated only by user sliders)
        let targetScale = 1.0;

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
              targetScale = targetModVal;
            } else if (mod.property === 'position_x') {
              obj.position.x = targetModVal;
            } else if (mod.property === 'position_y') {
              obj.position.y = targetModVal;
              obj.userData.baseY = targetModVal;
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
            } else if (mod.property === 'opacity') {
              obj.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
                  const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                  m.transparent = true;
                  m.opacity = targetModVal;
                }
              });
            }
          }
        }

        // Apply Solar System 'Tamaño de los Planetas' slider if active
        if (simulation.id === 'sistema-solar' && parameterValues['escala_visible'] !== undefined && elem.id !== 'sol_central') {
          targetScale *= parameterValues['escala_visible'];
        }

        // Maintain constant, stable 3D geometric scale
        obj.scale.set(targetScale, targetScale, targetScale);

        // Highlight selected object via emissive aura without deforming its physical size
        if (selectedElementId === elem.id) {
          const auraPulse = 1.5 + Math.sin(elapsed * 6) * 0.5;
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                m.emissiveIntensity = auraPulse;
              }
            }
          });
        }

        // Run animations with parameter modulation
        if (elem.animation && speedMult > 0) {
          const anim = elem.animation;
          const cosmicSpeed = simulation.id === 'sistema-solar' ? (parameterValues['velocidad_tiempo'] ?? 1.0) : 1.0;
          const animSpeed = (anim.speed || 1) * speedMult * cosmicSpeed;

          // Special relative orbit for Moon around Earth in Sistema Solar
          if (elem.id === 'luna') {
            const earthObj = meshesMapRef.current.get('tierra');
            if (earthObj) {
              const currentAngle = elapsed * animSpeed;
              const moonDist = 0.95;
              obj.position.x = earthObj.position.x + Math.cos(currentAngle) * moonDist;
              obj.position.z = earthObj.position.z + Math.sin(currentAngle) * moonDist;
              obj.position.y = earthObj.position.y + Math.sin(currentAngle * 0.8) * 0.2;
              obj.rotation.y += animSpeed * delta * 2;
              return;
            }
          }

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
            const baseY = obj.userData?.baseY !== undefined ? obj.userData.baseY : elem.position[1];
            obj.position.y = baseY + Math.sin(elapsed * animSpeed * 2) * amp;
          } else if (anim.type === 'pulse') {
            // Pulse emissive light instead of changing geometric size
            const amp = anim.amplitude || 0.3;
            const glow = 1.0 + Math.sin(elapsed * animSpeed * 3) * amp;
            obj.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (m && m.emissive && selectedElementId !== elem.id) {
                  m.emissiveIntensity = glow;
                }
              }
            });
          }
        }
      });

      // ==========================================
      // SIMULATION-SPECIFIC REAL-TIME CONTROLLERS
      // ==========================================

      // 1. Boat Archimedes Physics Engine ("¿Por qué flotan los barcos?")
      if (simulation.id === 'flotabilidad') {
        const densMaterial = parameterValues['densidad_objeto'] ?? 0.6;
        const airePct = parameterValues['volumen_aire'] ?? 80;
        const salinidad = parameterValues['salinidad_agua'] ?? 15;

        const densAgua = 1.0 + (salinidad / 100) * 0.25;
        const fracAire = airePct / 100;
        const densEfectiva = Math.max(0.08, densMaterial * (1 - fracAire * 0.86));
        const seHunde = densEfectiva >= densAgua;
        const submergedRatio = Math.min(1.0, densEfectiva / densAgua);

        let targetBoatY = 0.5 - submergedRatio * 0.65;
        let targetTiltZ = 0;
        let waveAmp = 0.08 * (1 - submergedRatio * 0.5);

        if (seHunde) {
          targetBoatY = -1.65;
          targetTiltZ = 0.18;
          waveAmp = 0;
        }

        const waveBob = speedMult > 0 && !seHunde ? Math.sin(elapsed * 2.2) * waveAmp : 0;
        const waveRoll = speedMult > 0 && !seHunde ? Math.sin(elapsed * 1.6) * 0.025 : 0;

        const boatObj = meshesMapRef.current.get('barco_flotante');
        if (boatObj) {
          boatObj.position.y = targetBoatY + waveBob;
          boatObj.rotation.z = targetTiltZ + waveRoll;

          const hullMesh = boatObj.getObjectByName('hull_mesh') as THREE.Mesh;
          const bowMesh = boatObj.getObjectByName('bow_mesh') as THREE.Mesh;
          [hullMesh, bowMesh].forEach((meshPart) => {
            if (meshPart && meshPart.material) {
              const mat = meshPart.material as THREE.MeshStandardMaterial;
              if (densMaterial < 0.8) {
                mat.color.set('#d97706');
              } else if (densMaterial < 1.3) {
                mat.color.set('#f97316');
              } else {
                mat.color.set('#475569');
              }
            }
          });

          const airChamber = boatObj.getObjectByName('air_chamber') as THREE.Mesh;
          if (airChamber) {
            airChamber.scale.set(1, Math.max(0.05, fracAire), 1);
            airChamber.visible = fracAire > 0.05;
            if (airChamber.material) {
              const mat = airChamber.material as THREE.MeshStandardMaterial;
              mat.opacity = 0.2 + fracAire * 0.45;
            }
          }
        }

        const gravArrow = meshesMapRef.current.get('flecha_gravedad');
        if (gravArrow) {
          const gravMagnitude = Math.min(2.5, Math.max(0.6, 0.4 + densEfectiva * 1.2));
          gravArrow.position.set(0, targetBoatY + waveBob + 0.85 + gravMagnitude * 0.3, 0);
          gravArrow.scale.set(0.4, gravMagnitude, 0.4);
        }

        const empujeArrow = meshesMapRef.current.get('flecha_empuje');
        if (empujeArrow) {
          let empujeMagnitude = 0;
          if (!seHunde) {
            empujeMagnitude = Math.min(2.5, Math.max(0.6, 0.4 + densEfectiva * 1.2));
          } else {
            empujeMagnitude = Math.min(2.5, Math.max(0.3, 0.4 + densAgua * 0.45));
          }
          empujeArrow.position.set(0, targetBoatY + waveBob - 0.7 - empujeMagnitude * 0.3, 0);
          empujeArrow.scale.set(0.4, empujeMagnitude, 0.4);
        }

        const waterObj = meshesMapRef.current.get('superficie_agua');
        if (waterObj) {
          const waterMesh = (waterObj.getObjectByName('water_mesh') || waterObj) as THREE.Mesh;
          if (waterMesh && waterMesh.material) {
            const mat = waterMesh.material as THREE.MeshStandardMaterial;
            const saltProgress = salinidad / 40;
            const freshColor = new THREE.Color('#0284c7');
            const saltyColor = new THREE.Color('#0d9488');
            mat.color.copy(freshColor.clone().lerp(saltyColor, saltProgress));
            mat.opacity = 0.75 + saltProgress * 0.15;
          }
        }
      }

      // 2. Water Cycle Controller ("El Ciclo del Agua")
      if (simulation.id === 'ciclo-agua') {
        const temp = parameterValues['temperatura'] ?? 25;
        const solInt = parameterValues['intensidad_sol'] ?? 80;

        const cloudObj = meshesMapRef.current.get('nube');
        const rainObj = meshesMapRef.current.get('lluvia');
        const oceanObj = meshesMapRef.current.get('oceano');
        const sunObj = meshesMapRef.current.get('sol');

        // Rain particles follow the cloud across X and Z as the wind blows
        if (cloudObj && rainObj) {
          rainObj.position.x = cloudObj.position.x;
          rainObj.position.z = cloudObj.position.z;
        }

        const isFreezing = temp <= 0;
        const tempProgress = Math.max(0, Math.min(1, (temp - -10) / 110));

        if (oceanObj) {
          const waterMesh = (oceanObj.getObjectByName('water_mesh') || oceanObj) as THREE.Mesh;
          if (waterMesh && waterMesh.material) {
            const mat = waterMesh.material as THREE.MeshStandardMaterial;
            if (isFreezing) {
              mat.color.set('#cffafe'); // Icy frozen crystal surface
              mat.roughness = 0.05;
              mat.metalness = 0.35;
              mat.opacity = 0.95;
            } else {
              const deepBlue = new THREE.Color('#0369a1');
              const cyanWater = new THREE.Color('#38bdf8');
              mat.color.copy(cyanWater.clone().lerp(deepBlue, tempProgress));
              mat.roughness = 0.15;
              mat.metalness = 0.1;
              mat.opacity = 0.85;
            }
          }
        }

        if (sunObj) {
          sunObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                m.emissiveIntensity = 0.6 + (solInt / 100) * 2.2;
              }
            }
          });
        }
      }

      // 3. Solar System Cosmic Controller ("El Sistema Solar")
      if (simulation.id === 'sistema-solar') {
        const brilloSolar = (parameterValues['brillo_solar'] ?? 120) / 100;
        const sunObj = meshesMapRef.current.get('sol_central');
        if (sunObj) {
          sunObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                m.emissiveIntensity = 1.4 * brilloSolar + Math.sin(elapsed * 2.2) * 0.2;
              }
            }
          });
        }
        if (dirLightRef.current) {
          dirLightRef.current.intensity = 2.0 * brilloSolar;
        }
        if (ambientLightRef.current) {
          ambientLightRef.current.intensity = 0.4 + 0.4 * brilloSolar;
        }
      }

      // 4. Photosynthesis Controller ("La Fotosíntesis")
      if (simulation.id === 'fotosintesis') {
        const luz = parameterValues['luz_solar'] ?? 70;
        const agua = parameterValues['agua_riego'] ?? 80;
        const co2 = parameterValues['co2_aire'] ?? 60;

        const factorLuz = luz / 100;
        const factorAgua = agua / 100;
        const factorCO2 = co2 / 100;
        const tasaFotosintesis = Math.min(factorLuz, factorAgua, factorCO2);

        // Leaf color reflects hydration and vitality
        const hojaObj = meshesMapRef.current.get('hoja_verde');
        if (hojaObj) {
          const dryColor = new THREE.Color('#b45309'); // Withered brown/yellow
          const healthyColor = new THREE.Color('#15803d'); // Lush vibrant green
          const leafColor = dryColor.clone().lerp(healthyColor, factorAgua * 0.65 + factorLuz * 0.35);
          hojaObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m) m.color.copy(leafColor);
            }
          });
        }

        // Sunlight photons arrow vector
        const solRayo = meshesMapRef.current.get('sol_energia');
        if (solRayo) {
          solRayo.visible = luz > 5;
          solRayo.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m) {
                m.opacity = Math.max(0.15, factorLuz);
                if (m.emissive) {
                  m.emissiveIntensity = 0.4 + factorLuz * 2.2;
                }
              }
            }
          });
        }
      }

      // 5. Volcano & Earth Layers Controller ("El Volcán y Capas de la Tierra")
      if (simulation.id === 'volcan-tierra') {
        const presion = parameterValues['presion_magma'] ?? 40;
        const corte = parameterValues['corte_transversal'] ?? 60;
        const tempNucleo = parameterValues['temperatura_interior'] ?? 5000;

        // Cone crater incandescence
        const conoObj = meshesMapRef.current.get('cono_volcanico');
        if (conoObj) {
          const isErupting = presion > 60;
          conoObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                if (isErupting) {
                  m.emissive.set('#dc2626');
                  m.emissiveIntensity = ((presion - 60) / 40) * 1.6 + Math.sin(elapsed * 8) * 0.3;
                } else {
                  m.emissiveIntensity = 0.1;
                }
              }
            }
          });
        }

        // Earth cross-section opening
        const cortezaObj = meshesMapRef.current.get('corteza');
        const mantoObj = meshesMapRef.current.get('manto');
        const corteFactor = (corte / 100) * Math.PI * 0.4;
        if (cortezaObj) cortezaObj.rotation.y = corteFactor;
        if (mantoObj) mantoObj.rotation.y = corteFactor;

        // Core pulse and glow
        const nucleoObj = meshesMapRef.current.get('nucleo');
        if (nucleoObj) {
          const tempProgress = (tempNucleo - 1000) / 5000;
          nucleoObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                m.emissiveIntensity = 1.6 + tempProgress * 2.2 + Math.sin(elapsed * (2 + tempProgress * 2)) * 0.3;
              }
            }
          });
        }
      }

      // 6. Magnetism Controller ("El Magnetismo")
      if (simulation.id === 'magnetismo') {
        const dist = parameterValues['distancia_imanes'] ?? 4;
        const potencia = parameterValues['potencia_iman'] ?? 3;

        const iman1 = meshesMapRef.current.get('iman_1');
        const iman2 = meshesMapRef.current.get('iman_2');
        const lineas = meshesMapRef.current.get('lineas_campo');

        const halfDist = dist / 2;
        if (iman1) iman1.position.x = -halfDist - 0.7;
        if (iman2) iman2.position.x = halfDist + 0.7;

        if (lineas) {
          lineas.scale.x = (dist + 2.0) / 4.5;
          const forceFactor = (potencia * 12) / (dist * dist);
          lineas.traverse((child) => {
            if ((child as THREE.Line).isLine) {
              const m = (child as THREE.Line).material as THREE.LineBasicMaterial;
              if (m) {
                m.opacity = Math.min(1.0, 0.35 + forceFactor * 0.4 + Math.sin(elapsed * (2 + potencia * 1.2)) * 0.15);
              }
            }
          });
        }
      }

      // 7. Simple Machines (Lever) Controller ("Máquinas Simples - Palanca")
      if (simulation.id === 'maquinas-simples') {
        const peso = parameterValues['peso_carga'] ?? 60;
        const fuerza = parameterValues['fuerza_nino'] ?? 45;
        const fulcroPos = parameterValues['posicion_fulcro'] ?? 50;

        const fulcroObj = meshesMapRef.current.get('fulcro');
        const barraObj = meshesMapRef.current.get('barra_palanca');
        const cargaObj = meshesMapRef.current.get('carga_pesada');

        // Physical fulcrum position along lever
        const fulcroX = ((fulcroPos - 50) / 50) * 1.8;
        if (fulcroObj) {
          fulcroObj.position.x = fulcroX;
        }

        // Arm distances: load is at -2.4, effort is at +2.4
        const armLoad = Math.max(0.3, fulcroX - (-2.4));
        const armEffort = Math.max(0.3, 2.4 - fulcroX);

        const torqueLoad = peso * armLoad;
        const torqueEffort = fuerza * armEffort * 1.4;

        const netTorque = torqueEffort - torqueLoad;
        const maxTorque = Math.max(torqueLoad, torqueEffort, 10);
        const targetTilt = Math.max(-0.35, Math.min(0.35, (netTorque / maxTorque) * 0.35));

        const tiltBob = speedMult > 0 ? Math.sin(elapsed * 1.4) * 0.02 : 0;
        const currentTilt = targetTilt + tiltBob;

        if (barraObj) {
          barraObj.rotation.z = currentTilt;
        }

        // Load box rides on top of the left arm
        if (cargaObj) {
          const loadArmX = -2.4 - fulcroX;
          const loadWorldX = fulcroX + loadArmX * Math.cos(currentTilt);
          const loadWorldY = 0.4 + loadArmX * Math.sin(currentTilt) + 0.55;
          cargaObj.position.set(loadWorldX, loadWorldY, 0);
          cargaObj.rotation.z = currentTilt;
        }
      }

      // 8. Rainbow Optics & Dispersion Controller ("El Arcoíris")
      if (simulation.id === 'arcoiris') {
        const angulo = parameterValues['angulo_luz'] ?? 42;
        const gotas = parameterValues['densidad_gotas'] ?? 70;
        const sol = parameterValues['brillo_sol'] ?? 90;

        const delta = Math.abs(angulo - 42);
        const dispersion = Math.exp(-(delta * delta) / 140) * (sol / 100) * (gotas / 100);

        const arcoRojo = meshesMapRef.current.get('arco_rojo');
        const arcoAzul = meshesMapRef.current.get('arco_azul');
        const solFuente = meshesMapRef.current.get('sol_fuente');
        const gota = meshesMapRef.current.get('gota_cristal');

        if (solFuente) {
          const angleRad = (angulo / 180) * Math.PI;
          solFuente.position.x = -5.0 * Math.cos(angleRad * 0.5);
          solFuente.position.y = 1.0 + 4.0 * Math.sin(angleRad * 0.5);
        }

        [arcoRojo, arcoAzul].forEach((arc) => {
          if (arc) {
            arc.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (m) {
                  m.transparent = true;
                  m.opacity = Math.max(0.08, dispersion * 0.95);
                  if (m.emissive) {
                    m.emissiveIntensity = Math.max(0.15, dispersion * 2.5);
                  }
                }
              }
            });
            if (speedMult > 0) {
              const shimmer = 1.0 + Math.sin(elapsed * 2.2) * 0.02 * dispersion;
              arc.scale.set(arc.scale.x * shimmer, arc.scale.y * shimmer, arc.scale.z);
            }
          }
        });

        if (gota) {
          gota.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m) {
                m.opacity = 0.45 + (gotas / 100) * 0.35;
              }
            }
          });
        }
      }

      // ==========================================
      // PARAMETER-RESPONSIVE PARTICLE ANIMATIONS
      // ==========================================
      particlesMapRef.current.forEach(({ points, origPositions, type }, id) => {
        const positions = points.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;

        // Custom particle rates based on active simulation parameters
        let customSpeed = speedMult;
        if (simulation.id === 'ciclo-agua') {
          const temp = parameterValues['temperatura'] ?? 25;
          const sol = (parameterValues['intensidad_sol'] ?? 80) / 100;
          if (id === 'vapor') {
            if (temp <= 0) {
              customSpeed = 0.04 * speedMult;
            } else {
              customSpeed = (0.2 + (temp / 100) * 1.8 * (0.3 + sol * 0.7)) * speedMult;
            }
          } else if (id === 'lluvia') {
            customSpeed = (temp <= 0 ? 0.35 : 1.2) * speedMult;
          }
        } else if (simulation.id === 'fotosintesis') {
          const luz = (parameterValues['luz_solar'] ?? 70) / 100;
          const agua = (parameterValues['agua_riego'] ?? 80) / 100;
          const co2 = (parameterValues['co2_aire'] ?? 60) / 100;
          const tasa = Math.min(luz, agua, co2);
          if (id === 'oxigeno_burbujas') {
            customSpeed = (0.1 + tasa * 2.2) * speedMult;
            if (tasa < 0.1) customSpeed = 0;
          } else if (id === 'co2_particulas') {
            customSpeed = (0.2 + co2 * 1.5) * speedMult;
          }
        } else if (simulation.id === 'volcan-tierra') {
          const presion = (parameterValues['presion_magma'] ?? 40) / 100;
          if (id === 'erupcion_lava') {
            customSpeed = (0.3 + presion * 2.4) * speedMult;
          }
        } else if (simulation.id === 'arcoiris') {
          const dens = (parameterValues['densidad_gotas'] ?? 70) / 100;
          customSpeed = (0.4 + dens * 1.2) * speedMult;
        }

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          if (type === 'particle_fountain') {
            positions[idx + 1] += 0.04 * customSpeed;
            positions[idx] += Math.sin(elapsed * 2 + i) * 0.01;
            const maxY = simulation.id === 'volcan-tierra' ? 1.6 + ((parameterValues['presion_magma'] ?? 40) / 100) * 2.8 : 3.5;
            if (positions[idx + 1] > maxY) {
              positions[idx + 1] = -0.5;
              positions[idx] = origPositions[idx];
              positions[idx + 2] = origPositions[idx + 2];
            }
          } else if (type === 'particle_rain') {
            const temp = parameterValues['temperatura'] ?? 25;
            const isSnow = simulation.id === 'ciclo-agua' && temp <= 0;
            if (isSnow) {
              positions[idx + 1] -= 0.025 * customSpeed;
              positions[idx] += Math.sin(elapsed * 1.5 + i) * 0.015;
            } else {
              positions[idx + 1] -= 0.08 * customSpeed;
            }
            if (positions[idx + 1] < -2.0) {
              positions[idx + 1] = 2.0;
              positions[idx] = (Math.random() - 0.5) * 3;
            }
          } else if (type === 'flow') {
            positions[idx] += 0.025 * customSpeed;
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

  // Unified Telemetry State
  const [isHUDOpen, setIsHUDOpen] = useState(true);

  // 1. Boat Buoyancy Telemetry ("flotabilidad")
  const densMaterial = parameterValues['densidad_objeto'] ?? 0.6;
  const airePct = parameterValues['volumen_aire'] ?? 80;
  const salinidad = parameterValues['salinidad_agua'] ?? 15;
  const densAgua = +(1.0 + (salinidad / 100) * 0.25).toFixed(2);
  const fracAire = airePct / 100;
  const densEfectiva = +(Math.max(0.08, densMaterial * (1 - fracAire * 0.86))).toFixed(2);
  const seHunde = densEfectiva >= densAgua;
  const submergedPercent = seHunde ? 100 : Math.min(100, Math.round((densEfectiva / densAgua) * 100));

  // 2. Water Cycle Telemetry ("ciclo-agua")
  const tempCiclo = parameterValues['temperatura'] ?? 25;
  const solCiclo = parameterValues['intensidad_sol'] ?? 80;
  const vientoCiclo = parameterValues['viento'] ?? 20;
  const estadoAgua =
    tempCiclo <= 0
      ? '❄️ Sólido (Nieve / Hielo)'
      : tempCiclo >= 100
      ? '☁️ Gaseoso (Vapor de Agua)'
      : '💧 Líquido (Agua Oceánica)';
  const evapTasa = tempCiclo <= 0 ? 0 : Math.min(100, Math.round((tempCiclo / 100) * (solCiclo / 100) * 100));

  // 3. Solar System Telemetry ("sistema-solar")
  const velTiempo = parameterValues['velocidad_tiempo'] ?? 1.0;
  const planetScale = parameterValues['escala_visible'] ?? 1.2;
  const solBrillo = parameterValues['brillo_solar'] ?? 120;
  const diasSimuladosPorSegundo = (velTiempo * 30).toFixed(0);

  // 4. Photosynthesis Telemetry ("fotosintesis")
  const luzFoto = parameterValues['luz_solar'] ?? 70;
  const aguaFoto = parameterValues['agua_riego'] ?? 80;
  const co2Foto = parameterValues['co2_aire'] ?? 60;
  const tasaFotoPct = Math.round(Math.min(luzFoto, aguaFoto, co2Foto));
  const factorLimitante =
    luzFoto <= aguaFoto && luzFoto <= co2Foto
      ? 'Luz Solar'
      : aguaFoto <= co2Foto
      ? 'Agua en Raíces'
      : 'CO2 en el Aire';

  // 5. Volcano Telemetry ("volcan-tierra")
  const presMagma = parameterValues['presion_magma'] ?? 40;
  const corteApertura = parameterValues['corte_transversal'] ?? 60;
  const tempNucleo = parameterValues['temperatura_interior'] ?? 5000;
  const alertaVolcan =
    presMagma < 35
      ? 'Dormido / Estable 🟢'
      : presMagma < 70
      ? 'Actividad Moderada 🟡'
      : '¡Erupción Explosiva! 🔴';

  // 6. Magnetism Telemetry ("magnetismo")
  const distImanes = parameterValues['distancia_imanes'] ?? 4;
  const potImanes = parameterValues['potencia_iman'] ?? 3;
  // Inverse square law: F proportional to 1 / d^2
  const fuerzaMagneticaN = +((potImanes * 36) / (distImanes * distImanes)).toFixed(1);

  // 7. Simple Machines Lever Telemetry ("maquinas-simples")
  const pesoCarga = parameterValues['peso_carga'] ?? 60;
  const fuerzaEsfuerzo = parameterValues['fuerza_nino'] ?? 45;
  const fulcroPos = parameterValues['posicion_fulcro'] ?? 50;
  const fulcroOffset = ((fulcroPos - 50) / 50) * 1.8;
  const brazoCarga = +(2.4 + fulcroOffset).toFixed(2);
  const brazoEsfuerzo = +(2.4 - fulcroOffset).toFixed(2);
  const ventajaMecanica = +(brazoEsfuerzo / brazoCarga).toFixed(2);
  const torqueCarga = Math.round(pesoCarga * brazoCarga);
  const torqueEsfuerzo = Math.round(fuerzaEsfuerzo * brazoEsfuerzo * 1.4);
  const cargaLevantada = torqueEsfuerzo >= torqueCarga;

  // 8. Rainbow Optics Telemetry ("arcoiris")
  const anguloLuz = parameterValues['angulo_luz'] ?? 42;
  const densGotas = parameterValues['densidad_gotas'] ?? 70;
  const brilloSolArc = parameterValues['brillo_sol'] ?? 90;
  const delta42 = Math.abs(anguloLuz - 42);
  const nitidezArcoiris = Math.round(
    Math.exp(-(delta42 * delta42) / 140) * (brilloSolArc / 100) * (densGotas / 100) * 100
  );

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
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-auto z-10">
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

      {/* Interactive Physical Telemetry & Scientific Graphic HUD for all Simulations */}
      <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-xs text-white pointer-events-auto transition-all">
        {/* HUD Header with Status Badge & Toggle Button */}
        <div className="p-3 pb-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xs truncate">
            {simulation.id === 'flotabilidad' && (
              <>
                <span className="text-base">{seHunde ? '⚓' : '⛵'}</span>
                <span className={seHunde ? 'text-rose-400' : 'text-emerald-400'}>
                  {seHunde ? '¡EL BARCO SE HUNDE!' : '¡EL BARCO FLOTA!'}
                </span>
              </>
            )}
            {simulation.id === 'ciclo-agua' && (
              <>
                <span className="text-base">💧</span>
                <span className="text-cyan-300">{estadoAgua}</span>
              </>
            )}
            {simulation.id === 'sistema-solar' && (
              <>
                <span className="text-base">🪐</span>
                <span className="text-purple-300">Mecánica Celeste y Órbitas</span>
              </>
            )}
            {simulation.id === 'fotosintesis' && (
              <>
                <span className="text-base">🌿</span>
                <span className={tasaFotoPct > 20 ? 'text-emerald-400' : 'text-amber-400'}>
                  {tasaFotoPct > 20 ? `Fotosíntesis Activa (${tasaFotoPct}%)` : 'Planta en Reposo (Baja Luz)'}
                </span>
              </>
            )}
            {simulation.id === 'volcan-tierra' && (
              <>
                <span className="text-base">🌋</span>
                <span className={presMagma > 70 ? 'text-rose-400' : 'text-amber-300'}>{alertaVolcan}</span>
              </>
            )}
            {simulation.id === 'magnetismo' && (
              <>
                <span className="text-base">🧲</span>
                <span className="text-cyan-300">Fuerza Magnética: {fuerzaMagneticaN} N</span>
              </>
            )}
            {simulation.id === 'maquinas-simples' && (
              <>
                <span className="text-base">⚖️</span>
                <span className={cargaLevantada ? 'text-emerald-400' : 'text-amber-400'}>
                  {cargaLevantada ? '¡Carga Levantada con Éxito!' : 'Fuerza Insuficiente'}
                </span>
              </>
            )}
            {simulation.id === 'arcoiris' && (
              <>
                <span className="text-base">🌈</span>
                <span className={nitidezArcoiris > 50 ? 'text-pink-400' : 'text-slate-300'}>
                  {nitidezArcoiris > 50 ? `Arcoíris Nítido (${nitidezArcoiris}%)` : `Dispersión Difusa (${nitidezArcoiris}%)`}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setIsHUDOpen(!isHUDOpen)}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors shrink-0"
          >
            {isHUDOpen ? 'Ocultar' : 'Ver gráfico'}
          </button>
        </div>

        {isHUDOpen && (
          <div className="p-3 space-y-3">
            {/* 1. BOAT BUOYANCY HUD */}
            {simulation.id === 'flotabilidad' && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" /> Gráfico de Densidad
                    </span>
                    <span className="font-mono text-cyan-300">
                      {densEfectiva} <span className="text-slate-400">/</span> {densAgua} g/cm³
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-sm"
                      style={{ left: `${Math.min(95, Math.max(5, (densAgua / 2.5) * 100))}%` }}
                      title={`Límite de flotación: Densidad del agua (${densAgua} g/cm³)`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        seHunde
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, (densEfectiva / 2.5) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>0.0 g/cm³</span>
                    <span className="text-yellow-300 font-bold">▲ Agua ({densAgua})</span>
                    <span>2.5 g/cm³</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                    <span>Gráfico de Fuerzas</span>
                    <span className={`text-[10px] font-bold ${seHunde ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {seHunde ? 'Inmersión 100% (Fondo)' : `${submergedPercent}% sumergido`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                      <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                        <span>Empuje ↑</span>
                        <span className="font-mono">
                          {seHunde ? `${(densAgua * 8.5).toFixed(1)} N` : `${(densEfectiva * 10).toFixed(1)} N`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((seHunde ? densAgua * 0.85 : densEfectiva) / 2.5) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/50">
                      <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                        <span>Peso ↓</span>
                        <span className="font-mono">{(densEfectiva * 10).toFixed(1)} N</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, (densEfectiva / 2.5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  {seHunde ? (
                    <span className="text-rose-200">
                      ⚠️ <strong>¡Se hunde!</strong> Con poco aire ({airePct}%), la densidad media del objeto ({densEfectiva} g/cm³) supera al agua ({densAgua} g/cm³). El peso vence al empuje.
                    </span>
                  ) : (
                    <span className="text-emerald-200">
                      ✨ <strong>¡Flota en equilibrio!</strong> Gracias al {airePct}% de aire en el casco hueco, la densidad promedio ({densEfectiva} g/cm³) es menor que la del agua ({densAgua} g/cm³).
                    </span>
                  )}
                </div>
              </>
            )}

            {/* 2. WATER CYCLE HUD */}
            {simulation.id === 'ciclo-agua' && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Termómetro Ambiental</span>
                    <span className="font-mono text-cyan-300 font-bold">{tempCiclo} °C</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                    <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10" style={{ left: '9%' }} title="0°C Congelación" />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10" style={{ left: '100%' }} title="100°C Ebullición" />
                    <div
                      className="h-full transition-all duration-300 bg-gradient-to-r from-blue-400 via-cyan-400 to-amber-500"
                      style={{ width: `${Math.min(100, Math.max(0, ((tempCiclo - -10) / 110) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>-10°C (Hielo)</span>
                    <span className="text-blue-300 font-bold">0°C</span>
                    <span>100°C (Vapor)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Evaporación</div>
                    <div className="text-cyan-300 font-bold text-sm mt-0.5">{evapTasa}%</div>
                    <div className="text-[9px] text-slate-400">Energía solar: {solCiclo}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Precipitación</div>
                    <div className="text-cyan-300 font-bold text-sm mt-0.5">{tempCiclo <= 0 ? 'Nieve ❄️' : 'Lluvia 🌧️'}</div>
                    <div className="text-[9px] text-slate-400">Viento: {vientoCiclo} km/h</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  {tempCiclo <= 0 ? (
                    <span className="text-blue-200">
                      ❄️ <strong>Solidificación:</strong> A temperaturas bajo cero el agua se congela en la superficie marina y las nubes precipitan copos de nieve suaves.
                    </span>
                  ) : (
                    <span className="text-cyan-200">
                      💧 <strong>Ciclo Activo:</strong> El sol calienta el océano ({evapTasa}% tasa de vapor), el vapor asciende y se condensa en nubes que el viento desplaza hacia la montaña.
                    </span>
                  )}
                </div>
              </>
            )}

            {/* 3. SOLAR SYSTEM HUD */}
            {simulation.id === 'sistema-solar' && (
              <>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/50">
                    <div className="text-purple-300 font-semibold">Tiempo Cósmico</div>
                    <div className="text-white font-mono font-bold text-base mt-0.5">{velTiempo}x</div>
                    <div className="text-[9px] text-slate-400">~{diasSimuladosPorSegundo} días / seg</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50">
                    <div className="text-amber-300 font-semibold">Brillo del Sol</div>
                    <div className="text-white font-mono font-bold text-base mt-0.5">{solBrillo}%</div>
                    <div className="text-[9px] text-slate-400">Escala: {planetScale}x</div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Períodos Orbitales (3ª Ley de Kepler)</div>
                  <div className="space-y-1 text-[10px] font-mono">
                    <div className="flex justify-between bg-slate-800/50 px-2 py-1 rounded">
                      <span className="text-slate-300">Mercurio (r=3.4)</span>
                      <span className="text-cyan-300 font-bold">88 días terrestres</span>
                    </div>
                    <div className="flex justify-between bg-slate-800/50 px-2 py-1 rounded">
                      <span className="text-blue-300">Tierra (r=6.0) + Luna</span>
                      <span className="text-blue-300 font-bold">365 días terrestres</span>
                    </div>
                    <div className="flex justify-between bg-slate-800/50 px-2 py-1 rounded">
                      <span className="text-amber-300">Saturno (r=10.2)</span>
                      <span className="text-amber-300 font-bold">29 años terrestres</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  🌌 <strong>Leyes Gravitatorias:</strong> Cuanto más cerca está un planeta del Sol, mayor es la atracción gravitatoria y más rápido debe orbitar para no caer en él.
                </div>
              </>
            )}

            {/* 4. PHOTOSYNTHESIS HUD */}
            {simulation.id === 'fotosintesis' && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Tasa Neta de Fotosíntesis</span>
                    <span className="font-mono text-emerald-400 font-bold">{tasaFotoPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-green-500 transition-all duration-300"
                      style={{ width: `${tasaFotoPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-yellow-950/40 border border-yellow-800/40">
                    <div className="text-yellow-400 font-bold">Luz ☀️</div>
                    <div className="font-mono text-white mt-0.5">{luzFoto}%</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40">
                    <div className="text-blue-400 font-bold">Agua 💧</div>
                    <div className="font-mono text-white mt-0.5">{aguaFoto}%</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40">
                    <div className="text-purple-400 font-bold">CO₂ 🍃</div>
                    <div className="font-mono text-white mt-0.5">{co2Foto} ppm</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex justify-between text-[10px]">
                  <span className="text-emerald-300">Oxígeno Liberado:</span>
                  <span className="font-mono font-bold text-emerald-200">+{Math.round(tasaFotoPct * 1.2)} mmol/h</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  🌱 <strong>Ley del Mínimo de Liebig:</strong> La fotosíntesis está limitada por el reactivo más escaso ({factorLimitante}). Sin luz o sin agua en las raíces, la producción de glucosa y oxígeno se detiene.
                </div>
              </>
            )}

            {/* 5. VOLCANO & EARTH STRUCTURE HUD */}
            {simulation.id === 'volcan-tierra' && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Presión en Cámara Magmática</span>
                    <span className="font-mono text-rose-400 font-bold">{presMagma} bar</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        presMagma > 70
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                      }`}
                      style={{ width: `${presMagma}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>10 bar (Calmo)</span>
                    <span className="text-yellow-400 font-bold">50 bar</span>
                    <span>100 bar (Explosivo)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Núcleo Central</div>
                    <div className="font-mono text-amber-300 font-bold text-sm mt-0.5">{tempNucleo} °C</div>
                    <div className="text-[9px] text-slate-400">Hierro y Níquel</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Corte 3D Abierto</div>
                    <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">{corteApertura}%</div>
                    <div className="text-[9px] text-slate-400">Manto y Corteza</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  {presMagma > 70 ? (
                    <span className="text-rose-200">
                      💥 <strong>¡Erupción Violenta!</strong> La alta presión ({presMagma} bar) rompe la chimenea del cono volcánico, arrojando lava incandescente, ceniza y gases a la atmósfera.
                    </span>
                  ) : (
                    <span className="text-amber-200">
                      🌋 <strong>Geodinámica Interna:</strong> El calor radiactivo del núcleo ({tempNucleo}°C) genera corrientes de convección en el manto, acumulando magma bajo la corteza.
                    </span>
                  )}
                </div>
              </>
            )}

            {/* 6. MAGNETISM HUD */}
            {simulation.id === 'magnetismo' && (
              <>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50">
                    <div className="text-cyan-300 font-semibold">Distancia</div>
                    <div className="text-white font-mono font-bold text-base mt-0.5">{distImanes} cm</div>
                    <div className="text-[9px] text-slate-400">Separación física</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-800/50">
                    <div className="text-blue-300 font-semibold">Fuerza Magnética</div>
                    <div className="text-white font-mono font-bold text-base mt-0.5">{fuerzaMagneticaN} N</div>
                    <div className="text-[9px] text-slate-400">Intensidad: {potImanes} T</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Intensidad de Fuerza (Ley Inverso del Cuadrado)</span>
                    <span className="font-mono text-cyan-300 font-bold">{Math.min(100, Math.round((fuerzaMagneticaN / 36) * 100))}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (fuerzaMagneticaN / 36) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  🧲 <strong>Líneas de Campo Invisible:</strong> Al reducir la distancia a la mitad (de 4 cm a 2 cm), la fuerza magnética se cuadruplica (F ∝ 1/d²). Las líneas de flujo viajan del polo Norte al Sur.
                </div>
              </>
            )}

            {/* 7. SIMPLE MACHINES (LEVER) HUD */}
            {simulation.id === 'maquinas-simples' && (
              <>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50">
                    <div className="text-amber-300 font-semibold">Ventaja Mecánica</div>
                    <div className="text-white font-mono font-bold text-base mt-0.5">{ventajaMecanica}x</div>
                    <div className="text-[9px] text-slate-400">Vm = d₂ / d₁</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-300 font-semibold">Posición Fulcro</div>
                    <div className="text-cyan-300 font-mono font-bold text-base mt-0.5">{fulcroPos}%</div>
                    <div className="text-[9px] text-slate-400">{brazoCarga}m vs {brazoEsfuerzo}m</div>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                    <span>Balance de Torques (Momentos)</span>
                    <span className={`text-[10px] font-bold ${cargaLevantada ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {cargaLevantada ? '¡Equilibrio Vencido!' : 'Falta Torque'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex justify-between text-slate-300 font-bold mb-1">
                        <span>Carga τ₁</span>
                        <span className="font-mono">{torqueCarga} N·m</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, (torqueCarga / 300) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex justify-between text-slate-300 font-bold mb-1">
                        <span>Esfuerzo τ₂</span>
                        <span className="font-mono">{torqueEsfuerzo} N·m</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (torqueEsfuerzo / 300) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  {cargaLevantada ? (
                    <span className="text-emerald-200">
                      🎉 <strong>¡Levantada!</strong> Con el punto de apoyo a {fulcroPos}%, el brazo de esfuerzo ({brazoEsfuerzo}m) genera suficiente ventaja mecánica ({ventajaMecanica}x) para elevar {pesoCarga} kg con solo {fuerzaEsfuerzo} N.
                    </span>
                  ) : (
                    <span className="text-amber-200">
                      ⚠️ <strong>Carga muy pesada:</strong> El torque de la carga ({torqueCarga} N·m) supera tu esfuerzo ({torqueEsfuerzo} N·m). ¡Acerca el fulcro hacia la caja para multiplicar tu fuerza!
                    </span>
                  )}
                </div>
              </>
            )}

            {/* 8. RAINBOW OPTICS HUD */}
            {simulation.id === 'arcoiris' && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300 mb-1">
                    <span>Ángulo del Rayo Solar</span>
                    <span className="font-mono text-pink-400 font-bold">{anguloLuz}°</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                    <div className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10" style={{ left: '46%' }} title="42° Ángulo Óptimo" />
                    <div
                      className="h-full transition-all duration-300 bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-indigo-500"
                      style={{ width: `${Math.min(100, ((anguloLuz - 10) / 70) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>10°</span>
                    <span className="text-yellow-300 font-bold">▲ 42° (Óptimo)</span>
                    <span>80°</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Nitidez Arcoíris</div>
                    <div className="font-mono text-pink-300 font-bold text-sm mt-0.5">{nitidezArcoiris}%</div>
                    <div className="text-[9px] text-slate-400">Gotas: {densGotas}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="text-slate-400">Desviación Angular</div>
                    <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">±{delta42}°</div>
                    <div className="text-[9px] text-slate-400">Luz solar: {brilloSolArc}%</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  {delta42 <= 5 ? (
                    <span className="text-pink-200">
                      🌈 <strong>¡Refracción Perfecta!</strong> Al incidir a ~42°, la luz blanca experimenta refracción, reflexión interna y dispersión dentro de la gota, separándose nítidamente en el espectro visible de 7 colores.
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      ✨ <strong>Dispersión Desalineada:</strong> A {anguloLuz}°, los rayos no emergen en el ángulo crítico de Descartes (42°), reduciendo la intensidad visual del arcoíris.
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

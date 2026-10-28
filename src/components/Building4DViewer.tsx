import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Building2, 
  Layers, 
  Clock, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Eye, 
  Sliders, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Check,
  FileText
} from 'lucide-react';

export const JAKSEL_4D_BIM_IMG = '/src/assets/images/jaksel_building_4d_bim_1793189277129.jpg';

interface Building4DViewerProps {
  buildingName: string;
  buildingType: string;
  companyName?: string;
  nib?: string;
  address?: string;
  permitStates?: Record<string, { name: string; selected: boolean; fileName: string | null }>;
  onOpenConsultation?: () => void;
  className?: string;
}

type TimePhase = 'phase1' | 'phase2' | 'phase3' | 'phase4';

interface HotspotData {
  id: string;
  name: string;
  level: string;
  system: string;
  status: 'Memenuhi Syarat' | 'Butuh Verifikasi' | 'Rekomendasi Teknis';
  permitName: string;
  description: string;
  position: [number, number, number];
}

export const Building4DViewer: React.FC<Building4DViewerProps> = ({
  buildingName,
  buildingType,
  companyName = 'PT Pengelola Gedung Jaksel',
  nib = '0123456789012',
  address = 'Jakarta Selatan',
  permitStates,
  onOpenConsultation,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'3d_interactive' | 'bim_4d'>('3d_interactive');
  
  // 4D Time Dimension State (Construction -> SLF 1 -> Periodic Audit -> 2026 Real-Time)
  const [currentPhase, setCurrentPhase] = useState<TimePhase>('phase4');
  
  // Layer visibility
  const [showStructure, setShowStructure] = useState<boolean>(true);
  const [showFireSystem, setShowFireSystem] = useState<boolean>(true);
  const [showMEP, setShowMEP] = useState<boolean>(true);
  const [showFacade, setShowFacade] = useState<boolean>(true);
  
  // Exploded view slider (0 = normal, 1 = fully exploded)
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);

  // Hotspots definitions
  const hotspots: HotspotData[] = [
    {
      id: 'hs-roof',
      name: 'Lantai Atap & Penangkal Petir',
      level: 'Rooftop (Lt. 36)',
      system: 'K3 Instalasi & SLF',
      status: permitStates?.slf?.selected ? 'Memenuhi Syarat' : 'Butuh Verifikasi',
      permitName: 'Sertifikat Laik Fungsi (SLF)',
      description: 'Sistem penangkal petir elektrostatis, helipad, gondola fasad, dan motor room lift.',
      position: [0, 8.5, 0]
    },
    {
      id: 'hs-mep-mid',
      name: 'Mechanical Floor (MEP Hub)',
      level: 'Lantai 18 (Zona Teknis)',
      system: 'K3 Instalasi & Kelistrikan',
      status: permitStates?.k3?.selected ? 'Memenuhi Syarat' : 'Rekomendasi Teknis',
      permitName: 'Izin K3 Instalasi (Disnakertrans)',
      description: 'Panel distribusi daya utama, transfer water pump, dan sistem chiller AC sentral.',
      position: [0, 4.2, 0]
    },
    {
      id: 'hs-podium',
      name: 'Lobi Utama & Jaringan Damkar',
      level: 'Podium (Lt. 1 - 3)',
      system: 'Proteksi Kebakaran',
      status: permitStates?.damkar?.selected ? 'Memenuhi Syarat' : 'Butuh Verifikasi',
      permitName: 'Sertifikasi Proteksi Damkar',
      description: 'Jaringan pipa hydrant riser, sprinkler aktif, fire alarm, dan tangga darurat bertekanan.',
      position: [0, 1.2, 0]
    },
    {
      id: 'hs-basement',
      name: 'Basement & Ruang Genset',
      level: 'Basement 1 - 3',
      system: 'K3 Genset & Lingkungan',
      status: permitStates?.env?.selected ? 'Memenuhi Syarat' : 'Rekomendasi Teknis',
      permitName: 'Persetujuan Lingkungan / AMDAL',
      description: 'Unit genset darurat tersertifikasi, ground water tank 400m³, dan instalasi STP limbah cair.',
      position: [0, -1.5, 0]
    }
  ];

  // Three.js Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const floorMeshesRef = useRef<{ mesh: THREE.Object3D; originalY: number; level: number }[]>([]);
  const facadeMeshesRef = useRef<THREE.Mesh[]>([]);
  const fireMeshesRef = useRef<THREE.Object3D[]>([]);
  const mepMeshesRef = useRef<THREE.Object3D[]>([]);
  const structureMeshesRef = useRef<THREE.Object3D[]>([]);
  const animFrameId = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (activeTab !== '3d_interactive' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070d18); // Modern deep technical slate

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.0); // Cool cyan accent
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.5); // Warm gold accent
    dirLight2.position.set(-20, 15, -15);
    scene.add(dirLight2);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(16, 12, 22);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Ground Grid & City Base
    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Ground reflective circular platform
    const platformGeo = new THREE.CylinderGeometry(8, 8.5, 0.4, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -2.4;
    scene.add(platform);

    // 5. Build Procedural 4D Skyscraper Model
    const buildingGroup = new THREE.Group();
    buildingGroupRef.current = buildingGroup;
    scene.add(buildingGroup);

    floorMeshesRef.current = [];
    facadeMeshesRef.current = [];
    fireMeshesRef.current = [];
    mepMeshesRef.current = [];
    structureMeshesRef.current = [];

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.3
    });

    const steelColumnMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.52,
      depthWrite: false
    });

    const fireRiserMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red Fire System
      emissive: 0x7f1d1d,
      roughness: 0.3,
      metalness: 0.7
    });

    const mepCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber MEP Electricity/Lift
      emissive: 0x78350f,
      roughness: 0.4,
      metalness: 0.6
    });

    // A. Central Concrete Elevator / Stair Core (Runs through all floors)
    const coreGeo = new THREE.BoxGeometry(2.2, 12, 2.2);
    const coreMesh = new THREE.Mesh(coreGeo, concreteMat);
    coreMesh.position.set(0, 3.8, 0);
    buildingGroup.add(coreMesh);
    structureMeshesRef.current.push(coreMesh);

    // B. Fire Riser Pipe (Vertical Red Pipe along core)
    const riserGeo = new THREE.CylinderGeometry(0.12, 0.12, 12, 12);
    const riserMesh = new THREE.Mesh(riserGeo, fireRiserMat);
    riserMesh.position.set(1.2, 3.8, 1.2);
    buildingGroup.add(riserMesh);
    fireMeshesRef.current.push(riserMesh);

    // C. MEP Elevator Shaft & Lift Car
    const liftShaftGeo = new THREE.BoxGeometry(1.4, 11.5, 1.4);
    const liftShaftWireMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const liftShaftMesh = new THREE.Mesh(liftShaftGeo, liftShaftWireMat);
    liftShaftMesh.position.set(-0.2, 3.8, -0.2);
    buildingGroup.add(liftShaftMesh);
    mepMeshesRef.current.push(liftShaftMesh);

    // Dynamic Lift Car
    const liftCarGeo = new THREE.BoxGeometry(1.1, 0.9, 1.1);
    const liftCarMesh = new THREE.Mesh(liftCarGeo, mepCoreMat);
    liftCarMesh.name = 'liftCar';
    liftCarMesh.position.set(-0.2, 1, -0.2);
    buildingGroup.add(liftCarMesh);
    mepMeshesRef.current.push(liftCarMesh);

    // D. Multi-Tier Floor Slabs (7 main distinct sectional floors for 4D Inspection)
    const totalFloors = 7;
    const floorHeight = 1.4;

    for (let i = 0; i < totalFloors; i++) {
      const floorGroup = new THREE.Group();
      const currentY = (i - 1) * floorHeight; // Basement at -1, podium at 0, towers up to 5

      // Width tapers slightly as height increases (architectural aesthetic)
      const sizeScale = i <= 1 ? 5.2 : i <= 4 ? 4.4 : 3.8;

      // 1. Concrete Slab
      const slabGeo = new THREE.BoxGeometry(sizeScale, 0.18, sizeScale);
      const slabMesh = new THREE.Mesh(slabGeo, concreteMat);
      floorGroup.add(slabMesh);

      // 2. Structural Corner Columns
      const colOffset = sizeScale / 2 - 0.3;
      const colGeo = new THREE.BoxGeometry(0.22, floorHeight - 0.18, 0.22);
      const colPositions = [
        [colOffset, (floorHeight - 0.18) / 2, colOffset],
        [-colOffset, (floorHeight - 0.18) / 2, colOffset],
        [colOffset, (floorHeight - 0.18) / 2, -colOffset],
        [-colOffset, (floorHeight - 0.18) / 2, -colOffset]
      ];

      colPositions.forEach(([cx, cy, cz]) => {
        const colMesh = new THREE.Mesh(colGeo, steelColumnMat);
        colMesh.position.set(cx, cy, cz);
        floorGroup.add(colMesh);
        structureMeshesRef.current.push(colMesh);
      });

      // 3. Glass Exterior Facade Wall (per floor for exploded view)
      const glassGeo = new THREE.BoxGeometry(sizeScale + 0.08, floorHeight, sizeScale + 0.08);
      const facadeMesh = new THREE.Mesh(glassGeo, glassMat);
      facadeMesh.position.y = floorHeight / 2;
      floorGroup.add(facadeMesh);
      facadeMeshesRef.current.push(facadeMesh);

      // 4. Fire Sprinkler Ring (per floor)
      const sprinklerRingGeo = new THREE.TorusGeometry(sizeScale / 2 - 0.6, 0.04, 8, 24);
      const sprinklerMesh = new THREE.Mesh(sprinklerRingGeo, fireRiserMat);
      sprinklerMesh.rotation.x = Math.PI / 2;
      sprinklerMesh.position.y = floorHeight - 0.1;
      floorGroup.add(sprinklerMesh);
      fireMeshesRef.current.push(sprinklerMesh);

      floorGroup.position.y = currentY;
      buildingGroup.add(floorGroup);

      floorMeshesRef.current.push({
        mesh: floorGroup,
        originalY: currentY,
        level: i
      });
    }

    // E. Rooftop Crown & Helipad
    const roofCrownGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.6, 16);
    const roofCrownMesh = new THREE.Mesh(roofCrownGeo, steelColumnMat);
    roofCrownMesh.position.y = 8.2;
    buildingGroup.add(roofCrownMesh);

    // Lightning Rod / Penangkal Petir at Top
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.8, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95 });
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.y = 9.4;
    buildingGroup.add(rodMesh);

    // Mouse drag rotation & interaction
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !buildingGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      buildingGroupRef.current.rotation.y += deltaX * 0.008;
      
      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(3, Math.min(22, cameraRef.current.position.y + deltaY * 0.04));
        cameraRef.current.lookAt(0, 3, 0);
      }

      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.02;
      cameraRef.current.position.z = Math.max(12, Math.min(38, cameraRef.current.position.z + zoomDelta));
      cameraRef.current.position.x = Math.max(8, Math.min(30, cameraRef.current.position.x + zoomDelta * 0.7));
      cameraRef.current.lookAt(0, 3, 0);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !buildingGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePos.current.x;
      buildingGroupRef.current.rotation.y += deltaX * 0.008;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    domElement.addEventListener('touchstart', onTouchStart);
    domElement.addEventListener('touchmove', onTouchMove);
    domElement.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle rotation if enabled and not dragging
      if (isRotating && !isDraggingRef.current && buildingGroupRef.current) {
        buildingGroupRef.current.rotation.y += 0.003;
      }

      // Animate Lift Car traveling up and down
      const lift = buildingGroup.getObjectByName('liftCar');
      if (lift) {
        lift.position.y = 1.0 + Math.sin(elapsedTime * 0.8) * 3.5;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 420;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [activeTab, isRotating]);

  // Update exploded view when explodeFactor changes
  useEffect(() => {
    floorMeshesRef.current.forEach(({ mesh, originalY, level }) => {
      mesh.position.y = originalY + (level - 3) * explodeFactor * 1.5;
    });
  }, [explodeFactor]);

  // Toggle Visibility Layers
  useEffect(() => {
    facadeMeshesRef.current.forEach(m => (m.visible = showFacade));
    structureMeshesRef.current.forEach(m => (m.visible = showStructure));
    fireMeshesRef.current.forEach(m => (m.visible = showFireSystem));
    mepMeshesRef.current.forEach(m => (m.visible = showMEP));
  }, [showFacade, showStructure, showFireSystem, showMEP]);

  return (
    <div className={`bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      {/* 4D Viewer Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">{buildingName}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-400/30">
                4D Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Simulasi Kelaikan Ruang &amp; Siklus Pemeliharaan (SLF/PBG/Damkar/K3)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('3d_interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === '3d_interactive'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>4D Interaktif (WebGL)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bim_4d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'bim_4d'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>BIM 4D Blueprint</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="relative min-h-[380px] sm:min-h-[460px] bg-slate-950 overflow-hidden flex flex-col justify-between">
        
        {/* TAB 1: 3D/4D Interactive WebGL Canvas */}
        {activeTab === '3d_interactive' && (
          <div className="relative w-full h-[380px] sm:h-[460px]">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Canvas Floating Overlay Controls */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-sm">
              <span className="bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-300 border border-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Drag Mouse / Sentuh untuk Memutar 3D</span>
              </span>
              <button
                type="button"
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                  isRotating 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' 
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isRotating ? 'Rotasi: Aktif' : 'Rotasi: Jeda'}
              </button>
            </div>

            {/* Exploded View Slider Overlay (Bottom Left) */}
            <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800 p-2.5 rounded-2xl z-10 space-y-1 w-52 shadow-lg">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                <span className="flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-sky-400" />
                  <span>Uraian Tiap Lantai (Explode):</span>
                </span>
                <span className="text-sky-400 font-mono font-bold">{Math.round(explodeFactor * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodeFactor}
                onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Interactive Hotspot Buttons Overlay (Floating on Right) */}
            <div className="absolute top-3 right-3 space-y-1.5 z-10 max-w-[200px]">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800 block text-right">
                Hotspot Inspeksi 4D
              </span>
              {hotspots.map((hs) => (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => setSelectedHotspot(selectedHotspot?.id === hs.id ? null : hs)}
                  className={`w-full text-left p-2 rounded-xl text-[11px] font-semibold transition border backdrop-blur flex items-center justify-between shadow-xs ${
                    selectedHotspot?.id === hs.id
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md ring-2 ring-sky-300/40'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800'
                  }`}
                >
                  <div className="truncate mr-1">
                    <span className="block font-bold truncate">{hs.name}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{hs.level}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    hs.status === 'Memenuhi Syarat' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BIM 4D Architectural Blueprint Render */}
        {activeTab === 'bim_4d' && (
          <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center bg-black">
            <img
              src={JAKSEL_4D_BIM_IMG}
              alt="Jakarta Innovation Tower 4D Digital Twin"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur p-3 rounded-2xl border border-slate-800 max-w-xs text-white">
              <span className="text-[9px] font-extrabold uppercase text-sky-400 tracking-wider">
                Dokumentasi 4D BIM Digital Twin
              </span>
              <h4 className="text-xs font-bold mt-0.5">{buildingName} • Jakarta Selatan</h4>
              <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                Integrasi model struktur 3D dengan dimensi ke-4 (waktu pemeliharaan berkala, siklus uji SLF, dan sensor IoT proteksi gedung).
              </p>
            </div>
          </div>
        )}

        {/* Selected Hotspot Inspection Card (Floating Panel) */}
        {selectedHotspot && (
          <div className="p-4 bg-slate-950/95 backdrop-blur border-t border-slate-800 animate-slide-in text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-sky-400">{selectedHotspot.level}</span>
                <span className="text-slate-500">•</span>
                <h4 className="text-sm font-bold text-white">{selectedHotspot.name}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedHotspot.status === 'Memenuhi Syarat'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {selectedHotspot.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug max-w-2xl">
                {selectedHotspot.description}
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Regulasi Terkait: <strong className="text-white">{selectedHotspot.permitName}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onOpenConsultation && (
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Minta Verifikasi PTSP
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedHotspot(null)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4D Bottom Control Panel: Time Dimension & Layer Filter */}
      <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Dimensi Ke-4: Siklus Waktu Kelaikan (Time Lifecycle Phase) */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Dimensi Ke-4: Siklus Waktu Kelaikan Bangunan (4D Timeline)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'phase1', label: 'Tahun 0: Desain/PBG', desc: 'Konstruksi Fisik' },
              { id: 'phase2', label: 'Tahun 1: SLF Awal', desc: 'Uji Laik Pertama' },
              { id: 'phase3', label: 'Tahun 5: Riksa Uji', desc: 'Perpanjangan Berkala' },
              { id: 'phase4', label: '2026: Real-Time', desc: 'Kendali Aktif PTSP' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPhase(p.id as TimePhase)}
                className={`p-2 rounded-xl text-left transition border ${
                  currentPhase === p.id
                    ? 'bg-sky-950/80 border-sky-400 text-white ring-1 ring-sky-400/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="block text-[11px] font-bold leading-tight truncate">{p.label}</span>
                <span className="block text-[9px] text-slate-400 truncate mt-0.5">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Layer Sistem Kelaikan */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Layer Sistem Kelaikan:</span>
            </span>
            <span className="text-[10px] text-slate-400">Aktifkan/Sembunyikan</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setShowStructure(!showStructure)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between ${
                showStructure
                  ? 'bg-blue-950/80 text-blue-200 border-blue-500/50'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800'
              }`}
            >
              <span>🏗️ Struktur Core</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showStructure ? 'bg-sky-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowFireSystem(!showFireSystem)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between ${
                showFireSystem
                  ? 'bg-rose-950/80 text-rose-200 border-rose-500/50'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800'
              }`}
            >
              <span>🔥 Proteksi Damkar</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showFireSystem ? 'bg-rose-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowMEP(!showMEP)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between ${
                showMEP
                  ? 'bg-amber-950/80 text-amber-200 border-amber-500/50'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800'
              }`}
            >
              <span>⚡ K3 Lift &amp; MEP</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showMEP ? 'bg-amber-400' : 'bg-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowFacade(!showFacade)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between ${
                showFacade
                  ? 'bg-sky-950/80 text-sky-200 border-sky-500/50'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800'
              }`}
            >
              <span>🏢 Kaca Fasad</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showFacade ? 'bg-sky-400' : 'bg-slate-600'}`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

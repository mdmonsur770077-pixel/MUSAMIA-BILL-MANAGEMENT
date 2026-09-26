import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, EyeOff, Building2, Grid, Layers, Sparkles } from 'lucide-react';

interface ThreeBackgroundProps {
  className?: string;
}

type ModelMode = 'tower' | 'isometric' | 'geodesic';

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [modelMode, setModelMode] = useState<ModelMode>('tower');
  const [showControls, setShowControls] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Clean prior canvas elements
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add subtle ambient fog for realistic blueprint depth
    scene.fog = new THREE.FogExp2(0x050814, 0.015);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 10, 36);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root group for the architectural structure
    const architectureGroup = new THREE.Group();
    scene.add(architectureGroup);

    // 1. Engineering Isometric Ground Grid (Blueprint Floor)
    const gridHelper = new THREE.GridHelper(60, 30, 0x00f2fe, 0x152244);
    gridHelper.position.y = -10;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.28;
    scene.add(gridHelper);

    // Secondary sub-grid for high-tech CAD aesthetic
    const subGridHelper = new THREE.GridHelper(30, 60, 0x38bdf8, 0x0d172e);
    subGridHelper.position.y = -9.95;
    (subGridHelper.material as THREE.Material).transparent = true;
    (subGridHelper.material as THREE.Material).opacity = 0.16;
    scene.add(subGridHelper);

    // Materials
    const beamMaterial = new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.32,
    });

    const slabMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });

    const secondaryMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.22,
    });

    // Build the specific 3D model based on mode
    let nodeVertices: number[] = [];

    if (modelMode === 'tower') {
      // Professional Multi-Story BIM Architectural Tower
      const floors = 7;
      const floorHeight = 2.8;
      const baseWidth = 14;
      const baseDepth = 10;

      for (let i = 0; i < floors; i++) {
        const y = -8 + i * floorHeight;
        // Floor plate taper for sleek modern tower architecture
        const taper = 1 - (i / floors) * 0.25;
        const w = baseWidth * taper;
        const d = baseDepth * taper;

        // Floor slab wireframe
        const slabGeo = new THREE.BoxGeometry(w, 0.15, d);
        const slabMesh = new THREE.Mesh(slabGeo, slabMaterial);
        slabMesh.position.y = y;
        architectureGroup.add(slabMesh);

        // Record 4 corners as structural nodes
        const hw = w / 2;
        const hd = d / 2;
        nodeVertices.push(
          hw, y, hd,
          -hw, y, hd,
          -hw, y, -hd,
          hw, y, -hd
        );

        // Structural columns between floors
        if (i < floors - 1) {
          const nextTaper = 1 - ((i + 1) / floors) * 0.25;
          const nextHw = (baseWidth * nextTaper) / 2;
          const nextHd = (baseDepth * nextTaper) / 2;
          const nextY = y + floorHeight;

          const columnPositions = [
            [hw, y, hd, nextHw, nextY, nextHd],
            [-hw, y, hd, -nextHw, nextY, nextHd],
            [-hw, y, -hd, -nextHw, nextY, -nextHd],
            [hw, y, -hd, nextHw, nextY, -nextHd],
            // Interior core columns
            [hw * 0.35, y, 0, nextHw * 0.35, nextY, 0],
            [-hw * 0.35, y, 0, -nextHw * 0.35, nextY, 0],
          ];

          columnPositions.forEach((pts) => {
            const lineGeo = new THREE.BufferGeometry().setAttribute(
              'position',
              new THREE.Float32BufferAttribute(pts, 3)
            );
            const line = new THREE.Line(lineGeo, beamMaterial);
            architectureGroup.add(line);
          });

          // Diagonal cross-braces on every 2nd floor for engineering realism
          if (i % 2 === 0) {
            const bracePts = [
              hw, y, hd, -nextHw, nextY, nextHd,
              -hw, y, -hd, nextHw, nextY, -nextHd,
            ];
            const braceGeo = new THREE.BufferGeometry().setAttribute(
              'position',
              new THREE.Float32BufferAttribute(bracePts, 3)
            );
            const braceLine = new THREE.LineSegments(braceGeo, secondaryMaterial);
            architectureGroup.add(braceLine);
          }
        }
      }

      // Antenna / Spire on top
      const topY = -8 + (floors - 1) * floorHeight;
      const spirePts = [
        0, topY, 0, 0, topY + 4.5, 0,
        -1.5, topY, 0, 0, topY + 2.5, 0,
        1.5, topY, 0, 0, topY + 2.5, 0,
      ];
      const spireGeo = new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(spirePts, 3)
      );
      architectureGroup.add(new THREE.Line(spireGeo, beamMaterial));
      nodeVertices.push(0, topY + 4.5, 0);

    } else if (modelMode === 'isometric') {
      // Multi-Level Foundation & Construction Grid Platform
      const levels = 4;
      for (let l = 0; l < levels; l++) {
        const y = -7 + l * 4;
        const size = 20 - l * 3.5;
        const gridBoxGeo = new THREE.BoxGeometry(size, 0.4, size, 4, 1, 4);
        const gridMesh = new THREE.Mesh(gridBoxGeo, slabMaterial);
        gridMesh.position.y = y;
        architectureGroup.add(gridMesh);

        // Corner foundation pillars
        const hs = size / 2;
        const pillarPts = [
          hs, y, hs, hs, y + 3.6, hs,
          -hs, y, hs, -hs, y + 3.6, hs,
          -hs, y, -hs, -hs, y + 3.6, -hs,
          hs, y, -hs, hs, y + 3.6, -hs,
        ];
        const pillarGeo = new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.Float32BufferAttribute(pillarPts, 3)
        );
        architectureGroup.add(new THREE.LineSegments(pillarGeo, beamMaterial));

        nodeVertices.push(hs, y, hs, -hs, y, hs, -hs, y, -hs, hs, y, -hs);
      }
    } else {
      // Geodesic Space-Truss / Civil Engineering Dome
      const domeGeo = new THREE.IcosahedronGeometry(11, 2);
      const wireframe = new THREE.WireframeGeometry(domeGeo);
      const line = new THREE.LineSegments(wireframe, beamMaterial);
      architectureGroup.add(line);

      // Inner structural core ring
      const ringGeo = new THREE.CylinderGeometry(5.5, 5.5, 8, 12, 3, true);
      const ringWire = new THREE.WireframeGeometry(ringGeo);
      const ringLine = new THREE.LineSegments(ringWire, secondaryMaterial);
      architectureGroup.add(ringLine);

      // Extract vertices for glowing node beacons
      const pos = domeGeo.attributes.position;
      for (let i = 0; i < pos.count; i += 2) {
        nodeVertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }

    // Glowing Node Points (Structural Vertices)
    if (nodeVertices.length > 0) {
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(nodeVertices, 3)
      );
      const nodeMat = new THREE.PointsMaterial({
        color: 0x00f2fe,
        size: 0.32,
        transparent: true,
        opacity: 0.85,
      });
      const nodesMesh = new THREE.Points(nodeGeo, nodeMat);
      architectureGroup.add(nodesMesh);
    }

    // Floating Ambient Coordinate Data Dust (Particles)
    const dustCount = 450;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 75;
      dustPositions[i + 1] = (Math.random() - 0.5) * 45;
      dustPositions[i + 2] = (Math.random() - 0.5) * 55;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Mouse Tracking Parallax
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Gentle isometric elevation for executive architectural view
    architectureGroup.rotation.x = 0.12;

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!isPausedRef.current) {
        // Smooth, dignified architectural rotation
        architectureGroup.rotation.y += 0.0018;
        dustPoints.rotation.y += 0.0004;
      }

      // Smooth camera parallax
      const targetCamX = mouseX * 3.5;
      const targetCamY = 10 - mouseY * 2.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.lookAt(0, -1, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelMode]);

  return (
    <>
      {/* 3D WebGL Canvas Layer */}
      <div
        id="canvas-container"
        ref={mountRef}
        className={`fixed inset-0 w-screen h-screen -z-10 pointer-events-none no-print ${className}`}
      />

      {/* Floating 3D Architectural Blueprint Controller */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-2 no-print">
        {showControls && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-2 rounded-xl bg-[#0b1329]/95 backdrop-blur-md border border-[#00f2fe]/40 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-xs max-w-[calc(100vw-24px)]">
            <button
              onClick={() => setModelMode('tower')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                modelMode === 'tower'
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] font-semibold border border-[#00f2fe]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>বিআইএম টাওয়ার</span>
            </button>

            <button
              onClick={() => setModelMode('isometric')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                modelMode === 'isometric'
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] font-semibold border border-[#00f2fe]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>সাইট গ্রিড</span>
            </button>

            <button
              onClick={() => setModelMode('geodesic')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                modelMode === 'geodesic'
                  ? 'bg-[#00f2fe]/20 text-[#00f2fe] font-semibold border border-[#00f2fe]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>স্পেস-ফ্রেম</span>
            </button>

            <div className="hidden sm:block w-[1px] h-4 bg-slate-700 mx-1" />

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1.5 rounded-lg transition-colors ${
                isPaused ? 'text-amber-400 hover:bg-amber-400/20' : 'text-slate-400 hover:text-white'
              }`}
              title={isPaused ? 'ঘূর্ণন চালু করুন' : 'ঘূর্ণন থামান'}
            >
              {isPaused ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b1329]/90 hover:bg-[#0b1329] backdrop-blur-md border border-[#00f2fe]/40 text-[#00f2fe] hover:border-[#00f2fe] shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all text-xs font-semibold cursor-pointer active:scale-95"
          title="3D আর্কিটেকচারাল মডেল পরিবর্তন"
        >
          <Building2 className="w-4 h-4 text-[#00f2fe]" />
          <span>3D ব্লুপ্রিন্ট</span>
        </button>
      </div>
    </>
  );
};

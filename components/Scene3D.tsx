"use client"

import { Suspense, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { CameraControls, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei"
import ModelViewer from "./ModelViewer"
import Ocean from "./Ocean"
import Ground from "./Ground"
import StepOptionCards from "./StepOptionCards"
import SelectedPhaseCard from "./SelectedPhaseCard"
import NavigationBar from "./NavigationBar"
import { useProjectStore } from "@/store/useProjectStore"
import { useAdminStore } from "@/store/useAdminStore"
import { useShallow } from "zustand/react/shallow"

function SceneContent() {
  const cameraRef = useRef<CameraControls>(null)
  const modelUrl = useAdminStore((s) => s.modelUrl)

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 16, 8]} intensity={1.2} />
      <directionalLight position={[-8, 10, -6]} intensity={0.4} color="#93c5fd" />

      <Ocean />
      <Ground />

      <Suspense fallback={null}>
        <ModelViewer url={modelUrl} />
      </Suspense>

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <CameraControls
        ref={cameraRef}
        minDistance={4}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  )
}

export default function Scene3D() {
  const { selectedPhases, showAll, toggleShowAll } = useProjectStore(
    useShallow((s) => ({ selectedPhases: s.selectedPhases, showAll: s.showAll, toggleShowAll: s.toggleShowAll }))
  )

  return (
    <div className="relative w-full h-full">
      <Canvas
        frameloop="always"
        performance={{ min: 0.5 }}
        camera={{ position: [14, 10, 16], fov: 45 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <SceneContent />
      </Canvas>

      <StepOptionCards />
      <SelectedPhaseCard />
      <NavigationBar />

      <button
        onClick={toggleShowAll}
        className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur transition-all duration-200 ${
          showAll
            ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
            : "bg-black/40 text-gray-500 border-white/10 hover:bg-white/10 hover:text-white"
        }`}
      >
        {showAll ? "Ver Selecionadas" : "Ver Completo"}
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[10px] text-gray-500/60 uppercase tracking-widest">
          {selectedPhases.length === 0
            ? "Select a phase to begin building"
            : "Drag to orbit · Scroll to zoom"}
        </p>
      </div>
    </div>
  )
}

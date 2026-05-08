"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useProjectStore } from "@/store/useProjectStore"
import { phases } from "@/data/phases"

// Placeholder boxes representing the 13 construction phases
// Y=0 is ground level. Replace with real GLB once SketchUp export is ready.
const PHASE_GEOMETRIES: Record<string, { position: [number, number, number]; size: [number, number, number] }> = {
  // Foundation
  site_piles:      { position: [0, -1.5, 0],  size: [7,    3.0,  7   ] },
  rebar_beams:     { position: [0,  0.10, 0],  size: [5.5,  0.12, 5.5 ] },
  steel_mesh:      { position: [0,  0.18, 0],  size: [5.4,  0.06, 5.4 ] },
  floor_concrete:  { position: [0,  0.28, 0],  size: [5.5,  0.18, 5.5 ] },
  // Ground floor
  panels_gf:       { position: [0,  1.50, 0],  size: [5,    2.4,  5   ] },
  slab_structure:  { position: [0,  2.75, 0],  size: [5,    0.20, 5   ] },
  slab_concrete:   { position: [0,  2.90, 0],  size: [5,    0.16, 5   ] },
  // Second floor
  panels_sf:       { position: [0,  4.20, 0],  size: [5,    2.4,  5   ] },
  scip_slab:       { position: [0,  5.45, 0],  size: [5,    0.20, 5   ] },
  shotcrete_l1:    { position: [0,  5.62, 0],  size: [5,    0.14, 5   ] },
  // Third floor & roof
  panels_tf:       { position: [0,  6.90, 0],  size: [4,    2.2,  4   ] },
  roof_panels:     { position: [0,  8.10, 0],  size: [4.2,  0.22, 4.2 ] },
  shotcrete_roof:  { position: [0,  8.28, 0],  size: [4.2,  0.14, 4.2 ] },
}

function PhaseBlock({ phaseId }: { phaseId: string }) {
  const { isPhaseActive } = useProjectStore()
  const active = isPhaseActive(phaseId)
  const phase = phases.find((p) => p.id === phaseId)
  const geo = PHASE_GEOMETRIES[phaseId]

  if (!geo || !phase || !active) return null

  return (
    <mesh position={geo.position} castShadow receiveShadow>
      <boxGeometry args={geo.size} />
      <meshStandardMaterial
        color={phase.color}
        transparent
        opacity={0.85}
        roughness={0.35}
        metalness={0.15}
        emissive={phase.color}
        emissiveIntensity={0.07}
      />
    </mesh>
  )
}

export default function PlaceholderModel() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {Object.keys(PHASE_GEOMETRIES).map((id) => (
        <PhaseBlock key={id} phaseId={id} />
      ))}
    </group>
  )
}

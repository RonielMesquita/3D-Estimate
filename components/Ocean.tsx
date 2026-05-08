"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sky } from "@react-three/drei"
import * as THREE from "three"

// ── Ajuste único ──────────────────────────────────────────────────────────
// SHORE_Z: coordenada Z onde a água começa (borda frontal do plano).
//   Mais negativo  → recua a água (aumenta o gap entre terreno e água)
//   Menos negativo → avança a água em direção ao terreno
const SHORE_Z = -10
// ─────────────────────────────────────────────────────────────────────────

const OCEAN_WIDTH = 2000
const OCEAN_DEPTH = 600

function WaterPlane() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  const waterTexture = useMemo(() => {
    const size = 256
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4
        const wave = Math.sin(i * 0.3) * Math.cos(j * 0.3) * 15
        data[idx]     = 80  + wave
        data[idx + 1] = 185 + wave
        data[idx + 2] = 195 + wave
        data[idx + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(12, 12)
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime * 0.04
    matRef.current.map!.offset.set(Math.sin(t) * 0.05, t)
    state.invalidate()
  })

  // borda frontal do plano = SHORE_Z; plano se estende todo para -Z (oceano)
  const centerZ = SHORE_Z - OCEAN_DEPTH / 2

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, centerZ]}>
      <planeGeometry args={[OCEAN_WIDTH, OCEAN_DEPTH]} />
      <meshStandardMaterial
        ref={matRef}
        map={waterTexture}
        color="#50c8c0"
        metalness={0.3}
        roughness={0.25}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

export default function Ocean() {
  return (
    <>
      <Sky
        distance={4500}
        sunPosition={[1, 0.4, -2]}
        inclination={0.48}
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.003}
        mieDirectionalG={0.75}
      />
      <WaterPlane />
      <fog attach="fog" args={["#a8d4e6", 80, 400]} />
    </>
  )
}

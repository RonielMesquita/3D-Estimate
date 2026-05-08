"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useShallow } from "zustand/react/shallow"
import * as THREE from "three"
import { useProjectStore } from "@/store/useProjectStore"

const VERT = /* glsl */`
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const FRAG = /* glsl */`
  varying vec3 vWorldPos;
  uniform float uOpacity;

  void main() {
    vec2 xz = vWorldPos.xz;

    // cell grid (1 unit)
    vec2 c1 = xz / 1.0;
    vec2 g1 = abs(fract(c1 - 0.5) - 0.5) / fwidth(c1);
    float cell = 1.0 - min(min(g1.x, g1.y), 1.0);

    // section grid (5 units)
    vec2 c5 = xz / 5.0;
    vec2 g5 = abs(fract(c5 - 0.5) - 0.5) / fwidth(c5);
    float sec = 1.0 - min(min(g5.x, g5.y), 1.0);

    // radial fade
    float dist = length(xz);
    float fade = max(0.0, 1.0 - pow(dist / 120.0, 1.8));

    vec3 cellCol = vec3(0.051, 0.129, 0.216);
    vec3 secCol  = vec3(0.055, 0.204, 0.376);
    vec3 col     = mix(cellCol, secCol, sec);
    float alpha  = max(cell * 0.35, sec * 0.75) * fade * uOpacity;

    if (alpha < 0.001) discard;
    gl_FragColor = vec4(col, alpha);
  }
`

export default function Ground() {
  const selectedPhases = useProjectStore(useShallow((s) => s.selectedPhases))
  const pilesConfirmed = selectedPhases.includes("piles")

  const groupRef  = useRef<THREE.Group>(null)
  const matRef    = useRef<THREE.ShaderMaterial>(null)
  const basMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const opacity   = useRef(0)
  const delay     = useRef(0)
  const prevPiles = useRef(false)

  const uniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useFrame((_, delta) => {
    if (pilesConfirmed && !prevPiles.current) delay.current = 0
    prevPiles.current = pilesConfirmed

    if (pilesConfirmed) {
      if (delay.current < 1.8) { delay.current += delta; return }
      opacity.current = THREE.MathUtils.lerp(opacity.current, 1, delta * 1.2)
    } else {
      delay.current = 0
      opacity.current = THREE.MathUtils.lerp(opacity.current, 0, delta * 3)
    }

    const v = opacity.current
    if (groupRef.current) groupRef.current.visible = v > 0.01
    if (matRef.current)   matRef.current.uniforms.uOpacity.value = v
    if (basMatRef.current) {
      basMatRef.current.opacity     = v
      basMatRef.current.transparent = true
    }
  })

  return (
    <group ref={groupRef} visible={false} position={[0, -3, 0]}>
      {/* dark base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial
          ref={basMatRef}
          color="#040810"
          roughness={1}
          metalness={0}
          transparent
          opacity={0}
        />
      </mesh>

      {/* tech grid overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[2000, 2000]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

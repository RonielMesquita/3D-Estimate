"use client"

import { useEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { useProjectStore } from "@/store/useProjectStore"
import { useAdminStore } from "@/store/useAdminStore"

useGLTF.setDecoderPath("/draco/")

interface Props {
  url: string
}

export default function ModelViewer({ url }: Props) {
  const { scene } = useGLTF(url)
  const selectedPhases = useProjectStore((s) => s.selectedPhases)
  const showAll = useProjectStore((s) => s.showAll)
  const phases = useAdminStore((s) => s.phases)

  const phaseGroups = useRef<Record<string, THREE.Object3D>>({})
  const phaseMats  = useRef<Record<string, THREE.MeshStandardMaterial[]>>({})
  const baseScales = useRef<Record<string, THREE.Vector3>>({})
  const animProgress = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!scene) return

    const newGroups: Record<string, THREE.Object3D> = {}
    const newMats:   Record<string, THREE.MeshStandardMaterial[]> = {}
    const newScales: Record<string, THREE.Vector3> = {}

    // ── Pass 1: locate phase GROUP nodes, hide them as a unit ──
    scene.traverse((node) => {
      if (node.name.toLowerCase() === "00_context") return // leave visible

      const phase = phases.find(
        (p) => node.name.toLowerCase() === p.modelObjectName.toLowerCase()
      )
      if (phase && !newGroups[phase.id]) {
        newGroups[phase.id] = node
        newScales[phase.id] = node.scale.clone()
        node.visible = false // hide the whole subtree at once
      }
    })

    // ── Pass 2: collect materials; hide orphan meshes ──────────
    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return

      // Always-visible context branch
      let cur: THREE.Object3D | null = node
      while (cur) {
        if (cur.name.toLowerCase() === "00_context") { node.visible = true; return }
        cur = cur.parent
      }

      // Find phase ancestor
      cur = node
      let matched = null
      while (cur) {
        matched = phases.find(
          (p) => cur!.name.toLowerCase() === p.modelObjectName.toLowerCase()
        )
        if (matched) break
        cur = cur.parent
      }

      if (!matched) { node.visible = false; return }

      // Cache unique materials (group visibility handles show/hide — don't touch node.visible)
      if (!newMats[matched.id]) newMats[matched.id] = []
      const mats = Array.isArray(node.material) ? node.material : [node.material]
      mats.forEach((mat) => {
        if (
          mat instanceof THREE.MeshStandardMaterial &&
          !newMats[matched!.id].includes(mat)
        ) {
          mat.transparent = true
          mat.depthWrite  = false
          newMats[matched!.id].push(mat)
        }
      })
    })

    phaseGroups.current = newGroups
    phaseMats.current   = newMats
    baseScales.current  = newScales
    phases.forEach((p) => { animProgress.current[p.id] = 0 })
  }, [scene, phases])

  useFrame((_, delta) => {
    const phases = useAdminStore.getState().phases
    phases.forEach((phase) => {
      const group = phaseGroups.current[phase.id]
      if (!group) return

      const isActive = showAll || selectedPhases.includes(phase.id)
      const target = isActive ? 1 : 0
      const prev   = animProgress.current[phase.id] ?? target
      const next   = THREE.MathUtils.lerp(prev, target, Math.min(1, delta * 5))
      animProgress.current[phase.id] = next

      if (next < 0.008) { group.visible = false; return }
      group.visible = true

      // Pop-in scale
      const base = baseScales.current[phase.id]
      if (base) group.scale.set(base.x * next, base.y * next, base.z * next)

      // Apenas fade de opacidade — sem emissive, sem pulso, cor original
      const mats = phaseMats.current[phase.id]
      if (!mats) return

      mats.forEach((mat) => {
        mat.opacity    = next
        mat.transparent = next < 0.97
        mat.depthWrite  = next >= 0.97
        mat.emissiveIntensity = 0
      })
    })
  })

  return <primitive object={scene} />
}


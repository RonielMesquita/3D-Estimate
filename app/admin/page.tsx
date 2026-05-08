"use client"

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import type { Phase, PhaseOption } from "@/types/project"

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#050B14",
  bgSec:     "#0A1320",
  surface:   "#101B2C",
  elevated:  "#132238",
  inputBg:   "#0D1829",
  inputBdr:  "rgba(255,255,255,0.07)",
  border:    "rgba(255,255,255,0.08)",
  borderSec: "rgba(255,255,255,0.05)",
  divider:   "rgba(255,255,255,0.04)",
  text:      "#F0F6FF",
  textSec:   "#A6B6CC",
  textMuted: "#6D7F98",
  textPh:    "#4C5D75",
  gold:      "#F5B942",
  cyan:      "#17D7FF",
  cyanSoft:  "#0BA8D9",
  green:     "#18D17C",
  red:       "#FF4D5A",
  blue:      "#2D6BFF",
  purple:    "#8B5CF6",
} as const

const FONT = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

type Tab = "dashboard" | "passos" | "opcoes" | "midia" | "proposta" | "configuracoes"
const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard",     label: "Dashboard"     },
  { id: "passos",        label: "Passos"         },
  { id: "opcoes",        label: "Opções"         },
  { id: "midia",         label: "Mídia"          },
  { id: "proposta",      label: "Proposta"       },
  { id: "configuracoes", label: "Configurações"  },
]

const CAT_LABELS: Record<string, string> = {
  "Foundation":         "FUNDAÇÃO",
  "Ground Floor":       "TÉRREO",
  "Second Floor":       "SEGUNDO ANDAR",
  "Third Floor & Roof": "TERCEIRO ANDAR E COBERTURA",
}

const ANIM_TYPES   = ["Fade In", "Rise Up", "Slide Reveal", "Scale In", "Draw Lines", "Concrete Fill", "Custom"]
const CAM_TARGETS  = ["Foundation", "Ground Slab", "Walls", "Roof", "Custom Coordinates"]
const VIS_BEHAVIOR = ["Geometry Changes", "Pricing Only", "Hybrid"]
const CATEGORIES   = ["Foundation", "Ground Floor", "Second Floor", "Third Floor & Roof", "Custom"]
const SEL_TYPES    = ["Single Choice", "Multi Choice", "Required", "Optional Add-on"]
const BADGE_OPTS   = ["Recommended", "Best Value", "Premium", "Luxury", "Budget", "None"]

function fmtPrice(price: number) {
  return `US$ ${price.toLocaleString("pt-BR")}`
}
function fmtMil(price: number) {
  const k = Math.round(price / 1000)
  return `US$ ${k} mil`
}

// ── Toast System ──────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info"
interface ToastItem { id: string; type: ToastType; message: string }

const ToastCtx = createContext<{ add: (type: ToastType, msg: string) => void } | null>(null)
function useToast() { return useContext(ToastCtx)! }

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ToastItem[]>([])
  const add = useCallback((type: ToastType, message: string) => {
    const id = `t${Date.now()}`
    setList((p) => [...p, { id, type, message }])
    setTimeout(() => setList((p) => p.filter((t) => t.id !== id)), 4000)
  }, [])
  const accent = (t: ToastType) => ({ success: C.green, error: C.red, warning: C.gold, info: C.cyan }[t])
  return (
    <ToastCtx.Provider value={{ add }}>
      {children}
      <div style={{ position: "fixed", top: 80, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {list.map((t) => (
          <div key={t.id} style={{ width: 360, padding: "12px 16px", borderRadius: 12, background: "#101B2C", border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent(t.type)}`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, pointerEvents: "all", animation: "tIn .25s ease-out" }}>
            <span style={{ fontSize: 15 }}>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "⚠" : "ℹ"}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.textSec }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </ToastCtx.Provider>
  )
}

// ── Modal Base ─────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 480 }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: "90vw", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", fontFamily: FONT, overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</div>
        </div>
        {children}
      </div>
    </div>
  )
}

function PublishModal({ open, onClose, onConfirm, phases }: { open: boolean; onClose: () => void; onConfirm: () => void; phases: Phase[] }) {
  const errs: string[] = []
  phases.forEach((p, i) => {
    if (!p.name) errs.push(`Etapa ${i + 1}: nome ausente`)
    if (!p.modelObjectName) errs.push(`${p.name || `Etapa ${i + 1}`}: objeto 3D ausente`)
    if (p.options.length === 0) errs.push(`${p.name}: sem opções`)
  })
  return (
    <Modal open={open} onClose={onClose} title="Publicar Alterações?" width={520}>
      <div style={{ padding: "20px 24px" }}>
        <p style={{ fontSize: 14, color: C.textSec, marginBottom: 16 }}>Isso irá atualizar a apresentação do cliente com os dados atuais.</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[["Etapas", phases.length], ["Opções", phases.reduce((s, p) => s + p.options.length, 0)]].map(([l, v]) => (
            <div key={l as string} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: C.elevated, border: `1px solid ${C.borderSec}` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{v}</div>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
            </div>
          ))}
        </div>
        {errs.length > 0 && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "rgba(255,77,90,0.06)", border: "1px solid rgba(255,77,90,0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 6 }}>{errs.length} AVISO{errs.length > 1 ? "S" : ""}</div>
            {errs.slice(0, 4).map((e, i) => <div key={i} style={{ fontSize: 12, color: C.red, opacity: 0.8 }}>• {e}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
          <Btn onClick={onConfirm} variant="primary">Publicar Agora</Btn>
        </div>
      </div>
    </Modal>
  )
}

function ImportPreviewModal({ open, onClose, onConfirm, data }: { open: boolean; onClose: () => void; onConfirm: () => void; data: { phases: Phase[]; projectSettings?: { title?: string } } | null }) {
  if (!data) return null
  return (
    <Modal open={open} onClose={onClose} title="Importar Configuração?" width={440}>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ padding: "14px 16px", borderRadius: 12, background: C.elevated, border: `1px solid ${C.borderSec}`, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>{data.projectSettings?.title ?? "Sem nome"}</div>
          <div style={{ display: "flex", gap: 20 }}>
            <span><b style={{ color: C.cyan }}>{data.phases.length}</b> <span style={{ fontSize: 12, color: C.textMuted }}>etapas</span></span>
            <span><b style={{ color: C.cyan }}>{data.phases.reduce((s, p) => s + p.options.length, 0)}</b> <span style={{ fontSize: 12, color: C.textMuted }}>opções</span></span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Isso substituirá o draft atual. Use Exportar para backup antes de continuar.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
          <Btn onClick={onConfirm} variant="primary">Importar como Draft</Btn>
        </div>
      </div>
    </Modal>
  )
}

function AddStepModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (p: Phase) => void }) {
  const [f, setF] = useState({ title: "", category: "Foundation", duration: "5 dias", price: "0", modelObjectName: "", selectionType: "Single Choice" })
  const s = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  function create() {
    if (!f.title.trim()) return
    const id = `step_${Date.now()}`
    onConfirm({ id, name: f.title.trim(), category: f.category, price: Number(f.price) || 0, duration: f.duration, description: "", modelObjectName: f.modelObjectName.trim(), color: "#3b82f6", selectionType: f.selectionType, active: true, showInPresentation: true, includeInTotal: true, includeInPDF: true, showInSidebar: true, options: [{ id: `opt_${Date.now()}`, title: "Opção Principal", subtitle: "Nome técnico", description: "", benefits: [], price: Number(f.price) || 0 }] })
    setF({ title: "", category: "Foundation", duration: "5 dias", price: "0", modelObjectName: "", selectionType: "Single Choice" })
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova Etapa de Construção" width={500}>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FInput label="Título da Etapa" value={f.title} onChange={s("title")} placeholder="Piles & Excavation" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FSelect label="Categoria" value={f.category} onChange={s("category")} options={CATEGORIES} />
            <FInput label="Duração" value={f.duration} onChange={s("duration")} placeholder="5 dias" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FInput label="Preço Base (US$)" value={f.price} type="number" onChange={s("price")} placeholder="18500" />
            <FInput label="3D Object Name" value={f.modelObjectName} onChange={s("modelObjectName")} placeholder="01_piles" />
          </div>
          <FSelect label="Tipo de Seleção" value={f.selectionType} onChange={s("selectionType")} options={SEL_TYPES} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
          <Btn onClick={create} variant="primary">Criar Etapa</Btn>
        </div>
      </div>
    </Modal>
  )
}

function DeleteStepModal({ open, onClose, onConfirm, name }: { open: boolean; onClose: () => void; onConfirm: () => void; name: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Excluir Etapa?" width={420}>
      <div style={{ padding: "20px 24px" }}>
        <p style={{ fontSize: 14, color: C.textSec, marginBottom: 8 }}>Tem certeza que deseja excluir <strong style={{ color: C.text }}>"{name}"</strong>?</p>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Esta ação não pode ser desfeita. Use Exportar para fazer backup antes.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
          <Btn onClick={onConfirm} variant="danger">Excluir Etapa</Btn>
        </div>
      </div>
    </Modal>
  )
}

function ResetModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Reiniciar Draft?" width={420}>
      <div style={{ padding: "20px 24px" }}>
        <p style={{ fontSize: 14, color: C.textSec, marginBottom: 20 }}>Todos os dados serão substituídos pelos valores de fábrica. Exporte um backup antes.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} variant="ghost">Cancelar</Btn>
          <Btn onClick={onConfirm} variant="danger">Reiniciar para Padrão</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ── Mount Guard ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ background: C.bg, height: "100vh" }} />
  return <ToastProvider><AdminUI /></ToastProvider>
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function AdminUI() {
  const toast = useToast()
  const { phases, projectSettings, updatePhase, updateOption, updateProjectSettings, addPhase, duplicatePhase, deletePhase, addOption, deleteOption, resetToDefault } = useAdminStore()

  const importRef = useRef<HTMLInputElement>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [tab,        setTab]        = useState<Tab>("passos")
  const [selectedId, setSelectedId] = useState<string>(phases[0]?.id ?? "")
  const [search,     setSearch]     = useState("")
  const [selOptIdx,  setSelOptIdx]  = useState(0)
  const [isDirty,    setIsDirty]    = useState(false)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved")

  const [showPublish,  setShowPublish]  = useState(false)
  const [showAddStep,  setShowAddStep]  = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [showReset,    setShowReset]    = useState(false)
  const [importData,   setImportData]   = useState<{ phases: Phase[]; projectSettings?: { title?: string } } | null>(null)

  const selectedPhase = phases.find((p) => p.id === selectedId) ?? phases[0]

  function markDirty() {
    setIsDirty(true); setSaveStatus("saving")
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => setSaveStatus("saved"), 800)
  }

  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", fn)
    return () => window.removeEventListener("beforeunload", fn)
  }, [isDirty])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (e.key === "Escape") { setShowPublish(false); setShowAddStep(false); setShowDelete(false); setShowReset(false); setImportData(null); return }
      if (isInput) return
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); setSaveStatus("saved"); toast.add("success", "Draft guardado") }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); setShowPublish(true) }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); if (selectedPhase) { duplicatePhase(selectedPhase.id); markDirty(); toast.add("success", `"${selectedPhase.name}" duplicada`) } }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedPhase, duplicatePhase, toast])

  function handleUpdatePhase(patch: Partial<Omit<Phase, "id" | "options">>) { updatePhase(selectedPhase?.id ?? "", patch); markDirty() }
  function handleUpdateOption(optId: string, patch: Partial<PhaseOption>) { updateOption(selectedPhase?.id ?? "", optId, patch); markDirty() }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify({ phases, projectSettings, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `beachlife-admin-config-${date}.json`; a.click(); URL.revokeObjectURL(url)
    toast.add("success", `Exportado: beachlife-admin-config-${date}.json`)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); if (!d.phases || !Array.isArray(d.phases)) { toast.add("error", "Arquivo inválido: 'phases' ausente"); return }; setImportData(d) } catch { toast.add("error", "Erro ao ler o arquivo JSON") } }
    reader.readAsText(file); e.target.value = ""
  }

  function confirmImport() {
    if (!importData) return
    useAdminStore.setState({ phases: importData.phases, projectSettings: (importData as { projectSettings?: typeof projectSettings }).projectSettings ?? projectSettings })
    setSelectedId(importData.phases[0]?.id ?? ""); setImportData(null); markDirty(); toast.add("success", "Configuração importada com sucesso")
  }

  function handlePublish() { setShowPublish(false); setIsDirty(false); toast.add("success", "Apresentação publicada com sucesso"); setTimeout(() => { window.location.href = "/" }, 1200) }

  function handleAddStep(phase: Phase) { addPhase(phase); setSelectedId(phase.id); setSelOptIdx(0); setShowAddStep(false); markDirty(); toast.add("success", `Etapa "${phase.name}" criada`) }

  function handleDeletePhase() {
    if (!selectedPhase) return
    const name = selectedPhase.name
    const remaining = phases.filter((p) => p.id !== selectedPhase.id)
    deletePhase(selectedPhase.id); setSelectedId(remaining[0]?.id ?? ""); setShowDelete(false); markDirty(); toast.add("warning", `Etapa "${name}" excluída`)
  }

  return (
    <div style={{ background: C.bg, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT }}>
      <AppHeader tab={tab} onTabChange={setTab} logoText={projectSettings.logoText} title={projectSettings.title} subtitle={projectSettings.subtitle} saveStatus={saveStatus} isDirty={isDirty} onImport={() => importRef.current?.click()} onExport={handleExport} onReset={() => setShowReset(true)} onPublish={() => setShowPublish(true)} />
      <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportFile} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "passos" && (
          <>
            <StepsView
              phases={phases} selectedId={selectedId} selectedPhase={selectedPhase} search={search} selOptIdx={selOptIdx}
              onSearch={setSearch} onSelect={(id) => { setSelectedId(id); setSelOptIdx(0) }} onSelOptIdx={setSelOptIdx}
              onUpdatePhase={handleUpdatePhase} onUpdateOption={handleUpdateOption}
              onDuplicatePhase={() => { duplicatePhase(selectedPhase?.id ?? ""); markDirty(); toast.add("success", "Etapa duplicada") }}
              onDeletePhase={() => setShowDelete(true)}
              onAddOption={() => { addOption(selectedPhase?.id ?? ""); setSelOptIdx(selectedPhase?.options.length ?? 0); markDirty() }}
              onDeleteOption={(optId) => { if ((selectedPhase?.options.length ?? 0) <= 1) { toast.add("error", "Cada etapa precisa ter ao menos uma opção"); return }; deleteOption(selectedPhase?.id ?? "", optId); setSelOptIdx(0); markDirty() }}
              onAddStep={() => setShowAddStep(true)} isDirty={isDirty}
            />
            <BottomGuideBar />
          </>
        )}
        {tab === "configuracoes" && <SettingsView settings={projectSettings} onUpdate={(p) => { updateProjectSettings(p); markDirty() }} />}
        {tab !== "passos" && tab !== "configuracoes" && <PlaceholderTab label={TABS.find((t) => t.id === tab)?.label ?? tab} />}
      </div>

      <PublishModal   open={showPublish} onClose={() => setShowPublish(false)} onConfirm={handlePublish} phases={phases} />
      <AddStepModal   open={showAddStep} onClose={() => setShowAddStep(false)} onConfirm={handleAddStep} />
      <DeleteStepModal open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDeletePhase} name={selectedPhase?.name ?? ""} />
      <ResetModal     open={showReset}   onClose={() => setShowReset(false)}   onConfirm={() => { resetToDefault(); setIsDirty(false); setSaveStatus("saved"); setShowReset(false); toast.add("info", "Draft reiniciado para os valores padrão") }} />
      <ImportPreviewModal open={importData !== null} onClose={() => setImportData(null)} onConfirm={confirmImport} data={importData} />
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function AppHeader({ tab, onTabChange, logoText, title, subtitle, saveStatus, isDirty, onImport, onExport, onReset, onPublish }: {
  tab: Tab; onTabChange: (t: Tab) => void; logoText: string; title: string; subtitle: string
  saveStatus: "saved" | "saving"; isDirty: boolean
  onImport: () => void; onExport: () => void; onReset: () => void; onPublish: () => void
}) {
  return (
    <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "rgba(5,11,20,0.96)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${C.borderSec}`, zIndex: 50 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2D6BFF,#17D7FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{logoText}</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{title}</span>
        <div style={{ height: 20, padding: "0 8px", borderRadius: 999, background: "rgba(245,185,66,0.12)", border: "1px solid rgba(245,185,66,0.28)", display: "flex", alignItems: "center", fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: "0.08em" }}>ADMINISTRADOR</div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {TABS.map((t) => {
          const active = tab === t.id
          return <button key={t.id} onClick={() => onTabChange(t.id)} style={{ height: 36, padding: "0 16px", borderRadius: 8, cursor: "pointer", background: active ? C.blue : "transparent", border: active ? "none" : `1px solid ${C.borderSec}`, color: active ? "#fff" : C.textMuted, fontSize: 13, fontWeight: 600, fontFamily: FONT, boxShadow: active ? "0 0 0 1px rgba(45,107,255,0.3),0 4px 12px rgba(45,107,255,0.2)" : "none", transition: "all 0.12s" }}>{t.label}</button>
        })}
      </nav>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: saveStatus === "saving" ? C.cyanSoft : isDirty ? C.gold : C.textPh, marginRight: 4 }}>
          {saveStatus === "saving" ? "Salvando…" : isDirty ? "● Não publicado" : "Draft salvo"}
        </span>
        <HdrBtn onClick={onImport} variant="ghost"><IconUpload /> Importar</HdrBtn>
        <HdrBtn onClick={onExport} variant="ghost"><IconDownload /> Exportar</HdrBtn>
        <HdrBtn onClick={onReset} variant="danger">Reiniciar</HdrBtn>
        <button onClick={onPublish} style={{ height: 36, padding: "0 16px", borderRadius: 8, background: C.green, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 0 0 1px rgba(24,209,124,0.3),0 4px 16px rgba(24,209,124,0.2)" }}>
          Publicar <span style={{ fontSize: 10, opacity: 0.8 }}>▼</span>
        </button>
      </div>
    </header>
  )
}

function HdrBtn({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant: "ghost" | "danger" }) {
  const s = { ghost: { bg: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textSec }, danger: { bg: "rgba(255,77,90,0.08)", border: "1px solid rgba(255,77,90,0.18)", color: C.red } }[variant]
  return <button onClick={onClick} style={{ height: 36, padding: "0 12px", borderRadius: 8, cursor: "pointer", background: s.bg, border: s.border, color: s.color, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, fontFamily: FONT }}>{children}</button>
}

// ── 4-Column Grid ─────────────────────────────────────────────────────────────
function StepsView({ phases, selectedId, selectedPhase, search, selOptIdx, onSearch, onSelect, onSelOptIdx, onUpdatePhase, onUpdateOption, onDuplicatePhase, onDeletePhase, onAddOption, onDeleteOption, onAddStep, isDirty }: {
  phases: Phase[]; selectedId: string; selectedPhase: Phase | undefined
  search: string; selOptIdx: number
  onSearch: (v: string) => void; onSelect: (id: string) => void; onSelOptIdx: (i: number) => void
  onUpdatePhase: (p: Partial<Omit<Phase, "id" | "options">>) => void
  onUpdateOption: (optId: string, patch: Partial<PhaseOption>) => void
  onDuplicatePhase: () => void; onDeletePhase: () => void
  onAddOption: () => void; onDeleteOption: (optId: string) => void
  onAddStep: () => void; isDirty: boolean
}) {
  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "270px 1fr 360px 350px", overflow: "hidden" }}>
      <div style={{ background: "#07101C", borderRight: `1px solid ${C.divider}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <StepNavigator phases={phases} selectedId={selectedId} search={search} onSearch={onSearch} onSelect={onSelect} onAddStep={onAddStep} />
      </div>
      <div style={{ background: "#0A1420", borderRight: `1px solid ${C.divider}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {selectedPhase ? <StepEditor phase={selectedPhase} phaseIndex={phases.indexOf(selectedPhase)} onUpdate={onUpdatePhase} onDuplicate={onDuplicatePhase} onDelete={onDeletePhase} /> : <EmptyCol />}
      </div>
      <div style={{ background: "#0B1522", borderRight: `1px solid ${C.divider}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {selectedPhase ? <OptionsManager phase={selectedPhase} selOptIdx={selOptIdx} onSelOptIdx={onSelOptIdx} onUpdateOption={onUpdateOption} onAddOption={onAddOption} onDeleteOption={onDeleteOption} /> : <EmptyCol />}
      </div>
      <div style={{ background: "#09131F", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {selectedPhase ? <LivePreview phase={selectedPhase} selOptIdx={selOptIdx} isDirty={isDirty} /> : <EmptyCol />}
      </div>
    </div>
  )
}

// ── Bottom Guide Bar ──────────────────────────────────────────────────────────
function BottomGuideBar() {
  const items = [
    { num: "1", title: "LISTA DE PASSOS",       desc: "Visualize todas as etapas organizadas por categorias. Arraste para reordenar.", color: C.blue   },
    { num: "2", title: "CONFIGURAÇÃO DA ETAPA", desc: "Edite as informações principais da etapa selecionada.",                         color: C.gold   },
    { num: "3", title: "OPÇÕES (CARDS)",         desc: "Gerencie as opções disponíveis para esta etapa, com preços e benefícios.",     color: C.green  },
    { num: "4", title: "PREVIEW AO VIVO",        desc: "Veja exatamente como o card será exibido para o cliente.",                    color: C.purple },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "270px 1fr 360px 350px", flexShrink: 0, borderTop: `1px solid ${C.divider}` }}>
      {items.map((item, i) => (
        <div key={i} style={{ padding: "14px 20px", borderTop: `3px solid ${item.color}`, borderRight: i < 3 ? `1px solid ${C.divider}` : "none", background: "#060E1A" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: "0.08em", marginBottom: 4 }}>{item.num}. {item.title}</div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  )
}

// ── Col 1: Step Navigator ─────────────────────────────────────────────────────
function StepNavigator({ phases, selectedId, search, onSearch, onSelect, onAddStep }: {
  phases: Phase[]; selectedId: string; search: string; onSearch: (v: string) => void; onSelect: (id: string) => void; onAddStep: () => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const categories = [...new Set(phases.map((p) => p.category))]
  const term = search.trim().toLowerCase()
  const filtered = term ? phases.filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.modelObjectName.toLowerCase().includes(term) || p.options.some((o) => o.title.toLowerCase().includes(term))) : null

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.cyanSoft, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>PASSOS DA CONSTRUÇÃO</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>{phases.length} etapas</div>
        <div style={{ position: "relative", display: "flex", gap: 6 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar etapa..."
              style={{ width: "100%", height: 36, boxSizing: "border-box", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 34px 0 12px", fontSize: 13, color: C.text, outline: "none", fontFamily: FONT }} />
            <IconSearch style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 8, background: C.elevated, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
        {filtered ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map((p) => <StepCard key={p.id} phase={p} index={phases.indexOf(p)} isSelected={selectedId === p.id} onClick={() => onSelect(p.id)} />)}
            {filtered.length === 0 && <div style={{ padding: "32px 0", textAlign: "center" }}><div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Nenhuma etapa encontrada</div><button onClick={() => onSearch("")} style={{ fontSize: 12, color: C.cyan, background: "none", border: "none", cursor: "pointer", fontFamily: FONT }}>Limpar busca</button></div>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categories.map((cat) => {
              const catPhases = phases.filter((p) => p.category === cat)
              const isCol = collapsed.has(cat)
              return (
                <div key={cat}>
                  <button onClick={() => setCollapsed((prev) => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n })}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 6px", borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", marginBottom: isCol ? 0 : 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{CAT_LABELS[cat] ?? cat}</span>
                      <span style={{ fontSize: 9, color: C.textPh, background: C.elevated, padding: "1px 5px", borderRadius: 999 }}>{catPhases.length}</span>
                    </div>
                    <IconChevron style={{ color: C.textPh, transform: isCol ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  {!isCol && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{catPhases.map((p) => <StepCard key={p.id} phase={p} index={phases.indexOf(p)} isSelected={selectedId === p.id} onClick={() => onSelect(p.id)} />)}</div>}
                </div>
              )
            })}
          </div>
        )}
        <button onClick={onAddStep} style={{ width: "100%", height: 52, marginTop: 14, borderRadius: 10, cursor: "pointer", border: `1.5px dashed ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontFamily: FONT }}>
          + Adicionar nova etapa
          <span style={{ fontSize: 10, fontWeight: 400, color: C.textPh }}>Arraste para reordenar</span>
        </button>
      </div>
    </div>
  )
}

function StepCard({ phase, index, isSelected, onClick }: { phase: Phase; index: number; isSelected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: "100%", height: 46, borderRadius: 10, padding: "0 10px", display: "flex", alignItems: "center", gap: 8, background: isSelected ? "rgba(23,59,122,0.5)" : hover ? C.elevated : "transparent", border: isSelected ? `1px solid rgba(45,107,255,0.35)` : "1px solid transparent", borderLeft: isSelected ? `3px solid ${C.blue}` : "3px solid transparent", cursor: "pointer", textAlign: "left", transition: "all 0.1s", fontFamily: FONT }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: phase.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{String(index + 1).padStart(2, "0")}</div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: isSelected ? C.text : C.textSec, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{phase.name}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? C.gold : C.textMuted, flexShrink: 0 }}>{fmtMil(phase.price)}</span>
    </button>
  )
}

// ── Col 2: Step Editor ────────────────────────────────────────────────────────
type EditorTab = "geral" | "detalhes" | "orcamento" | "avancado"

function StepEditor({ phase, phaseIndex, onUpdate, onDuplicate, onDelete }: {
  phase: Phase; phaseIndex: number
  onUpdate: (p: Partial<Omit<Phase, "id" | "options">>) => void
  onDuplicate: () => void; onDelete: () => void
}) {
  const toast = useToast()
  const [edTab, setEdTab] = useState<EditorTab>("geral")
  const [pendingPatch, setPendingPatch] = useState<Partial<Omit<Phase, "id" | "options">>>({})
  const [dirty, setDirty] = useState(false)

  // Reset when phase changes
  useEffect(() => { setPendingPatch({}); setDirty(false) }, [phase.id])

  // Local field value — pending patch takes precedence
  function val<K extends keyof Phase>(k: K): Phase[K] {
    return (k in pendingPatch ? (pendingPatch as Partial<Phase>)[k] : phase[k]) as Phase[K]
  }

  function change(patch: Partial<Omit<Phase, "id" | "options">>) {
    setPendingPatch((p) => ({ ...p, ...patch }))
    setDirty(true)
  }

  function handleSave() { onUpdate(pendingPatch); setPendingPatch({}); setDirty(false); toast.add("success", "Etapa salva") }
  function handleCancel() { setPendingPatch({}); setDirty(false) }

  const EDITOR_TABS: { id: EditorTab; label: string }[] = [
    { id: "geral",     label: "Geral"               },
    { id: "detalhes",  label: "Detalhes"             },
    { id: "orcamento", label: "Regras de orçamento"  },
    { id: "avancado",  label: "Avançado"             },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: "16px 20px 0", borderBottom: `1px solid ${C.divider}`, background: "#0A1420" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.cyan, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Editando etapa {String(phaseIndex + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: "28px" }}>{val("name") as string || "Sem nome"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <SmallBtn onClick={onDuplicate} variant="ghost">Duplicar</SmallBtn>
              <SmallBtn onClick={onDelete} variant="danger">Excluir</SmallBtn>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Ativa</span>
              <Toggle value={val("active") !== false} onChange={(v) => change({ active: v })} />
            </label>
          </div>
        </div>
        {/* Tab row */}
        <div style={{ display: "flex", gap: 0 }}>
          {EDITOR_TABS.map((t) => (
            <button key={t.id} onClick={() => setEdTab(t.id)} style={{ height: 36, padding: "0 16px", background: "transparent", border: "none", borderBottom: edTab === t.id ? `2px solid ${C.blue}` : "2px solid transparent", color: edTab === t.id ? C.text : C.textMuted, fontSize: 13, fontWeight: edTab === t.id ? 600 : 500, cursor: "pointer", fontFamily: FONT, transition: "all 0.12s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {edTab === "geral" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FInput label="Nome" value={val("name") as string} onChange={(v) => change({ name: v })} placeholder="Piles & Excavation" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FInput label="Preço Base (US$)" value={String(val("price") as number)} type="number" onChange={(v) => change({ price: Number(v) || 0 })} placeholder="32000" />
              <FInput label="Duração (dias)" value={val("duration") as string} onChange={(v) => change({ duration: v })} placeholder="5" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Cor da Etapa</FieldLabel>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={val("color") as string} onChange={(e) => change({ color: e.target.value })} style={{ width: 44, height: 44, borderRadius: 8, border: `1px solid ${C.inputBdr}`, background: "transparent", cursor: "pointer", padding: 2 }} />
                  <input type="text" value={val("color") as string} onChange={(e) => change({ color: e.target.value })} style={{ ...inputSt, flex: 1, fontFamily: "monospace", fontSize: 12 }} />
                </div>
              </div>
              <FInput label="Objeto 3D (nome no modelo)" value={val("modelObjectName") as string} onChange={(v) => change({ modelObjectName: v })} placeholder="01_piles" />
            </div>
            <FInput label="Descrição Curta" value={val("description") as string} onChange={(v) => change({ description: v })} placeholder="Descrição resumida da etapa..." />
            <FTextarea label="Descrição Detalhada" value={val("technicalDescription") as string ?? val("description") as string} onChange={(v) => change({ technicalDescription: v })} rows={4} placeholder="Descrição técnica completa..." />
            <FSelect label="Categoria" value={val("category") as string} onChange={(v) => change({ category: v })} options={CATEGORIES} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CheckboxField label="Etapa visível para o cliente"   value={val("showInPresentation") !== false} onChange={(v) => change({ showInPresentation: v })} />
              <CheckboxField label="Incluir no resumo do orçamento" value={val("includeInTotal") !== false}     onChange={(v) => change({ includeInTotal: v })} />
              <CheckboxField label="Etapa opcional (não obrigatória)" value={val("allowSkip") === true}         onChange={(v) => change({ allowSkip: v })} />
              <CheckboxField label="Incluir no PDF da proposta"     value={val("includeInPDF") !== false}       onChange={(v) => change({ includeInPDF: v })} />
            </div>
          </div>
        )}

        {edTab === "detalhes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FInput label="Título para o Cliente" value={val("clientTitle") as string ?? ""} onChange={(v) => change({ clientTitle: v })} placeholder="Foundation System" />
            <FTextarea label="Subtítulo para o Cliente" value={val("clientSubtitle") as string ?? ""} onChange={(v) => change({ clientSubtitle: v })} rows={3} placeholder="Escolha a melhor solução..." />
            <FInput label="Nota de Recomendação" value={val("recommendationNote") as string ?? ""} onChange={(v) => change({ recommendationNote: v })} placeholder="Melhor opção para ambientes litorâneos" />
          </div>
        )}

        {edTab === "orcamento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FSelect label="Tipo de Seleção" value={val("selectionType") as string ?? "Single Choice"} onChange={(v) => change({ selectionType: v })} options={SEL_TYPES} />
            <div>
              <FieldLabel>Opção Padrão</FieldLabel>
              <select value={phase.defaultOptionId ?? phase.options[0]?.id ?? ""} onChange={(e) => change({ defaultOptionId: e.target.value })} style={{ ...inputSt, width: "100%", appearance: "none" }}>
                {phase.options.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CheckboxField label="Incluir no total geral"      value={val("includeInTotal") !== false}  onChange={(v) => change({ includeInTotal: v })} />
              <CheckboxField label="Incluir no PDF da proposta"  value={val("includeInPDF") !== false}    onChange={(v) => change({ includeInPDF: v })} />
              <CheckboxField label="Exibir no resumo lateral"    value={val("showInSidebar") !== false}   onChange={(v) => change({ showInSidebar: v })} />
            </div>
          </div>
        )}

        {edTab === "avancado" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FSelect label="Tipo de Animação"              value={val("animationType") as string ?? "Fade In"}           onChange={(v) => change({ animationType: v })}      options={ANIM_TYPES} />
            <FSelect label="Foco da Câmera"                value={val("cameraFocus") as string ?? "Foundation"}          onChange={(v) => change({ cameraFocus: v })}        options={CAM_TARGETS} />
            <FSelect label="Comportamento de Visibilidade" value={val("visibilityBehavior") as string ?? "Pricing Only"} onChange={(v) => change({ visibilityBehavior: v })} options={VIS_BEHAVIOR} />
            <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.divider}` }}>
              <FieldLabel>Flags de Exibição</FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <CheckboxField label="Badge Recomendado"            value={val("isFeatured") === true}           onChange={(v) => change({ isFeatured: v })} />
                <CheckboxField label="Etapa em Destaque"            value={val("highlightInTimeline") === true}  onChange={(v) => change({ highlightInTimeline: v })} />
                <CheckboxField label="Bloqueado até Etapa Anterior" value={val("lockedUntilPrevious") === true}  onChange={(v) => change({ lockedUntilPrevious: v })} />
              </div>
            </div>
            <div style={{ marginTop: 8, padding: 14, borderRadius: 12, background: "rgba(255,77,90,0.05)", border: "1px solid rgba(255,77,90,0.15)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.red, marginBottom: 10, letterSpacing: "0.06em" }}>ZONA DE PERIGO</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={onDuplicate} variant="ghost">Duplicar Etapa</Btn>
                <Btn onClick={onDelete} variant="danger">Excluir Etapa</Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: `1px solid ${C.divider}`, display: "flex", gap: 10, justifyContent: "flex-end", background: "#0A1420" }}>
        <Btn onClick={handleCancel} variant="ghost" disabled={!dirty}>Cancelar alterações</Btn>
        <Btn onClick={handleSave} variant="primary" disabled={!dirty}>Salvar alterações</Btn>
      </div>
    </div>
  )
}

// ── Col 3: Options Manager ────────────────────────────────────────────────────
type OptTab = "geral" | "beneficios" | "imagem"

function OptionsManager({ phase, selOptIdx, onSelOptIdx, onUpdateOption, onAddOption, onDeleteOption }: {
  phase: Phase; selOptIdx: number; onSelOptIdx: (i: number) => void
  onUpdateOption: (optId: string, patch: Partial<PhaseOption>) => void
  onAddOption: () => void; onDeleteOption: (optId: string) => void
}) {
  const safeIdx = Math.min(selOptIdx, phase.options.length - 1)
  const opt = phase.options[safeIdx]
  const [optTab, setOptTab] = useState<OptTab>("geral")

  useEffect(() => setOptTab("geral"), [opt?.id])

  const badgeColor = (badge?: string) => {
    if (!badge || badge === "None") return null
    const map: Record<string, string> = { "Recommended": C.cyan, "Best Value": C.green, "Premium": C.gold, "Luxury": C.purple, "Budget": C.textMuted }
    return map[badge] ?? C.cyan
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.divider}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Opções desta etapa <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 400 }}>({phase.options.length})</span></div>
          <button onClick={onAddOption} style={{ height: 30, padding: "0 12px", borderRadius: 8, background: "rgba(45,107,255,0.12)", border: "1px solid rgba(45,107,255,0.25)", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>+ Nova opção</button>
        </div>
      </div>

      {/* Option cards list */}
      <div style={{ padding: "8px 10px", flexShrink: 0, borderBottom: `1px solid ${C.divider}` }}>
        {phase.options.map((o, i) => {
          const bColor = badgeColor(o.badge)
          const isSel = safeIdx === i
          return (
            <div key={o.id} onClick={() => onSelOptIdx(i)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, marginBottom: 4, background: isSel ? "rgba(10,36,80,0.7)" : "transparent", border: isSel ? "1px solid rgba(45,107,255,0.25)" : "1px solid transparent", borderLeft: isSel ? `3px solid ${C.blue}` : "3px solid transparent", cursor: "pointer", transition: "all 0.1s" }}>
              {/* Drag handle */}
              <span style={{ fontSize: 14, color: C.textPh, cursor: "grab", flexShrink: 0, letterSpacing: "-1px" }}>⠿</span>
              {/* Thumbnail */}
              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg,${phase.color}20,${phase.color}08)` }}>
                {o.image && <img src={o.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              {/* Info */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {bColor && (
                  <div style={{ display: "inline-flex", alignItems: "center", height: 16, padding: "0 6px", borderRadius: 4, background: `${bColor}18`, border: `1px solid ${bColor}40`, fontSize: 9, fontWeight: 700, color: bColor, letterSpacing: "0.06em", marginBottom: 3 }}>
                    {(o.badge ?? "").toUpperCase()}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? C.text : C.textSec, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{o.title}</div>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{fmtPrice(o.price)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Option editor */}
      {opt ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, padding: "0 16px", borderBottom: `1px solid ${C.divider}`, flexShrink: 0 }}>
            {(["geral", "beneficios", "imagem"] as OptTab[]).map((t) => (
              <button key={t} onClick={() => setOptTab(t)} style={{ height: 36, padding: "0 14px", background: "transparent", border: "none", borderBottom: optTab === t ? `2px solid ${C.blue}` : "2px solid transparent", color: optTab === t ? C.text : C.textMuted, fontSize: 12, fontWeight: optTab === t ? 600 : 500, cursor: "pointer", fontFamily: FONT, textTransform: "capitalize" }}>
                {t === "beneficios" ? "Benefícios" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => onDeleteOption(opt.id)} style={{ height: 26, padding: "0 10px", alignSelf: "center", borderRadius: 6, background: "transparent", border: `1px solid rgba(255,77,90,0.2)`, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Excluir</button>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
            {optTab === "geral" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <FInput label="Título" value={opt.title} onChange={(v) => onUpdateOption(opt.id, { title: v })} placeholder="Premium Coastal Foundation" />
                <FInput label="Legenda / Subtítulo" value={opt.subtitle} onChange={(v) => onUpdateOption(opt.id, { subtitle: v })} placeholder="Fiberglass Piles (GFRP)" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FInput label="Preço (US$)" value={String(opt.price)} type="number" onChange={(v) => onUpdateOption(opt.id, { price: Number(v) || 0 })} />
                  <div>
                    <FieldLabel>Distintivo</FieldLabel>
                    <select value={opt.badge ?? "None"} onChange={(e) => onUpdateOption(opt.id, { badge: e.target.value === "None" ? undefined : e.target.value })} style={{ ...inputSt, width: "100%", appearance: "none" }}>
                      {BADGE_OPTS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <FTextarea label="Descrição" value={opt.description} onChange={(v) => onUpdateOption(opt.id, { description: v })} rows={3} placeholder="Descrição da opção para o cliente..." />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: `1px solid ${C.divider}` }}>
                  <CheckboxField label="Afeta geometria 3D"    value={opt.affectsGeometry !== false}    onChange={(v) => onUpdateOption(opt.id, { affectsGeometry: v })} />
                  <CheckboxField label="Recomendado por padrão" value={opt.recommendedByDefault ?? false} onChange={(v) => onUpdateOption(opt.id, { recommendedByDefault: v })} />
                  <CheckboxField label="Visível para o cliente" value={opt.showInClientSummary !== false} onChange={(v) => onUpdateOption(opt.id, { showInClientSummary: v })} />
                </div>
              </div>
            )}
            {optTab === "beneficios" && (
              <BenefitChipEditor benefits={opt.benefits} onChange={(v) => onUpdateOption(opt.id, { benefits: v })} />
            )}
            {optTab === "imagem" && (
              <ImageUploadZone image={opt.image} onChange={(url) => onUpdateOption(opt.id, { image: url })} />
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: C.textPh }}>Nenhuma opção disponível</span>
        </div>
      )}
    </div>
  )
}

// ── Col 4: Live Preview ───────────────────────────────────────────────────────
function LivePreview({ phase, selOptIdx, isDirty }: { phase: Phase; selOptIdx: number; isDirty: boolean }) {
  const safeIdx = Math.min(selOptIdx, phase.options.length - 1)
  const opt = phase.options[safeIdx]
  const displayBenefits = opt?.benefits.slice(0, 4) ?? []
  const extra = (opt?.benefits.length ?? 0) - 4

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.divider}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>PREVIEW DO CARD (COMO O CLIENTE VERÁ)</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
        {opt ? (
          <>
            {/* Preview card */}
            <div style={{ borderRadius: 20, overflow: "hidden", background: "linear-gradient(180deg,#0F2034,#070F1A)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 20px 48px rgba(0,0,0,0.4)", marginBottom: 14 }}>
              {/* Image */}
              <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
                {opt.image ? (
                  <img src={opt.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg,${phase.color}14,${phase.color}05)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32, opacity: 0.15 }}>🏗</span>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 35%,rgba(7,15,26,0.75))" }} />
                {opt.badge && opt.badge !== "None" && (
                  <div style={{ position: "absolute", top: 12, right: 12, height: 24, padding: "0 10px", borderRadius: 999, background: "rgba(245,185,66,0.2)", border: "1px solid rgba(245,185,66,0.45)", display: "flex", alignItems: "center", fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: "0.08em", backdropFilter: "blur(6px)" }}>
                    {opt.badge.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "16px 18px 20px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 4 }}>{phase.clientTitle || phase.name}</div>
                <div style={{ fontSize: 14, color: C.textSec, marginBottom: 12 }}>{opt.subtitle}</div>
                {/* Price in gold */}
                <div style={{ fontSize: 32, fontWeight: 800, color: C.gold, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 14 }}>
                  {fmtPrice(opt.price)}
                </div>
                {/* Benefits */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {displayBenefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      <span style={{ fontSize: 13, color: C.textSec, fontFamily: FONT }}>{b}</span>
                    </div>
                  ))}
                  {extra > 0 && <div style={{ fontSize: 12, color: C.textMuted, paddingLeft: 22 }}>+{extra} benefício{extra > 1 ? "s" : ""}</div>}
                </div>
              </div>
            </div>

            {/* Technical info panel */}
            <div style={{ borderRadius: 12, background: C.surface, border: `1px solid ${C.borderSec}`, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>INFORMAÇÕES TÉCNICAS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {([
                  ["ID da opção",          opt.id],
                  ["Ordem",                String(selOptIdx + 1)],
                  ["Tipo de seleção",      phase.selectionType ?? "Single Choice"],
                  ["Impacto no orçamento", phase.includeInTotal !== false ? "Somar ao total" : "Não incluso"],
                  ["Visível para cliente", opt.showInClientSummary !== false ? "✓" : "✕"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: value === "✓" ? C.green : value === "✕" ? C.red : C.textSec, fontFamily: "monospace" }}>{value}</span>
                  </div>
                ))}
              </div>
              {isDirty && (
                <div style={{ marginTop: 10, padding: "7px 10px", borderRadius: 8, background: "rgba(245,185,66,0.07)", border: "1px solid rgba(245,185,66,0.2)", fontSize: 11, fontWeight: 600, color: C.gold, display: "flex", alignItems: "center", gap: 6 }}>
                  ⚠ Alterações não publicadas
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 60, fontSize: 12, color: C.textPh }}>Selecione uma opção para visualizar</div>
        )}
      </div>
    </div>
  )
}

// ── Benefits Chip Editor ──────────────────────────────────────────────────────
function BenefitChipEditor({ benefits, onChange }: { benefits: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function add() { if (!input.trim()) return; onChange([...benefits, input.trim()]); setInput("") }

  function drop(to: number) {
    if (dragIdx === null || dragIdx === to) return
    const next = [...benefits]; const [item] = next.splice(dragIdx, 1); next.splice(to, 0, item)
    onChange(next); setDragIdx(null); setOverIdx(null)
  }

  return (
    <div>
      <FieldLabel>Benefícios (até 6)</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 32, marginBottom: 10 }}>
        {benefits.map((b, i) => (
          <div key={i} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => { e.preventDefault(); setOverIdx(i) }} onDrop={() => drop(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px 5px 12px", borderRadius: 999, background: dragIdx === i ? "rgba(23,59,122,0.4)" : "#173B7A", border: `1px solid ${overIdx === i && dragIdx !== i ? C.blue : "rgba(45,107,255,0.25)"}`, cursor: "grab", userSelect: "none" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{b}</span>
            <button onClick={() => onChange(benefits.filter((_, j) => j !== i))} style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: FONT }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="+ Adicionar benefício"
          style={{ ...inputSt, flex: 1 }} />
        <button onClick={add} style={{ width: 40, height: 44, borderRadius: 8, background: C.blue, border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>+</button>
      </div>
    </div>
  )
}

// ── Image Upload Zone ─────────────────────────────────────────────────────────
function ImageUploadZone({ image, onChange }: { image?: string; onChange: (url: string | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(f: File) { const r = new FileReader(); r.onload = (ev) => onChange(ev.target?.result as string); r.readAsDataURL(f) }

  return (
    <div>
      <FieldLabel>Imagem da Opção</FieldLabel>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />
      {image ? (
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 160 }}>
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6 }}>
            <button onClick={() => ref.current?.click()} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 11, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontFamily: FONT }}>Trocar</button>
            <button onClick={() => onChange(undefined)} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,77,90,0.85)", color: "#fff", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: FONT }}>Remover</button>
          </div>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
          style={{ width: "100%", height: 140, borderRadius: 12, border: `1.5px dashed ${dragOver ? C.cyan : C.border}`, background: dragOver ? "rgba(23,215,255,0.04)" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT, transition: "all 0.15s" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.cyan : C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 5 5 3-3 6 6"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
          <div style={{ fontSize: 12, fontWeight: 600, color: dragOver ? C.cyan : C.textSec }}>{dragOver ? "Solte para upload" : "Upload Option Image"}</div>
          <div style={{ fontSize: 11, color: C.textPh }}>PNG · JPG · WEBP · Arraste aqui</div>
        </button>
      )}
    </div>
  )
}

// ── Settings & Placeholder ────────────────────────────────────────────────────
function SettingsView({ settings, onUpdate }: { settings: { title: string; subtitle: string; logoText: string; currency: string }; onUpdate: (p: Partial<typeof settings>) => void }) {
  return (
    <div style={{ padding: 40, height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", marginBottom: 6 }}>Configurações</div>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 36 }}>Dados exibidos no cabeçalho da apresentação.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FInput label="Título"        value={settings.title}    onChange={(v) => onUpdate({ title: v })} />
          <FInput label="Subtítulo"     value={settings.subtitle} onChange={(v) => onUpdate({ subtitle: v })} />
          <FInput label="Letra do Logo" value={settings.logoText} onChange={(v) => onUpdate({ logoText: v })} />
          <FInput label="Moeda"         value={settings.currency} onChange={(v) => onUpdate({ currency: v })} placeholder="USD" />
        </div>
      </div>
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{ fontSize: 40, opacity: 0.08 }}>◻</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{label}</div>
      <div style={{ fontSize: 13, color: C.textMuted }}>Em desenvolvimento</div>
    </div>
  )
}

// ── Shared Primitives ─────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  height: 40, background: C.inputBg, border: `1px solid ${C.inputBdr}`,
  borderRadius: 8, padding: "0 12px",
  fontSize: 13, fontWeight: 500, color: C.text,
  outline: "none", fontFamily: FONT, boxSizing: "border-box",
}

function SectionCard({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.borderSec}`, borderRadius: 14, padding: 16, ...style }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{children}</div>
}

function FInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputSt, width: "100%" }} />
    </div>
  )
}

function FSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSt, width: "100%", paddingRight: 32, appearance: "none", cursor: "pointer" }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <IconChevron style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.textMuted }} />
      </div>
    </div>
  )
}

function FTextarea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.inputBdr}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 500, color: C.text, resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: FONT }} />
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 44, height: 26, borderRadius: 999, background: value ? C.green : "#243448", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 4, left: value ? 22 : 4, transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  )
}

function CheckboxField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: C.blue, cursor: "pointer", flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT }}>{label}</span>
    </label>
  )
}

function Btn({ children, onClick, variant, disabled }: { children: React.ReactNode; onClick: () => void; variant: "primary" | "ghost" | "danger"; disabled?: boolean }) {
  const s = {
    primary: { bg: C.blue,                   border: "none",                              color: "#fff"    },
    ghost:   { bg: "rgba(255,255,255,0.04)",  border: `1px solid ${C.border}`,             color: C.textSec },
    danger:  { bg: "rgba(255,77,90,0.08)",    border: "1px solid rgba(255,77,90,0.2)",     color: C.red     },
  }[variant]
  return <button onClick={onClick} disabled={disabled} style={{ height: 36, padding: "0 14px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", background: s.bg, border: s.border, color: s.color, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, whiteSpace: "nowrap", opacity: disabled ? 0.4 : 1, transition: "opacity 0.12s" }}>{children}</button>
}

function SmallBtn({ children, onClick, variant = "ghost" }: { children: React.ReactNode; onClick: () => void; variant?: "ghost" | "danger" }) {
  const s = { ghost: { bg: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textSec }, danger: { bg: "rgba(255,77,90,0.08)", border: "1px solid rgba(255,77,90,0.2)", color: C.red } }[variant]
  return <button onClick={onClick} style={{ height: 28, padding: "0 10px", borderRadius: 6, cursor: "pointer", background: s.bg, border: s.border, color: s.color, fontSize: 11, fontWeight: 600, fontFamily: FONT }}>{children}</button>
}

function EmptyCol() {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: C.textPh }}>Selecione uma etapa</span></div>
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconSearch({ style }: { style?: React.CSSProperties }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
}
function IconChevron({ style }: { style?: React.CSSProperties }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="m6 9 6 6 6-6"/></svg>
}
function IconUpload() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function IconDownload() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}

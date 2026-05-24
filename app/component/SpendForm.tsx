"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TOOLS, USE_CASES, calcMonthly, type ToolEntry, type FormState } from "@/lib/priceData"

const STORAGE_KEY = "ai_audit_form"

// create a blank row with first tool + first plan
function makeBlankRow(): ToolEntry {
  const firstTool = TOOLS[0]
  const firstPlan = firstTool.plans[0]
  return {
    id: crypto.randomUUID(),
    toolId: firstTool.id,
    planId: firstPlan.id,
    seats: 1,
    monthlySpend: firstPlan.monthlyPrice,
  }
}

export default function SpendForm() {
  const router = useRouter()
  const [rows, setRows]         = useState<ToolEntry[]>([makeBlankRow()])
  const [teamSize, setTeamSize] = useState(5)
  const [useCase, setUseCase]   = useState("mixed")
  const [loading, setLoading]   = useState(false)
  
  // load saved state on page open
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: FormState = JSON.parse(saved)
        setRows(parsed.tools)
        setTeamSize(parsed.teamSize)
        setUseCase(parsed.useCase)
      }
    } catch {}
  }, [])

  // save to localStorage on every change
  useEffect(() => {
    
    const state: FormState = { tools: rows, teamSize, useCase }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [rows, teamSize, useCase])     

  // ── row actions ──────────────────────────────────────────
  function addRow() {
    setRows(prev => [...prev, makeBlankRow()])
  }

  function removeRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id: string, changes: Partial<ToolEntry>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r))
  }

  // when tool changes → reset plan + recalculate spend
  function handleToolChange(id: string, toolId: string) {
    const tool = TOOLS.find(t => t.id === toolId)
    const firstPlan = tool?.plans[0]
    if (!firstPlan) return
    updateRow(id, {
      toolId,
      planId: firstPlan.id,
      seats: 1,
      monthlySpend: firstPlan.monthlyPrice,
    })
  }

  // when plan changes → recalculate spend
  function handlePlanChange(id: string, planId: string) {
    const row = rows.find(r => r.id === id)
    if (!row) return
    const newSpend = calcMonthly(row.toolId, planId, row.seats)
    updateRow(id, { planId, monthlySpend: newSpend })
  }

  // when seats change → recalculate spend
  function handleSeatsChange(id: string, seats: number) {
    const row = rows.find(r => r.id === id)
    if (!row) return
    const newSpend = calcMonthly(row.toolId, row.planId, seats)
    updateRow(id, { seats, monthlySpend: newSpend })
  }

  async function handleSubmit() {
    setLoading(true)
    router.push("/results")
  }

  const totalMonthly = rows.reduce((sum, r) => sum + r.monthlySpend, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Card 1: tool rows ── */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">

        {/* column headers */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="col-span-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Tool</p>
          <p className="col-span-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Plan</p>
          <p className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Seats</p>
          <p className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide">$/mo</p>
          <p className="col-span-1" />
        </div>

        {/* rows */}
        <div className="px-6 divide-y divide-gray-100">
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              No tools yet — click below to add one.
            </p>
          )}

          {rows.map(row => {
            const tool = TOOLS.find(t => t.id === row.toolId)
            const plans = tool?.plans ?? []

            return (
              <div key={row.id} className="grid grid-cols-12 gap-3 items-center py-3">

                {/* Tool select */}
                <div className="col-span-4">
                  <Select
                    value={row.toolId}
                    onValueChange={val => handleToolChange(row.id, val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TOOLS.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plan select — changes based on selected tool */}
                <div className="col-span-3">
                  <Select
                    value={row.planId}
                    onValueChange={val => handlePlanChange(row.id, val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {plans.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seats */}
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={row.seats}
                    onChange={e => handleSeatsChange(row.id, Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Monthly spend — auto-calculated but user can override */}
                <div className="col-span-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      value={row.monthlySpend}
                      onChange={e => updateRow(row.id, { monthlySpend: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>

              </div>
            )
          })}
        </div>

        {/* add tool */}
        <button
          onClick={addRow}
          className="w-full flex items-center gap-2 px-6 py-3 border-t border-gray-100 text-sm font-medium text-indigo-600 hover:bg-gray-50 transition-colors"
        >
          <span>+</span> Add a tool
        </button>

      </div>

      {/* ── Card 2: team info ── */}
      <div className="border border-gray-200 rounded-2xl bg-white p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">About your team</p>

        <div className="grid grid-cols-2 gap-4">

          {/* team size */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Team size
            </label>
            <input
              type="number"
              min={1}
              value={teamSize}
              onChange={e => setTeamSize(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* use case */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Primary use case
            </label>
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {USE_CASES.map(uc => (
                    <SelectItem key={uc.id} value={uc.id}>
                      {uc.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* ── Card 3: total + submit ── */}
      <div className="border border-gray-200 rounded-2xl bg-white p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Current monthly spend
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${Math.round(totalMonthly).toLocaleString()}
            <span className="text-sm font-normal text-gray-400 ml-1">/mo</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ${Math.round(totalMonthly * 12).toLocaleString()} per year
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={rows.length === 0 || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {loading ? "Running…" : "Run my audit →"}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        Your data stays in your browser until you choose to share it.
      </p>

    </div>
  )
}
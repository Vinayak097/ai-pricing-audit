"use client"
// app/results/page.tsx

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { runAudit, type AuditResult } from "@/lib/auditEngine"
import { type FormState } from "@/lib/priceData"
import AuditCard from "@/app/component/AuditCard"
import AISummary from "@/app/component/AISummary"

const STORAGE_KEY = "ai_audit_form"

export default function ResultsPage() {
  const router = useRouter()
  const [audit, setAudit]         = useState<AuditResult | null>(null)
  const [form, setForm]           = useState<FormState | null>(null)
  const [email, setEmail]         = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) { router.push("/audit"); return }
      const parsed: FormState = JSON.parse(raw)
      if (!parsed.tools || parsed.tools.length === 0) { router.push("/audit"); return }
      setForm(parsed)
      setAudit(runAudit(parsed))
    } catch {
      router.push("/audit")
    }
  }, [])

  function handleEmailSubmit() {
    if (!email) return
    // TODO: wire to /api/leads in next step
    setSubmitted(true)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!audit || !form) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Running your audit…</p>
      </main>
    )
  }

  const showCredex = audit.totalSaving > 500

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        <a href="/audit" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Edit audit
        </a>

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Total potential savings
          </p>
          <p className="text-5xl font-bold mt-3" style={{ color: "#1D9E75" }}>
            ${Math.round(audit.totalSaving).toLocaleString()}
            <span className="text-lg font-normal text-gray-400 ml-1">/mo</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            ${Math.round(audit.totalAnnualSaving).toLocaleString()} per year — based on your
            current spend of ${Math.round(audit.totalCurrentSpend).toLocaleString()}/mo
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Current spend
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                ${Math.round(audit.totalCurrentSpend).toLocaleString()}/mo
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Optimised spend
              </p>
              <p className="text-xl font-semibold mt-1" style={{ color: "#1D9E75" }}>
                ${Math.round(audit.totalRecommendedSpend).toLocaleString()}/mo
              </p>
            </div>
          </div>
        </div>

        {/* ── Per-tool breakdown ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-6 py-4 border-b border-gray-100">
            Per-tool breakdown
          </p>
          {audit.tools.map((result, i) => (
            <AuditCard key={i} result={result} />
          ))}
        </div>

        {/* ── AI Summary ── */}
        <AISummary audit={audit} form={form} />

        {/* ── Credex block ── */}
        {showCredex && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="bg-green-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Get an extra 20–40% off with Credex
              </p>
              <p className="text-sm text-green-700 mb-4">
                You're saving ${Math.round(audit.totalSaving).toLocaleString()}/mo from
                optimising plans. Credex can get you discounted credits on top of that.
              </p>
              <button className="w-full bg-green-800 hover:bg-green-900 text-white text-sm font-medium py-3 rounded-xl transition-colors">
                Book a free Credex consultation →
              </button>
            </div>
          </div>
        )}

        {/* ── Already optimal ── */}
        {!showCredex && audit.totalSaving < 100 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm font-medium text-gray-700">You're spending well</p>
            <p className="text-sm text-gray-400 mt-1">
              Your AI stack is already close to optimal. Sign up below to get
              notified when new optimisations apply.
            </p>
          </div>
        )}

        {/* ── Email capture ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {submitted ? (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-gray-900">Report sent!</p>
              <p className="text-sm text-gray-400 mt-1">
                Check your inbox. We'll reach out if we can save you more.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Get this report by email
              </p>
              <p className="text-sm text-gray-400 mb-4">
                We'll send a copy and notify you when new optimisations apply.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={handleEmailSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  Send report
                </button>
              </div>
            </>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleCopyLink}
              className="flex-1 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
            >
              {copied ? "Copied!" : "Copy share link"}
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=I just audited my AI spend and found $${Math.round(audit.totalSaving).toLocaleString()}/mo in savings. Check yours: ${window.location.href}`)}
              className="flex-1 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
            >
              Share on X
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
"use client"
// components/AISummary.tsx
// Fetches and displays the Gemini-generated summary

import { useEffect, useState } from "react"
import type { AuditResult } from "@/lib/auditEngine"
import type { FormState } from "@/lib/priceData"

type Props = {
  audit: AuditResult
  form: FormState
}

export default function AISummary({ audit, form }: Props) {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalCurrentSpend:     audit.totalCurrentSpend,
            totalSaving:           audit.totalSaving,
            totalAnnualSaving:     audit.totalAnnualSaving,
            teamSize:              form.teamSize,
            useCase:               form.useCase,
            tools:                 audit.tools,
          }),
        })

        const data = await res.json()
        setSummary(data.summary)
      } catch {
        // fallback if fetch itself fails
        setSummary(
          `Your team is spending $${Math.round(audit.totalCurrentSpend)}/mo on AI tools. ` +
          `There's an opportunity to save $${Math.round(audit.totalSaving)}/mo by switching to more appropriate plans. ` +
          `Review the recommendations above and start with the highest-saving change first.`
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">

      {/* header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 text-xs">✦</span>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          AI summary
        </p>
      </div>

      {/* content */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
          <div className="h-3 bg-gray-100 rounded w-4/6" />
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">
          {summary}
        </p>
      )}

    </div>
  )
}
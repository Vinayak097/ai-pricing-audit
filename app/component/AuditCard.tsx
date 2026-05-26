// components/AuditCard.tsx
// Shows one tool's audit result — current spend, recommendation, saving, reason
"use client"
import type { ToolAuditResult } from "@/lib/auditEngine"

type Props = {
  result: ToolAuditResult
}

// badge colours per status
const badge = {
  save:     "bg-green-100 text-green-800",
  consider: "bg-amber-100 text-amber-800",
  optimal:  "bg-gray-100 text-gray-500",
}

const badgeLabel = {
  save:     (saving: number) => `Save $${Math.round(saving).toLocaleString()}/mo`,
  consider: (_: number) => "Consider switching",
  optimal:  (_: number) => "Already optimal",
}

export default function AuditCard({ result }: Props) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 last:border-0">

      {/* top row — tool name + badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-900">
          {result.toolLabel}
        </span>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${badge[result.status]}`}>
          {badgeLabel[result.status](result.saving)}
        </span>
      </div>

      {/* middle row — current → recommended */}
      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="text-gray-500">
          {result.currentPlanLabel} — ${Math.round(result.currentSpend).toLocaleString()}/mo
        </span>
        <span className="text-gray-300">→</span>
        <span className={result.status === "optimal" ? "text-gray-500" : "text-green-700 font-medium"}>
          {result.recommendedPlanLabel}
          {result.status !== "optimal" && ` — $${Math.round(result.recommendedSpend).toLocaleString()}/mo`}
        </span>
      </div>

      {/* reason */}
      <p className="text-xs text-gray-400 leading-relaxed">
        {result.reason}
      </p>

    </div>
  )
}
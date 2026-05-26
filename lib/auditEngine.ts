// lib/auditEngine.ts
// All audit rules live here. No AI — just logic + math.

import { TOOLS,  calcMonthly, type ToolEntry, type FormState } from "@/lib/priceData"

// ── Types ────────────────────────────────────────────────────

export type AuditStatus = "save" | "optimal" | "consider"

export type ToolAuditResult = {
  toolId: string
  toolLabel: string
  currentPlanLabel: string
  currentSpend: number          // what they pay now
  recommendedPlanLabel: string  // what we suggest
  recommendedSpend: number      // what they'd pay
  saving: number                // currentSpend - recommendedSpend
  status: AuditStatus           // save | optimal | consider
  reason: string                // one sentence explanation
}

export type AuditResult = {
  tools: ToolAuditResult[]
  totalCurrentSpend: number
  totalRecommendedSpend: number
  totalSaving: number
  totalAnnualSaving: number
}

// ── Main function ─────────────────────────────────────────────

export function runAudit(form: FormState): AuditResult {
  const results: ToolAuditResult[] = form.tools.map(entry =>
    auditTool(entry, form.teamSize, form.useCase)
  )

  const totalCurrentSpend     = results.reduce((s, r) => s + r.currentSpend, 0)
  const totalRecommendedSpend = results.reduce((s, r) => s + r.recommendedSpend, 0)
  const totalSaving           = totalCurrentSpend - totalRecommendedSpend
  const totalAnnualSaving     = totalSaving * 12

  return { tools: results, totalCurrentSpend, totalRecommendedSpend, totalSaving, totalAnnualSaving }
}

// ── Per-tool audit ─────────────────────────────────────────────

function auditTool(entry: ToolEntry, teamSize: number, useCase: string): ToolAuditResult {
  switch (entry.toolId) {
    case "cursor":      return auditCursor(entry, teamSize, useCase)
    case "copilot":     return auditCopilot(entry, teamSize)
    case "claude":      return auditClaude(entry, teamSize, useCase)
    case "chatgpt":     return auditChatGPT(entry, teamSize, useCase)
    case "gemini":      return auditGemini(entry, useCase)
    case "windsurf":    return auditWindsurf(entry, teamSize)
    case "anthropic_api":
    case "openai_api":  return auditAPI(entry)
    default:            return makeOptimal(entry, "No specific recommendations for this tool.")
  }
}

// ── Cursor rules ──────────────────────────────────────────────
// Business adds SSO, admin dashboard, SAML — only worth it for larger teams


function auditCursor(entry: ToolEntry, teamSize: number, useCase: string): ToolAuditResult {
  const tool = TOOLS.find((t:any) => t.id === "cursor")!

  if (entry.planId === "business") {
    if (teamSize < 10) {
      // Small team paying for enterprise features they don't need
      const recSpend = calcMonthly("cursor", "pro", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Pro",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Business adds SSO and admin controls — useful at 10+ people. Your team of ${teamSize} gets identical coding features on Pro at half the cost.`,
      })
    }
    // Large team — Business is justified
    return makeOptimal(entry, "Business plan SSO and admin controls are worth it at your team size.")
  }

  if (entry.planId === "teams") {
    if (teamSize < 10) {
      const recSpend = calcMonthly("cursor", "pro", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Pro",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Teams plan is for larger orgs. For ${teamSize} people, Pro gives the same AI coding experience without the overhead.`,
      })
    }
    return makeOptimal(entry, "Teams plan is appropriate for your team size.")
  }

  if (entry.planId === "hobby") {
    if (useCase === "coding" && teamSize > 1) {
      const recSpend = calcMonthly("cursor", "pro", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Pro",
        recommendedSpend: recSpend,
        status: "consider",
        reason: "Hobby has limited AI requests. For a coding team, Pro's extended limits will noticeably improve productivity.",
      })
    }
  }

  return makeOptimal(entry, "Cursor Pro is the right plan for your team size and use case.")
}

// ── GitHub Copilot rules ──────────────────────────────────────
// Enterprise adds SCIM, audit logs — compliance features most startups don't need

function auditCopilot(entry: ToolEntry, teamSize: number): ToolAuditResult {
  if (entry.planId === "enterprise") {
    if (teamSize < 20) {
      const recSpend = calcMonthly("copilot", "business", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Business",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Enterprise adds SCIM provisioning and audit logs — compliance features for regulated industries. Business covers all coding features for your team of ${teamSize}.`,
      })
    }
    return makeOptimal(entry, "Enterprise compliance features are justified at your team size.")
  }

  if (entry.planId === "pro_plus") {
    if (teamSize > 3) {
      const recSpend = calcMonthly("copilot", "business", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Business",
        recommendedSpend: recSpend,
        status: "save",
        reason: "Pro+ is an individual plan with more requests. Business gives your whole team centralized billing, user management, and the same model access.",
      })
    }
  }

  if (entry.planId === "pro") {
    if (teamSize > 5) {
      const recSpend = calcMonthly("copilot", "business", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Business",
        recommendedSpend: recSpend,
        status: "consider",
        reason: "Business adds IP indemnity, data privacy guarantees, and user management — worth it once your team passes 5 people.",
      })
    }
  }

  return makeOptimal(entry, "Your Copilot plan matches your team size and needs.")
}

// ── Claude rules ──────────────────────────────────────────────

function auditClaude(entry: ToolEntry, teamSize: number, useCase: string): ToolAuditResult {
  if (entry.planId === "max") {
    // Max is for heavy Claude Code / Cowork users
    if (useCase !== "coding" && useCase !== "mixed") {
      return make(entry, {
        recommendedPlanLabel: "Pro",
        recommendedSpend: calcMonthly("claude", "pro", entry.seats),
        status: "save",
        reason: "Max gives 20x more usage — built for heavy Claude Code users. For writing or research, Pro's limits are more than enough.",
      })
    }
    return makeOptimal(entry, "Max is justified for heavy coding and agent usage.")
  }

  if (entry.planId === "team_premium") {
    if (teamSize < 10) {
      const recSpend = calcMonthly("claude", "team_std", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Team Standard",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Team Premium gives 5x more usage than Standard — justified only for power users running long agent tasks. For most teams of ${teamSize}, Standard is sufficient.`,
      })
    }
    return makeOptimal(entry, "Team Premium usage limits are appropriate for your team size.")
  }

  if (entry.planId === "team_std") {
    if (entry.seats < 5) {
      // Team requires min 5 seats — they might be better on individual Pro
      const proSpend = calcMonthly("claude", "pro", entry.seats)
      const teamSpend = calcMonthly("claude", "team_std", 5) // min 5 seats
      if (proSpend < teamSpend) {
        return make(entry, {
          recommendedPlanLabel: "Pro (per person)",
          recommendedSpend: proSpend,
          status: "save",
          reason: `Team Standard requires a minimum of 5 seats. With only ${entry.seats} users, individual Pro subscriptions cost less and give each person full access.`,
        })
      }
    }
    return makeOptimal(entry, "Claude Team Standard is the right plan for your team.")
  }

  if (entry.planId === "enterprise") {
    if (teamSize < 20) {
      const recSpend = calcMonthly("claude", "team_std", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Team Standard",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Enterprise adds 500K context, SCIM, and compliance features. For a team of ${teamSize} without enterprise compliance requirements, Team Standard covers all core needs.`,
      })
    }
    return makeOptimal(entry, "Enterprise features are appropriate for your team size.")
  }

  return makeOptimal(entry, "Your Claude plan matches your team size and use case.")
}

// ── ChatGPT rules ─────────────────────────────────────────────

function auditChatGPT(entry: ToolEntry, teamSize: number, useCase: string): ToolAuditResult {
  if (entry.planId === "pro") {
    // Pro is $100/mo personal — most people don't need it
    if (teamSize > 1) {
      const recSpend = calcMonthly("chatgpt", "team", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Team",
        recommendedSpend: recSpend,
        status: "save",
        reason: "ChatGPT Pro is a single-user plan with maximum limits. Team plan covers the same use cases for multiple people at $20/seat — a fraction of the cost.",
      })
    }
    if (useCase === "coding") {
      return make(entry, {
        recommendedPlanLabel: "Plus",
        recommendedSpend: calcMonthly("chatgpt", "plus", entry.seats),
        status: "consider",
        reason: "For coding, Cursor or GitHub Copilot gives a better IDE-integrated experience than ChatGPT Pro. Consider switching and downgrading to Plus.",
      })
    }
    return makeOptimal(entry, "Pro is justified for heavy single-user usage.")
  }

  if (entry.planId === "plus") {
    if (teamSize > 3) {
      const recSpend = calcMonthly("chatgpt", "team", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Team",
        recommendedSpend: recSpend,
        status: "consider",
        reason: `Team plan adds shared workspace, admin controls, and data privacy. For ${teamSize} people, Team is more appropriate than multiple Plus subscriptions.`,
      })
    }
  }

  return makeOptimal(entry, "Your ChatGPT plan is well-matched to your team.")
}

// ── Gemini rules ──────────────────────────────────────────────

function auditGemini(entry: ToolEntry, useCase: string): ToolAuditResult {
  if (entry.planId === "ultra") {
    if (useCase === "coding") {
      return make(entry, {
        recommendedPlanLabel: "Pro or switch to Cursor",
        recommendedSpend: calcMonthly("gemini", "pro", entry.seats),
        status: "consider",
        reason: "Gemini Ultra is built for heavy multimodal tasks. For coding, Cursor or Copilot gives a purpose-built IDE experience at lower cost.",
      })
    }
    return makeOptimal(entry, "Gemini Ultra is appropriate for heavy research and multimodal work.")
  }

  if (entry.planId === "pro") {
    if (useCase === "coding") {
      return make(entry, {
        recommendedPlanLabel: "Consider Cursor instead",
        recommendedSpend: 20,
        status: "consider",
        reason: "Gemini Pro is great for general AI tasks. For coding specifically, Cursor Pro ($20) gives deeper IDE integration and purpose-built coding agents.",
      })
    }
  }

  return makeOptimal(entry, "Your Gemini plan fits your use case.")
}

// ── Windsurf rules ────────────────────────────────────────────

function auditWindsurf(entry: ToolEntry, teamSize: number): ToolAuditResult {
  if (entry.planId === "max") {
    return make(entry, {
      recommendedPlanLabel: "Pro",
      recommendedSpend: calcMonthly("windsurf", "pro", entry.seats),
      status: "consider",
      reason: "Windsurf Max gives 10x higher quotas — worth it only if you're hitting Pro limits daily. Most developers don't. Try Pro for a month and upgrade if needed.",
    })
  }

  if (entry.planId === "teams") {
    if (teamSize < 5) {
      const recSpend = calcMonthly("windsurf", "pro", entry.seats)
      return make(entry, {
        recommendedPlanLabel: "Pro (per person)",
        recommendedSpend: recSpend,
        status: "save",
        reason: `Teams plan adds admin dashboard and zero data retention. For ${teamSize} people without compliance needs, individual Pro is cheaper and functionally identical.`,
      })
    }
    return makeOptimal(entry, "Windsurf Teams is appropriate for your team size.")
  }

  return makeOptimal(entry, "Your Windsurf plan is well-matched.")
}

// ── API rules ─────────────────────────────────────────────────
// API is pay-as-you-go — we can't suggest a cheaper plan, just flag high spend

function auditAPI(entry: ToolEntry): ToolAuditResult {
  const tool = TOOLS.find(t => t.id === entry.toolId)!

  if (entry.monthlySpend > 500) {
    return make(entry, {
      recommendedPlanLabel: "Review usage",
      recommendedSpend: entry.monthlySpend,
      status: "consider",
      reason: `You're spending $${entry.monthlySpend}/mo on API. At this level, review if all calls are necessary — caching responses and prompt optimisation can cut costs 20–40%.`,
    })
  }

  return makeOptimal(entry, "API spend looks reasonable. Monitor monthly for unexpected spikes.")
}

// ── Helper functions ──────────────────────────────────────────

type PartialResult = {
  recommendedPlanLabel: string
  recommendedSpend: number
  status: AuditStatus
  reason: string
}

function make(entry: ToolEntry, partial: PartialResult): ToolAuditResult {
  const tool = TOOLS.find(t => t.id === entry.toolId)!
  const currentPlan = tool.plans.find(p => p.id === entry.planId)!

  return {
    toolId: entry.toolId,
    toolLabel: tool.label,
    currentPlanLabel: currentPlan?.label ?? entry.planId,
    currentSpend: entry.monthlySpend,
    recommendedPlanLabel: partial.recommendedPlanLabel,
    recommendedSpend: partial.recommendedSpend,
    saving: Math.max(0, entry.monthlySpend - partial.recommendedSpend),
    status: partial.status,
    reason: partial.reason,
  }
}

function makeOptimal(entry: ToolEntry, reason: string): ToolAuditResult {
  const tool = TOOLS.find(t => t.id === entry.toolId)!
  const currentPlan = tool.plans.find(p => p.id === entry.planId)!

  return {
    toolId: entry.toolId,
    toolLabel: tool.label,
    currentPlanLabel: currentPlan?.label ?? entry.planId,
    currentSpend: entry.monthlySpend,
    recommendedPlanLabel: "Keep current plan",
    recommendedSpend: entry.monthlySpend,
    saving: 0,
    status: "optimal",
    reason,
  }
}
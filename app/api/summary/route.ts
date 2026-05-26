// app/api/summary/route.ts
// Calls Gemini API to generate a personalized audit summary

import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { totalCurrentSpend, totalSaving, totalAnnualSaving, teamSize, useCase, tools } = body

    // build a prompt from the audit data
    const toolLines = tools.map((t: any) =>
      `- ${t.toolLabel} (${t.currentPlanLabel}): $${Math.round(t.currentSpend)}/mo → ${t.status === "optimal" ? "keep" : `switch to ${t.recommendedPlanLabel}, save $${Math.round(t.saving)}/mo`}`
    ).join("\n")

    const prompt = `
You are an AI spend analyst writing a short personalized audit summary for a startup.

Here is the audit data:
- Team size: ${teamSize}
- Primary use case: ${useCase}
- Current monthly AI spend: $${Math.round(totalCurrentSpend)}
- Potential monthly savings: $${Math.round(totalSaving)}
- Potential annual savings: $${Math.round(totalAnnualSaving)}

Per-tool breakdown:
${toolLines}

Write a 80-100 word personalized summary paragraph for this team. 
Be specific about their biggest saving opportunity.
Mention their spend per developer if relevant.
Use plain, direct language — no marketing fluff.
Do not use bullet points. Write one flowing paragraph only.
Do not start with "I" or "Here is".
`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ summary: text })

  } catch (error) {
    console.error("Gemini API error:", error)

    // fallback — templated summary if API fails
    const { totalCurrentSpend, totalSaving, teamSize } = await req.json().catch(() => ({}))
    const fallback = `Your team is currently spending $${Math.round(totalCurrentSpend || 0)}/mo on AI tools. Based on your usage patterns and team size of ${teamSize || "unknown"}, there's an opportunity to save $${Math.round(totalSaving || 0)}/mo by switching to more appropriate plans. Review the recommendations below and consider starting with the highest-saving change first.`

    return NextResponse.json({ summary: fallback })
  }
}
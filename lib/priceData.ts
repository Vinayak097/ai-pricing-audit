export type Plan = {
  id: string;
  label: string;
  monthlyPrice: number;
  perSeat: boolean;
};

export type Tool = {
  id: string;
  label: string;
  plans: Plan[];
};

export type ToolEntry = {
  id: string;
  toolId: string;
  planId: string;
  seats: number;
  monthlySpend: number;
};

export type FormState = {
  tools: ToolEntry[];
  teamSize: number;
  useCase: string;
};

export const TOOLS: Tool[] = [
  {
    id: "claude",
    label: "Claude",
    plans: [
      { id: "free", label: "Free", monthlyPrice: 0, perSeat: false },
      { id: "pro", label: "Pro", monthlyPrice: 20, perSeat: false },
      { id: "max", label: "Max", monthlyPrice: 100, perSeat: false },
      { id: "team", label: "Team", monthlyPrice: 25, perSeat: true },
      {
        id: "enterprise",
        label: "Enterprise",
        monthlyPrice: 20,
        perSeat: true,
      },
      { id: "api", label: "API Direct", monthlyPrice: 0, perSeat: false },
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    plans: [
      { id: "plus", label: "Plus", monthlyPrice: 20, perSeat: false },
      { id: "team", label: "Team", monthlyPrice: 20, perSeat: true },
      { id: "enterprise", label: "Enterprise", monthlyPrice: 0, perSeat: true },
      { id: "api", label: "API Direct", monthlyPrice: 0, perSeat: false },
    ],
  },
  {
    id: "cursor",
    label: "Cursor",
    plans: [
      { id: "hobby", label: "Hobby", monthlyPrice: 0, perSeat: false },
      { id: "pro", label: "Pro", monthlyPrice: 20, perSeat: false },
      { id: "business", label: "Business", monthlyPrice: 40, perSeat: true },
      { id: "enterprise", label: "Enterprise", monthlyPrice: 0, perSeat: true },
    ],
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    plans: [
      {
        id: "individual",
        label: "Individual",
        monthlyPrice: 10,
        perSeat: true,
      },
      { id: "business", label: "Business", monthlyPrice: 19, perSeat: true },
      {
        id: "enterprise",
        label: "Enterprise",
        monthlyPrice: 39,
        perSeat: true,
      },
    ],
  },
  {
    id: "gemini",
    label: "Gemini",
    plans: [
      { id: "pro", label: "Pro", monthlyPrice: 19.99, perSeat: false },
      { id: "ultra", label: "Ultra", monthlyPrice: 249.99, perSeat: false },
      { id: "api", label: "API Direct", monthlyPrice: 0, perSeat: false },
    ],
  },
  {
    id: "windsurf",
    label: "Windsurf",
    plans: [
      { id: "free", label: "Free", monthlyPrice: 0, perSeat: false },
      { id: "pro", label: "Pro", monthlyPrice: 20, perSeat: false },
      { id: "max", label: "Max", monthlyPrice: 200, perSeat: false },
      { id: "teams", label: "Teams", monthlyPrice: 40, perSeat: true },
      { id: "enterprise", label: "Enterprise", monthlyPrice: 0, perSeat: true },
    ],
  },
  {
    id: "anthropic_api",
    label: "Anthropic API",
    plans: [
      { id: "api", label: "Pay as you go", monthlyPrice: 0, perSeat: false },
    ],
  },
  {
    id: "openai_api",
    label: "OpenAI API",
    plans: [
      { id: "api", label: "Pay as you go", monthlyPrice: 0, perSeat: false },
    ],
  },
];

export const USE_CASES = [
  { id: "coding", label: "Coding / engineering" },
  { id: "writing", label: "Writing / content" },
  { id: "data", label: "Data / analysis" },
  { id: "research", label: "Research" },
  { id: "mixed", label: "Mixed / general" },
];

// helper — calculate monthly cost from plan + seats
export function calcMonthly(
  toolId: string,
  planId: string,
  seats: number,
): number {
  const tool = TOOLS.find((t) => t.id === toolId);
  const plan = tool?.plans.find((p) => p.id === planId);
  if (!plan) return 0;
  return plan.perSeat ? plan.monthlyPrice * seats : plan.monthlyPrice;
}

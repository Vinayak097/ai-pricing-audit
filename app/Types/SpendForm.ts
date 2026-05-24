export enum Usecase {
  coding = "coding",
  writing = "writing",
  data = "data",
  research = "research",
  mixed = "mixed",
}

export type ToolEntry = {
  id: string;
  planId: string;
  seats: number;
  toolId: string;
  monthly_spend: string;
};

export type FormState = {
  id: string;
  use_case: string;
  team_size: number;
};

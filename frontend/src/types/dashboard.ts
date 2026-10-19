export type ReviewItem = {
  id: string;
  time: string;
  procedure: string;
  context: string;
  question: string;
  reason: string;
};

export type AuditRecord = {
  id: string;
  time: string;
  question: string;
  response: string;
  source: string;
  reference: string;
  critical: boolean;
  validation: string;
};

export type DashboardSection =
  | "overview"
  | "unanswered"
  | "logs"
  | "documents"
  | "safety"
  | "registration";

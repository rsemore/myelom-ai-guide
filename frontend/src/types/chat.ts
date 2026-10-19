export type RiskLevel = "low" | "medium" | "high";
export type ReadingLevel = "simple" | "detailed";

export type Citation = {
  documentId: string;
  title: string;
  page?: number;
  version: string;
  quote: string;
};

type Base = { id: string; createdAt: string };

export type UserMessage = Base & { sender: "user"; text: string };

export type AnswerMessage = Base & {
  sender: "assistant";
  kind: "answer";
  text: string;
  citations: Citation[];
  risk?: RiskLevel;
};

export type NoAnswerMessage = Base & {
  sender: "assistant";
  kind: "no_answer";
  contactId: string;
};

export type EscalationMessage = Base & {
  sender: "assistant";
  kind: "escalation";
  instruction: string;
  contactId: string;
  call155: boolean;
};

export type AssistantMessage =
  AnswerMessage | NoAnswerMessage | EscalationMessage;
export type ChatMessage = UserMessage | AssistantMessage;

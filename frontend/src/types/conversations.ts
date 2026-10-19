import type { ChatMessage } from "./chat";

export type ChatConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  draft: string;
};

export type ChatConversationSummary = Pick<
  ChatConversation,
  "id" | "title" | "updatedAt"
> & {
  messageCount?: number;
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { ApiMessage, ChatSession } from "./chat";

import { chatApi, toChatMessages } from "./chat";

const messageKey = (sessionId: string | null) => ["chat", sessionId] as const;

export function useChat(email: string) {
  const queryClient = useQueryClient();
  const sessionsKey = ["chat-sessions", email] as const;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const sessions = useQuery({
    queryKey: sessionsKey,
    queryFn: ({ signal }) => chatApi.getSessions(signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const messages = useQuery({
    queryKey: messageKey(activeConversationId),
    queryFn: ({ signal }) => {
      if (!activeConversationId) throw new Error("Chat session is required");
      return chatApi.getMessages(activeConversationId, signal);
    },
    enabled: activeConversationId !== null,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const create = useMutation({
    mutationFn: () => chatApi.createSession(email),
    retry: false,
    onSuccess: async (session) => {
      await queryClient.cancelQueries({ queryKey: sessionsKey });
      queryClient.setQueryData<ChatSession[]>(sessionsKey, (current = []) => [
        session,
        ...current.filter(({ id }) => id !== session.id),
      ]);
      setActiveConversationId(session.id);
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });

  const send = useMutation({
    mutationFn: async ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => {
      await chatApi.sendMessage(sessionId, content);
      // POST returns only new messages; GET is the authoritative full history.
      return chatApi.getMessages(sessionId);
    },
    retry: false,
    onMutate: async ({ sessionId, content }) => {
      const queryKey = messageKey(sessionId);
      await queryClient.cancelQueries({ queryKey });
      const previousMessages =
        queryClient.getQueryData<ApiMessage[]>(queryKey) ?? [];
      const question: ApiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        order:
          Math.max(0, ...previousMessages.map((message) => message.order)) + 1,
        createdAt: new Date().toISOString(),
        toolCallId: null,
      };
      queryClient.setQueryData(queryKey, [...previousMessages, question]);
      return { previousMessages };
    },
    onSuccess: (data, { sessionId }) => {
      queryClient.setQueryData(messageKey(sessionId), data);
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
    onError: (_error, { sessionId, content }, context) => {
      if (context) {
        queryClient.setQueryData(
          messageKey(sessionId),
          context.previousMessages,
        );
      }
      setDrafts((current) => ({ ...current, [sessionId]: content }));
      // The server may have saved the question before failing. Never retry POST automatically.
      void queryClient.invalidateQueries({ queryKey: messageKey(sessionId) });
      void queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });

  const conversations = (sessions.data ?? []).map((session) => {
    const data =
      session.id === activeConversationId
        ? messages.data
        : queryClient.getQueryData<ApiMessage[]>(messageKey(session.id));
    const visibleMessages = data ? toChatMessages(data) : [];
    return {
      id: session.id,
      title: session.title === "New Chat" ? "Nová konverzace" : session.title,
      updatedAt: session.updatedAt,
      messages: visibleMessages,
      messageCount: data ? visibleMessages.length : undefined,
      draft: drafts[session.id] ?? "",
    };
  });

  return {
    conversations,
    activeConversationId,
    activeConversation: conversations.find(
      ({ id }) => id === activeConversationId,
    ),
    pending: create.isPending || send.isPending || messages.isFetching,
    error: create.error ?? send.error ?? messages.error,
    historyPending: sessions.isFetching,
    historyError: sessions.error,
    reloadHistory: () => sessions.refetch(),
    newChat: () => {
      send.reset();
      create.mutate();
    },
    selectConversation: (id: string) => {
      create.reset();
      send.reset();
      setActiveConversationId(id);
    },
    setDraft: (draft: string) => {
      if (!activeConversationId) throw new Error("Chat session is required");
      setDrafts((current) => ({ ...current, [activeConversationId]: draft }));
    },
    send: (content: string) => {
      if (!activeConversationId) throw new Error("Chat session is required");
      send.mutate({ sessionId: activeConversationId, content });
    },
    reload: () => {
      create.reset();
      send.reset();
      return messages.refetch();
    },
  };
}

import type { ChatMessage } from "../types/chat";

export type AuthUser = {
  id: string;
  email: string;
};

export type RegisteredUser = AuthUser & { key: string };

export type ChatSession = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiMessage = {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  order: number;
  createdAt: string;
  toolCallId: string | null;
};

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);

class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`Požadavek se nezdařil (HTTP ${status}).`);
  }
}

async function requestResponse(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return response;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await requestResponse(path, init)).json();
}

function post<T>(path: string, body: object): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const chatApi = {
  registerUser: (email: string) => post<RegisteredUser>("/user", { email }),
  logout: async (): Promise<void> => {
    await requestResponse("/auth/logout", { method: "POST" });
  },
  getCurrentUser: async (signal?: AbortSignal): Promise<AuthUser | null> => {
    try {
      return await request<AuthUser>("/auth/me", { signal, cache: "no-store" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  authenticate: async (email: string, key: string): Promise<void> => {
    const query = new URLSearchParams({ email, key });
    await requestResponse(`/auth?${query}`);
  },
  getSessions: (signal?: AbortSignal) =>
    request<ChatSession[]>("/chat", { signal }),
  createSession: (email: string) => post<ChatSession>("/chat/new", { email }),
  getMessages: (sessionId: string, signal?: AbortSignal) =>
    request<ApiMessage[]>(`/chat/${encodeURIComponent(sessionId)}`, { signal }),
  sendMessage: (sessionId: string, content: string) =>
    post<ApiMessage[]>(`/chat/${encodeURIComponent(sessionId)}`, { content }),
};

export async function authenticateUser(email: string, key: string) {
  await chatApi.authenticate(email, key);
  const user = await chatApi.getCurrentUser();
  if (!user)
    throw new Error(
      "Přihlášení se nepodařilo ověřit. Zkontrolujte nastavení cookies.",
    );
  return user;
}

export function toChatMessages(messages: readonly ApiMessage[]): ChatMessage[] {
  return [...messages]
    .sort((a, b) => a.order - b.order)
    .flatMap((message): ChatMessage[] => {
      const base = { id: message.id, createdAt: message.createdAt };
      if (message.role === "user") {
        return [{ ...base, sender: "user", text: message.content }];
      }
      if (message.role === "assistant" && message.content.trim()) {
        return [
          {
            ...base,
            sender: "assistant",
            kind: "answer",
            text: message.content,
            citations: [],
          },
        ];
      }
      return [];
    });
}

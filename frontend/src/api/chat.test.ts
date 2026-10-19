import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiMessage } from "./chat";

import { chatApi, toChatMessages } from "./chat";

afterEach(() => vi.unstubAllGlobals());

describe("chat API", () => {
  it("logs out using a credentialed POST and accepts an empty response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(chatApi.logout()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("loads the authenticated user's sessions and forwards cancellation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await chatApi.getSessions(controller.signal);
    expect(fetchMock).toHaveBeenCalledWith("/api/chat", {
      signal: controller.signal,
      credentials: "include",
    });
  });
  it("filters internal messages, orders by sequence and does not invent clinical metadata", () => {
    const base = { createdAt: "2026-10-16T10:00:00.000Z", toolCallId: null };
    const messages: ApiMessage[] = [
      { ...base, id: "answer", role: "assistant", order: 4, content: "Answer" },
      {
        ...base,
        id: "system",
        role: "system",
        order: 0,
        content: "Secret prompt",
      },
      { ...base, id: "question", role: "user", order: 1, content: "Question" },
      {
        ...base,
        id: "tool",
        role: "tool",
        order: 3,
        content: "Internal document",
      },
      { ...base, id: "empty", role: "assistant", order: 2, content: " " },
    ];
    expect(toChatMessages(messages)).toEqual([
      {
        id: "question",
        createdAt: base.createdAt,
        sender: "user",
        text: "Question",
      },
      {
        id: "answer",
        createdAt: base.createdAt,
        sender: "assistant",
        kind: "answer",
        text: "Answer",
        citations: [],
      },
    ]);
    expect(messages[0].id).toBe("answer");
  });

  it("surfaces HTTP errors even when the response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unavailable", { status: 502 })),
    );
    await expect(chatApi.getMessages("session")).rejects.toThrow("HTTP 502");
  });

  it("forwards cancellation and encodes session IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await chatApi.getMessages("session/id", controller.signal);
    expect(fetchMock).toHaveBeenCalledWith("/api/chat/session%2Fid", {
      signal: controller.signal,
      credentials: "include",
    });
  });

  it("authenticates with encoded credentials and accepts an empty 204 response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      chatApi.authenticate("patient+test@example.com", "key&secret"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth?email=patient%2Btest%40example.com&key=key%26secret",
      { credentials: "include" },
    );
  });

  it("rejects invalid login credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(
      chatApi.authenticate("patient@example.com", "wrong-key"),
    ).rejects.toThrow("HTTP 401");
  });

  it("restores the verified user using the existing cookie", async () => {
    const user = { id: "user-id", email: "patient@example.com" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await expect(chatApi.getCurrentUser(controller.signal)).resolves.toEqual(
      user,
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      signal: controller.signal,
      cache: "no-store",
      credentials: "include",
    });
  });

  it("treats missing or expired cookies as logged out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(chatApi.getCurrentUser()).resolves.toBeNull();
  });

  it("does not hide session-check server or network errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockRejectedValueOnce(new TypeError("Network failure"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(chatApi.getCurrentUser()).rejects.toThrow("HTTP 500");
    await expect(chatApi.getCurrentUser()).rejects.toThrow("Network failure");
  });
});

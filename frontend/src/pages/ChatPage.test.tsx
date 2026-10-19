import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiMessage, ChatSession } from "../api/chat";

import { AppHeader } from "../components/AppHeader";
import { ChatPage } from "./ChatPage";

const fetchMock = vi.fn<typeof fetch>();
const sessions = new Map<string, ApiMessage[]>();
const sessionOwners = new Map<string, string>();
const savedSessions = new Map<string, ChatSession>();
let authenticatedEmail = "patient@example.com";
let hasSession = false;
const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");

function message(
  role: ApiMessage["role"],
  content: string,
  order: number,
): ApiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    order,
    createdAt: "2026-10-16T10:00:00.000Z",
    toolCallId: null,
  };
}

beforeEach(() => {
  sessions.clear();
  sessionOwners.clear();
  savedSessions.clear();
  authenticatedEmail = "patient@example.com";
  hasSession = false;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  fetchMock.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path === "/api/auth/logout" && init?.method === "POST") {
      hasSession = false;
      return new Response(null, { status: 204 });
    }
    if (path === "/api/auth/me") {
      return hasSession
        ? Response.json({ id: "user-id", email: authenticatedEmail })
        : new Response(null, { status: 401 });
    }
    if (path.startsWith("/api/auth?")) {
      const query = new URL(path, "http://localhost").searchParams;
      if (query.get("key") !== "test-key")
        return new Response(null, { status: 401 });
      authenticatedEmail = query.get("email")!;
      hasSession = true;
      return new Response(null, { status: 204 });
    }
    if (path === "/api/chat") {
      return Response.json(
        [...savedSessions.values()].filter(
          ({ id }) => sessionOwners.get(id) === authenticatedEmail,
        ),
      );
    }
    if (path === "/api/chat/new") {
      const id = crypto.randomUUID();
      const { email } = JSON.parse(String(init?.body)) as { email: string };
      sessions.set(id, [message("system", "Internal prompt", 0)]);
      sessionOwners.set(id, email);
      const session: ChatSession = {
        id,
        userId: crypto.randomUUID(),
        title: "New Chat",
        createdAt: "2026-10-16T10:00:00.000Z",
        updatedAt: "2026-10-16T10:00:00.000Z",
      };
      savedSessions.set(id, session);
      return Response.json(session);
    }
    const id = path.split("/").at(-1)!;
    const history = sessions.get(id);
    if (!history) return new Response(null, { status: 404 });
    if (init?.method === "POST") {
      const { content } = JSON.parse(String(init.body)) as { content: string };
      const question = message("user", content, history.length);
      const answer = message(
        "assistant",
        `Odpověď: ${content}`,
        history.length + 1,
      );
      history.push(question, answer);
      const session = savedSessions.get(id)!;
      if (session.title === "New Chat") session.title = content;
      session.updatedAt = answer.createdAt;
      // The real POST endpoint returns only newly generated messages.
      return Response.json([answer]);
    }
    return Response.json(history);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScrollY)
    Object.defineProperty(window, "scrollY", originalScrollY);
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <AppHeader />
        <ChatPage />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

async function startChat() {
  const user = userEvent.setup();
  renderPage();
  await user.type(
    await screen.findByRole("textbox", { name: "E-mail" }),
    "patient@example.com",
  );
  await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
  await user.click(screen.getByRole("button", { name: "Pokračovat do chatu" }));
  await screen.findByText("Zatím nemáte žádné konverzace.");
  await user.click(screen.getByRole("button", { name: "Nový chat" }));
  await screen.findByRole("textbox");
  await waitFor(() =>
    expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(false),
  );
  return user;
}

describe("connected patient chat", () => {
  it("logs out and keeps the previous user's cached chats out of the next login", async () => {
    const user = await startChat();
    await user.type(screen.getByRole("textbox"), "Soukromý dotaz");
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    await screen.findByText("Odpověď: Soukromý dotaz");
    await user.click(screen.getByRole("button", { name: "Účet pacienta" }));
    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "Odhlásit se" }).hasAttribute("data-disabled"),
      ).toBe(false),
    );
    await user.click(screen.getByRole("menuitem", { name: "Odhlásit se" }));
    const emailInput = await screen.findByRole("textbox", { name: "E-mail" });
    expect((emailInput as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("Odpověď: Soukromý dotaz")).toBeNull();
    expect(hasSession).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    await user.type(emailInput, "other@example.com");
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(screen.getByRole("button", { name: "Pokračovat do chatu" }));
    await screen.findByText("Zatím nemáte žádné konverzace.");
    expect(screen.queryByText("Soukromý dotaz")).toBeNull();
  });

  it("shows logout failures without pretending the session was cleared", async () => {
    const user = await startChat();
    await user.click(screen.getByRole("button", { name: "Účet pacienta" }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await user.click(screen.getByRole("menuitem", { name: "Odhlásit se" }));
    await screen.findByRole("alert");
    expect(hasSession).toBe(true);
    expect(screen.queryByRole("textbox", { name: "E-mail" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Odhlásit se" }));
    await screen.findByRole("textbox", { name: "E-mail" });
  });

  it("restores saved sessions from the login cookie after remounting, without logging in again", async () => {
    authenticatedEmail = "patient+history@example.com";
    const id = crypto.randomUUID();
    sessions.set(id, [
      message("user", "Uložený dotaz", 1),
      message("assistant", "Uložená odpověď", 2),
    ]);
    sessionOwners.set(id, "patient+history@example.com");
    savedSessions.set(id, {
      id,
      userId: crypto.randomUUID(),
      title: "Uložená konverzace",
      createdAt: "2026-10-15T10:00:00.000Z",
      updatedAt: "2026-10-16T10:00:00.000Z",
    });
    const user = userEvent.setup();
    const firstMount = renderPage();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient+history@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Uložená konverzace" }),
    );
    await screen.findByText("Uložená odpověď");
    await user.type(screen.getByRole("textbox"), "Neuložený koncept");
    firstMount.unmount();

    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Uložená konverzace" }),
    );
    await screen.findByText("Uložená odpověď");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
    expect(
      fetchMock.mock.calls.some(([input]) => input === "/api/chat"),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).startsWith("/api/auth?"),
      ),
    ).toHaveLength(1);
  });

  it("does not show another email's sessions", async () => {
    const id = crypto.randomUUID();
    savedSessions.set(id, {
      id,
      userId: crypto.randomUUID(),
      title: "Other patient's chat",
      createdAt: "2026-10-16T10:00:00.000Z",
      updatedAt: "2026-10-16T10:00:00.000Z",
    });
    sessionOwners.set(id, "other@example.com");
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await screen.findByText("Zatím nemáte žádné konverzace.");
    expect(screen.queryByText("Other patient's chat")).toBeNull();
  });

  it("reports history errors and allows retry without creating a session", async () => {
    const user = userEvent.setup();
    renderPage();
    const defaultFetch = fetchMock.getMockImplementation()!;
    let failNextHistory = true;
    fetchMock.mockImplementation((input, init) => {
      if (input === "/api/chat" && failNextHistory) {
        failNextHistory = false;
        return Promise.resolve(new Response(null, { status: 500 }));
      }
      return defaultFetch(input, init);
    });
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await screen.findByText("Historii se nepodařilo načíst");
    expect(screen.queryByText("Zatím nemáte žádné konverzace.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Obnovit historii" }));
    await screen.findByText("Zatím nemáte žádné konverzace.");
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });

  it("shows the question and a loading indicator before the server responds, without duplicating the saved question", async () => {
    const user = await startChat();
    const defaultFetch = fetchMock.getMockImplementation()!;
    let resolveResponse!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    fetchMock.mockImplementationOnce(() => response);

    await user.type(screen.getByRole("textbox"), "Dotaz bez čekání");
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));

    const log = within(screen.getByRole("log"));
    const question = await log.findByText("Dotaz bez čekání");
    const status = log.getByRole("status");
    expect(status.textContent).toContain("Hledám");
    expect(
      question.compareDocumentPosition(status) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Časté otázky pacientů:")).toBeNull();

    const [input, init] = fetchMock.mock.calls.at(-1)!;
    resolveResponse(await defaultFetch(input, init));

    await log.findByText("Odpověď: Dotaz bez čekání");
    expect(log.getAllByText("Dotaz bez čekání")).toHaveLength(1);
    expect(log.queryByRole("status")).toBeNull();
    expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(false);
  });

  it("checks the existing session before asking for credentials, without loading chat history", async () => {
    renderPage();
    expect(
      await screen.findByRole("textbox", { name: "E-mail" }),
    ).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("reports session-check failures and restores the session on retry", async () => {
    hasSession = true;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    renderPage();
    await screen.findByText("Přihlášení se nepodařilo ověřit");
    expect(screen.queryByText("Zatím nemáte žádné konverzace.")).toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }));
    await screen.findByText("Zatím nemáte žádné konverzace.");
    expect(screen.queryByRole("textbox", { name: "E-mail" })).toBeNull();
  });

  it("keeps the login form on invalid credentials and allows retry", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "wrong-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await screen.findByText("Přihlášení se nezdařilo");
    expect(screen.getByText(/HTTP 401/)).toBeDefined();
    expect(
      fetchMock.mock.calls.some(([input]) => input === "/api/chat"),
    ).toBe(false);
    await user.clear(screen.getByLabelText("Přístupový klíč"));
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await screen.findByText("Zatím nemáte žádné konverzace.");
  });

  it("creates a backend session, sends a question and renders authoritative history", async () => {
    const user = await startChat();
    expect(
      fetchMock.mock.calls.find(([input]) => input === "/api/chat/new"),
    ).toEqual([
      "/api/chat/new",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "patient@example.com" }),
      }),
    ]);
    await user.type(screen.getByRole("textbox"), "Můj nový dotaz");
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    await screen.findByText("Odpověď: Můj nový dotaz");
    expect(
      within(screen.getByRole("log")).getAllByText("Můj nový dotaz"),
    ).toHaveLength(1);
    expect(screen.queryByText("Internal prompt")).toBeNull();
    expect(screen.queryByText("Nízké riziko")).toBeNull();
    expect(screen.getByText("Zdroj není přiložen")).toBeDefined();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("");
  });

  it("preserves drafts and keeps messages isolated between server sessions", async () => {
    const user = await startChat();
    await user.type(screen.getByRole("textbox"), "První dotaz");
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    await screen.findByText("Odpověď: První dotaz");
    await user.type(screen.getByRole("textbox"), "Koncept prvního chatu");
    await user.click(screen.getByRole("button", { name: "Nový chat" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(false),
    );
    expect(screen.queryByText("Odpověď: První dotaz")).toBeNull();
    await user.type(screen.getByRole("textbox"), "Koncept druhého chatu");
    await user.click(screen.getByRole("button", { name: "Historie" }));
    await user.click(screen.getByRole("button", { name: "První dotaz" }));
    await screen.findByText("Odpověď: První dotaz");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "Koncept prvního chatu",
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Historie" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    await user.click(screen.getByRole("button", { name: "Historie" }));
    await user.click(screen.getByRole("button", { name: "Nová konverzace" }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "Koncept druhého chatu",
    );
  });

  it("reports session creation failures and allows explicit retry", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await screen.findByText("Zatím nemáte žádné konverzace.");
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await user.click(screen.getByRole("button", { name: "Nový chat" }));
    await screen.findByText("Chat se nepodařilo vytvořit");
    expect(
      fetchMock.mock.calls.filter(([input]) => input === "/api/chat/new"),
    ).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Nový chat" }));
    await screen.findByRole("textbox");
  });

  it("restores a failed draft, reports the error and reloads without resending POST", async () => {
    const user = await startChat();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await user.type(screen.getByRole("textbox"), "Neztratit dotaz");
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    await screen.findByText("Spojení s chatem se nezdařilo");
    await waitFor(() =>
      expect(
        within(screen.getByRole("log")).queryByText("Neztratit dotaz"),
      ).toBeNull(),
    );
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "Neztratit dotaz",
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Načíst zprávy" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    await user.click(screen.getByRole("button", { name: "Načíst zprávy" }));
    await waitFor(() =>
      expect(screen.queryByText("Spojení s chatem se nezdařilo")).toBeNull(),
    );
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "POST"),
    ).toHaveLength(2);
    expect(screen.queryByText("Vyžaduje lékaře")).toBeNull();
  });

  it("reports message-loading errors and reloads the same session", async () => {
    const defaultFetch = fetchMock.getMockImplementation()!;
    let failNextRead = true;
    fetchMock.mockImplementation((input, init) => {
      if (
        String(input).startsWith("/api/chat/") &&
        init?.method !== "POST" &&
        failNextRead
      ) {
        failNextRead = false;
        return Promise.resolve(new Response(null, { status: 503 }));
      }
      return defaultFetch(input, init);
    });
    const user = await startChat();
    await screen.findByText("Spojení s chatem se nezdařilo");
    await user.click(screen.getByRole("button", { name: "Načíst zprávy" }));
    await waitFor(() =>
      expect(screen.queryByText("Spojení s chatem se nezdařilo")).toBeNull(),
    );
  });

  it("scrolls to the bottom after a saved chat finishes loading", async () => {
    hasSession = true;
    const id = "saved-session";
    savedSessions.set(id, {
      id,
      userId: "user-id",
      title: "Saved conversation",
      createdAt: "2026-10-16T10:00:00.000Z",
      updatedAt: "2026-10-16T10:00:00.000Z",
    });
    sessionOwners.set(id, authenticatedEmail);
    const defaultFetch = fetchMock.getMockImplementation()!;
    let resolveHistory!: (response: Response) => void;
    const historyResponse = new Promise<Response>((resolve) => {
      resolveHistory = resolve;
    });
    fetchMock.mockImplementation((input, init) =>
      input === `/api/chat/${id}`
        ? historyResponse
        : defaultFetch(input, init),
    );
    renderPage();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Saved conversation" }),
    );
    expect(window.scrollTo).not.toHaveBeenCalledWith({
      left: 0,
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
    resolveHistory(Response.json([message("assistant", "Saved answer", 1)]));
    await screen.findByText("Saved answer");
    await waitFor(() =>
      expect(window.scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
  });

  it("opens history at the top and restores scroll on return", async () => {
    const user = await startChat();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 640,
    });
    await user.click(screen.getByRole("button", { name: "Historie" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      left: 0,
      top: 0,
      behavior: "instant",
    });
    await user.click(
      screen.getByRole("button", { name: "Zpět na konverzaci" }),
    );
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      left: 0,
      top: 640,
      behavior: "instant",
    });
  });
});

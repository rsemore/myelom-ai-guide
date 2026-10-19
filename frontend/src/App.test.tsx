import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory } from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (input: string) =>
      input === "/api/auth/me"
        ? new Response(null, { status: 401 })
        : Response.json([]),
    ),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderApp(path = "/") {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MantineProvider env="test">
        <App history={history} />
      </MantineProvider>
    </QueryClientProvider>,
  );
  return history;
}

describe("application routing", () => {
  it("registers a patient from the doctor portal and copies the QR login link", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        id: "patient-id",
        email: "patient+new@example.com",
        key: "secret&key",
      }, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const history = renderApp("/doctor");
    await user.click(
      screen.getByRole("button", { name: "Registrace pacientů" }),
    );
    await screen.findByRole("heading", { name: "Registrace pacientů" });
    expect(history.location.pathname).toBe("/doctor/registration");
    await user.type(
      screen.getByRole("textbox", { name: "E-mail pacienta" }),
      "patient+new@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrovat pacienta" }),
    );
    const linkInput = await screen.findByRole("textbox", {
      name: "Přihlašovací odkaz",
    });
    const link = (linkInput as HTMLInputElement).value;
    const url = new URL(link);
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe("/login");
    expect(url.search).toBe("");
    expect(new URLSearchParams(url.hash.slice(1)).get("email")).toBe(
      "patient+new@example.com",
    );
    expect(new URLSearchParams(url.hash.slice(1)).get("key")).toBe("secret&key");
    expect(
      screen.getByTitle("QR kód pro přihlášení pacienta").closest("svg"),
    ).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "patient+new@example.com" }),
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Kopírovat přihlašovací odkaz" }),
    );
    await screen.findByText("Odkaz byl zkopírován.");
    expect(copy).toHaveBeenCalledWith(link);
    await user.click(
      screen.getByRole("button", { name: "Registrovat dalšího pacienta" }),
    );
    expect(
      screen.queryByRole("textbox", { name: "Přihlašovací odkaz" }),
    ).toBeNull();
    expect(
      (screen.getByRole("textbox", { name: "E-mail pacienta" }) as HTMLInputElement).value,
    ).toBe("");
  });

  it("reports failed registration without generating a login link", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 400 })),
    );
    renderApp("/doctor/registration");
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail pacienta" }),
      "existing@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Registrovat pacienta" }),
    );
    await screen.findByText("Registrace se nezdařila");
    expect(
      screen.queryByRole("textbox", { name: "Přihlašovací odkaz" }),
    ).toBeNull();
    expect(screen.getByText(/HTTP 400/)).toBeDefined();
  });

  it("signs in from the QR link, removes the credentials from the URL and opens chat", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      if (input.startsWith("/api/auth?"))
        return new Response(null, { status: 204 });
      if (input === "/api/auth/me")
        return Response.json({
          id: "patient-id",
          email: "patient+new@example.com",
        });
      return Response.json([]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const history = renderApp(
      "/login#email=patient%2Bnew%40example.com&key=secret%26key",
    );
    await screen.findByText("Zatím nemáte žádné konverzace.");
    expect(history.location.pathname).toBe("/");
    expect(history.location.hash).toBe("");
    expect(
      fetchMock.mock.calls.filter(([input]) => input.startsWith("/api/auth?")),
    ).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth?email=patient%2Bnew%40example.com&key=secret%26key",
      { credentials: "include" },
    );
  });

  it("does not open chat when a QR login fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const history = renderApp("/login#email=patient%40example.com&key=wrong");
    await screen.findByText("Přihlášení se nezdařilo");
    expect(history.location.hash).toBe("");
    expect(screen.queryByText("Zatím nemáte žádné konverzace.")).toBeNull();
  });

  it("rejects incomplete login links without sending empty credentials", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/login#email=patient%40example.com");
    await screen.findByText("Přihlašovací odkaz není úplný.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists knowledge files, opens Markdown detail and returns to the list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: string) => {
        if (input === "/api/knowledge")
          return Response.json(["patient guide.md"]);
        if (input === "/api/knowledge/patient%20guide.md")
          return new Response("# Patient guide\n\n**Useful** information.");
        return new Response(null, { status: 404 });
      }),
    );
    const history = renderApp("/sources");
    const user = userEvent.setup();
    const fileButton = await screen.findByRole("link", {
      name: "patient guide.md",
    });
    expect(fileButton.getAttribute("data-variant")).toBe("default");
    await user.click(fileButton);
    expect(history.location.pathname).toContain("patient%20guide.md");
    expect(
      await screen.findByRole("heading", { name: "Patient guide" }),
    ).toBeDefined();
    expect(screen.getByText("Useful").tagName).toBe("STRONG");
    await user.click(screen.getByRole("link", { name: "Zpět na zdroje" }));
    await waitFor(() => expect(history.location.pathname).toBe("/sources"));
  });

  it("opens a chat's source file and returns to the originating answer without losing the draft", async () => {
    let loggedIn = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: string) => {
        if (input === "/api/auth/me")
          return loggedIn
            ? Response.json({ id: "user-id", email: "patient@example.com" })
            : new Response(null, { status: 401 });
        if (input.startsWith("/api/auth?")) {
          loggedIn = true;
          return new Response(null, { status: 204 });
        }
        if (input === "/api/knowledge") return Response.json(["guide.md"]);
        if (input === "/api/knowledge/guide.md")
          return new Response("# Knowledge content");
        if (input === "/api/chat")
          return Response.json([
            {
              id: "session",
              title: "Saved chat",
              updatedAt: "2026-10-16T10:00:00.000Z",
            },
          ]);
        if (input === "/api/chat/session")
          return Response.json([
            {
              id: "origin-answer",
              role: "assistant",
              content: "Answer text\n[SOURCE]- `guide.md`[/SOURCE]",
              order: 1,
              createdAt: "2026-10-16T10:00:00.000Z",
              toolCallId: null,
            },
          ]);
        return new Response(null, { status: 404 });
      }),
    );
    const history = renderApp();
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.type(screen.getByLabelText("Přístupový klíč"), "test-key");
    await user.click(
      screen.getByRole("button", { name: "Pokračovat do chatu" }),
    );
    await user.click(await screen.findByRole("button", { name: "Saved chat" }));
    const source = await screen.findByRole("link", { name: "guide.md" });
    expect(source.getAttribute("data-variant")).toBe("default");
    await user.type(screen.getByRole("textbox"), "Unsent draft");
    await user.click(source);
    await screen.findByRole("heading", { name: "Knowledge content" });
    expect(screen.queryByRole("textbox")).toBeNull();
    await user.click(
      screen.getByRole("link", { name: "Zpět na odpověď v chatu" }),
    );
    await screen.findByText("Answer text");
    expect(history.location.hash).toBe("#answer-origin-answer");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "Unsent draft",
    );
  });

  it("shows knowledge errors and retries instead of showing a successful empty list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/sources");
    const user = userEvent.setup();
    await screen.findByText("Zdroje se nepodařilo načíst");
    expect(
      screen.queryByText("Zatím nejsou dostupné žádné dokumenty."),
    ).toBeNull();
    fetchMock.mockResolvedValue(Response.json([]));
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }));
    await screen.findByText("Zatím nejsou dostupné žádné dokumenty.");
  });

  it("updates URLs and preserves the email draft across patient sections and browser history", async () => {
    const history = renderApp();
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "E-mail" }),
      "patient@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Kontakty" }));
    await waitFor(() => expect(history.location.pathname).toBe("/contacts"));
    expect(screen.queryByRole("textbox", { name: "E-mail" })).toBeNull();
    await act(async () => history.back());
    expect(
      (
        (await screen.findByRole("textbox", {
          name: "E-mail",
        })) as HTMLInputElement
      ).value,
    ).toBe("patient@example.com");
    await act(async () => history.forward());
    await waitFor(() => expect(history.location.pathname).toBe("/contacts"));
    expect(screen.queryByRole("textbox", { name: "E-mail" })).toBeNull();
  });

  it("scrolls to the bottom when returning through the Messages tab", async () => {
    const history = renderApp("/contacts");
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Zprávy" }),
    );
    await waitFor(() => expect(history.location.pathname).toBe("/"));
    await waitFor(() =>
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: document.documentElement.scrollHeight,
        left: 0,
        behavior: "instant",
      }),
    );
  });

  it("opens preparation directly", async () => {
    renderApp("/preparation");
    expect(
      await screen.findByRole("heading", { name: "Příprava / Kontext" }),
    ).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Příprava" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("opens the document directly and returns to chat through the router", async () => {
    const history = renderApp("/document");
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Detail pokynu" });
    await user.click(
      screen.getByRole("button", { name: "Zpět na konverzaci" }),
    );
    await screen.findByRole("textbox", { name: "E-mail" });
    expect(history.location.pathname).toBe("/");
  });

  it("routes doctor navigation and returns to the patient application", async () => {
    const history = renderApp("/doctor/documents");
    const user = userEvent.setup();
    await screen.findByText("Správa dokumentů není připojena");
    await user.click(screen.getByRole("button", { name: "Log konverzací" }));
    await waitFor(() => expect(history.location.pathname).toBe("/doctor/logs"));
    await user.click(
      screen.getByRole("link", { name: "Otevřít pacientskou aplikaci" }),
    );
    await screen.findByRole("textbox", { name: "E-mail" });
    expect(history.location.pathname).toBe("/");
  });

  it("shows a not-found page for unknown routes", async () => {
    renderApp("/unknown");
    expect(await screen.findByText("Stránka nebyla nalezena.")).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Pacientská aplikace" })
        .getAttribute("href"),
    ).toBe("/");
  });
});

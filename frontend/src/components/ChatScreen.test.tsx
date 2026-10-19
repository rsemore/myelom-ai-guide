import type { ReactElement } from "react";

import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ChatMessage, EscalationMessage, RiskLevel } from "../types/chat";
import type { Contacts } from "../types/contacts";

import { demoMessages, demoProcedure } from "../data/demo";
import { ChatPage } from "../pages/ChatPage";
import { ChatScreen, type ChatScreenProps } from "./ChatScreen";
import { ContactButton } from "./ContactButton";
import { MessageCard } from "./MessageCard";

const contacts: Contacts = {
  ward: { id: "ward", label: "Oddělení", phone: "+420 555 010 020" },
  urgent: {
    id: "urgent",
    label: "Urgentní kontakt",
    phone: "+420 555 030 040",
  },
};
const createdAt = "2024-05-21T09:18:00+02:00";

function renderMantine(element: ReactElement) {
  return render(<MantineProvider env="test">{element}</MantineProvider>);
}

function renderMessage(message: ChatMessage) {
  const onFeedback = vi.fn();
  renderMantine(
    <MessageCard
      message={message}
      contacts={contacts}
      emergencyContactId="urgent"
      onFeedback={onFeedback}
    />,
  );
  return { onFeedback };
}

function renderScreen(overrides: Partial<ChatScreenProps> = {}) {
  const props: ChatScreenProps = {
    messages: demoMessages,
    contacts,
    receptionContactId: "ward",
    emergencyContactId: "urgent",
    emergencyContactIds: ["urgent"],
    procedure: demoProcedure,
    readingLevel: "simple",
    pending: false,
    onReadingLevelChange: vi.fn(),
    onChangeProcedure: vi.fn(),
    onRetry: vi.fn(),
    onSend: vi.fn(),
    onFeedback: vi.fn(),
    ...overrides,
  };
  renderMantine(<ChatScreen {...props} />);
  return props;
}

describe("discriminated message rendering", () => {
  it("shows the chat title between the new-chat and help controls", () => {
    renderScreen({ title: "Moje léčba", onNewChat: vi.fn() });
    const title = screen.getByRole("heading", { name: "Moje léčba" });
    const newChat = screen.getByRole("button", { name: "Nový chat" });
    const help = screen.getByRole("button", { name: "Nápověda" });
    expect(newChat.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.style.textAlign).toBe("center");
    expect(title.getAttribute("title")).toBe("Moje léčba");
  });

  it("keeps the chat controls sticky below the application header", () => {
    renderScreen({ onNewChat: vi.fn(), onOpenHistory: vi.fn() });
    const toolbar = screen.getByRole("group", { name: "Ovládání chatu" });
    expect(toolbar.style.position).toBe("sticky");
    expect(toolbar.style.top).toBe("var(--app-shell-header-height, 0px)");
    expect(toolbar.contains(screen.getByRole("button", { name: "Nový chat" }))).toBe(true);
  });

  it("renders user messages without an assistant kind", () => {
    renderMessage({ id: "user", createdAt, sender: "user", text: "Můj dotaz" });
    expect(screen.getByText("Můj dotaz")).toBeDefined();
    expect(screen.getByText("Vy (Pacient)")).toBeDefined();
    expect(screen.queryByText("Nemocniční asistent")).toBeNull();
  });

  it.each<{ risk: RiskLevel; label: string }>([
    { risk: "low", label: "Nízké riziko" },
    { risk: "medium", label: "Střední riziko" },
    { risk: "high", label: "Vysoké riziko" },
  ])(
    "renders answer risk $risk, citations and feedback",
    async ({ risk, label }) => {
      const user = userEvent.setup();
      const { onFeedback } = renderMessage({
        id: "answer",
        createdAt,
        sender: "assistant",
        kind: "answer",
        risk,
        text: "Schválená odpověď",
        citations: [
          {
            documentId: "doc",
            title: "Pokyny",
            version: "2.4",
            page: 0,
            quote: "Přesná citace",
          },
        ],
      });
      expect(screen.getByText(label)).toBeDefined();
      expect(screen.getByText("Pokyny v. 2.4, str. 0")).toBeDefined();
      expect(screen.getByText("Přesná citace")).toBeDefined();
      await user.click(screen.getByRole("button", { name: "Ano" }));
      await user.click(screen.getByRole("button", { name: "Upřesnit" }));
      expect(onFeedback.mock.calls).toEqual([
        ["answer", "clear"],
        ["answer", "clarify"],
      ]);
    },
  );

  it("renders no_answer using the referenced contact, not an emergency fallback", () => {
    renderMessage({
      id: "no-answer",
      createdAt,
      sender: "assistant",
      kind: "no_answer",
      contactId: "ward",
    });
    expect(screen.getByText("Nenalezeno v materiálech")).toBeDefined();
    expect(screen.getByText("Doporučený kontakt")).toBeDefined();
    expect(screen.getByText("Vyžaduje lékaře")).toBeDefined();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "tel:+420555010020",
    );
  });

  it.each([false, true])("honors escalation call155=%s", (call155) => {
    renderMessage({
      id: "escalation",
      createdAt,
      sender: "assistant",
      kind: "escalation",
      instruction: "Kontaktujte své oddělení.",
      contactId: "ward",
      call155,
    });
    expect(screen.getByText("Kontaktujte své oddělení.")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain(
      "VYSOKÉ RIZIKO – OKAMŽITÁ AKCE",
    );
    expect(screen.getByText("Odpovědné pracoviště")).toBeDefined();
    expect(screen.getAllByRole("link")).toHaveLength(call155 ? 2 : 1);
    if (call155) {
      expect(
        screen
          .getByRole("link", { name: /Urgentní kontakt/ })
          .getAttribute("href"),
      ).toBe("tel:+420555030040");
    }
  });

  it("does not duplicate an emergency contact during escalation", () => {
    const message: EscalationMessage = {
      id: "escalation",
      createdAt,
      sender: "assistant",
      kind: "escalation",
      instruction: "Volejte pomoc.",
      contactId: "urgent",
      call155: true,
    };
    renderMessage(message);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("does not imply verification when an answer has no citations", () => {
    renderMessage({
      id: "unsourced",
      createdAt,
      sender: "assistant",
      kind: "answer",
      text: "Odpověď bez citace",
      risk: "medium",
      citations: [],
    });
    expect(screen.getByText("Zdroje odpovědi (0)")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toContain(
      "Zdroj není přiložen",
    );
    expect(screen.queryByText("Ověřeno protokolem")).toBeNull();
  });

  it("explicitly disables source opening when the host is not connected", () => {
    const answer = demoMessages.find(
      (message) => message.sender === "assistant" && message.kind === "answer",
    );
    if (!answer) throw new Error("Demo answer is missing");
    renderMessage(answer);
    expect(
      screen
        .getByRole("button", { name: "Otevřít zdrojový dokument" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByText("Otevření zdrojového dokumentu není připojeno."),
    ).toBeDefined();
  });

  it("reports a missing escalation contact and retains the emergency action", () => {
    renderMessage({
      id: "missing-ward",
      createdAt,
      sender: "assistant",
      kind: "escalation",
      instruction: "Kontaktujte své oddělení.",
      contactId: "missing",
      call155: true,
    });
    expect(screen.getByText("Kontakt není nastaven")).toBeDefined();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "tel:+420555030040",
    );
  });
});

describe("source integration", () => {
  it("passes the selected citation through the chat screen to the host", async () => {
    const user = userEvent.setup();
    const onOpenSource = vi.fn();
    renderScreen({ onOpenSource });
    await user.click(
      screen.getByRole("button", { name: "Otevřít zdrojový dokument" }),
    );
    const answer = demoMessages.find(
      (message) => message.sender === "assistant" && message.kind === "answer",
    );
    if (!answer || answer.sender !== "assistant" || answer.kind !== "answer") {
      throw new Error("Demo answer is missing");
    }
    expect(onOpenSource).toHaveBeenCalledExactlyOnceWith(answer.citations[0]);
  });

  describe("chat toolbar and input", () => {
    it("keeps history and help on white buttons with settings after help", () => {
      renderScreen({ onOpenHistory: vi.fn(), onNewChat: vi.fn() });
      const history = screen.getByRole("button", { name: "Historie" });
      const help = screen.getByRole("button", { name: "Nápověda" });
      const settings = screen.getByRole("button", { name: "Nastavení chatu" });
      expect(history.getAttribute("data-variant")).toBe("default");
      expect(help.getAttribute("data-variant")).toBe("default");
      expect(history.style.background).toContain("white");
      expect(help.style.background).toContain("white");
      expect(
        help.compareDocumentPosition(settings) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).not.toBe(0);
    });

    it("uses an accessible input without a visible label", () => {
      renderScreen();
      const input = screen.getByRole("textbox", {
        name: "Váš dotaz k mnohočetnému myelomu",
      });
      expect(input.getAttribute("placeholder")).toBe(
        "Zeptejte se na onemocnění, péči nebo léčbu...",
      );
      expect(
        screen.queryByText("Váš dotaz k mnohočetnému myelomu:"),
      ).toBeNull();
    });
  });

  it("opens the document detail and preserves the chat draft on return", async () => {
    const user = userEvent.setup();
    renderMantine(<ChatPage />);
    expect(screen.getByText("Standardní odpověď")).toBeDefined();
    expect(screen.getByText("Vyžaduje lékaře")).toBeDefined();
    expect(screen.getByText("Urgentní eskalace")).toBeDefined();
    await user.type(screen.getByRole("textbox"), "Rozepsaný dotaz");
    await user.click(
      screen.getByRole("button", { name: "Otevřít zdrojový dokument" }),
    );
    expect(
      screen.getByRole("heading", { name: "Detail pokynu" }),
    ).toBeDefined();
    expect(screen.getByText("Strana 4 z 8")).toBeDefined();
    expect(screen.queryByRole("textbox")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Zpět na konverzaci" }),
    );
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "Rozepsaný dotaz",
    );
  });
});

describe("contacts", () => {
  it.each([
    {},
    { ward: { id: "ward", label: "Oddělení" } },
    { ward: { id: "ward", label: "Oddělení", phone: "   " } },
  ])("explicitly reports missing phone configuration", (config) => {
    renderMantine(<ContactButton contacts={config} contactId="ward" />);
    expect(screen.getByRole("alert").textContent).toContain(
      "telefonní číslo není k dispozici",
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("chat controls", () => {
  it("leaves the shared application header to the shell", () => {
    renderScreen();
    expect(
      screen.queryByRole("heading", { name: "Asistent pro pacienty" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Kontaktovat zdravotníka" }),
    ).toBeNull();
    expect(screen.queryByRole("radio", { name: "Jednoduše" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Nastavení chatu" }),
    ).toBeDefined();
  });

  it("switches panels, retries and delegates procedure changes", async () => {
    const user = userEvent.setup();
    const props = renderScreen();
    await user.click(screen.getByRole("button", { name: "Nápověda" }));
    expect(
      screen.getByRole("heading", { name: "Jak vám mohu pomoci?" }),
    ).toBeDefined();
    await user.click(
      screen.getByRole("button", { name: "Ukázka výpadku připojení" }),
    );
    expect(
      screen
        .getByRole("link", { name: "Volat recepci hematologie" })
        .getAttribute("href"),
    ).toBe("tel:+420555010020");
    await user.click(screen.getByRole("button", { name: "Zkusit znovu" }));
    expect(props.onRetry).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Nastavení chatu" }));
    await user.click(
      screen.getByRole("button", { name: "Změnit plánovanou návštěvu" }),
    );
    expect(props.onChangeProcedure).toHaveBeenCalledOnce();
  });

  it("prefills and focuses the composer and sends the selected reading level", async () => {
    const user = userEvent.setup();
    const props = renderScreen({ readingLevel: "detailed", messages: [] });
    const input = screen.getByRole("textbox");
    await user.click(
      screen.getByRole("button", { name: "Kde najdu informace o své léčbě?" }),
    );
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe(
      "Kde najdu informace o své léčbě?",
    );
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    expect(props.onSend).toHaveBeenCalledWith(
      "Kde najdu informace o své léčbě?",
      "detailed",
    );
    expect((input as HTMLInputElement).value).toBe("");
    await user.type(input, "   ");
    expect(
      screen
        .getByRole("button", { name: "Odeslat dotaz" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(props.onSend).toHaveBeenCalledOnce();
  });

  it("delegates reading-level selection", async () => {
    const user = userEvent.setup();
    const props = renderScreen();
    await user.click(screen.getByRole("button", { name: "Nastavení chatu" }));
    await user.click(screen.getByRole("radio", { name: "Podrobně" }));
    expect(props.onReadingLevelChange).toHaveBeenCalledWith("detailed");
  });

  it("shows loading only when pending and blocks duplicate sends", async () => {
    const user = userEvent.setup();
    const props = renderScreen({ pending: true });
    expect(screen.getByRole("status").textContent).toContain(
      "Hledám ve schválených materiálech",
    );
    expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Odeslat dotaz" }));
    expect(props.onSend).not.toHaveBeenCalled();
  });

  it("does not display stale loading in a completed conversation", () => {
    renderScreen();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows suggested questions only in an empty conversation", () => {
    renderScreen();
    expect(screen.queryByText("Časté otázky pacientů:")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Co je mnohočetný myelom?" }),
    ).toBeNull();
    expect(screen.getByRole("textbox")).toBeDefined();
    expect(
      screen.queryByText("Ukázka: odpovědi s citacemi dokumentů"),
    ).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Změnit plánovanou návštěvu" }),
    ).toBeNull();
  });

  it("keeps the disclaimer in the scrollable content and fixes only the input", () => {
    renderScreen({ messages: [] });
    const form = screen.getByRole("form", { name: "Odeslání dotazu" });
    const fixedBar = form.parentElement?.parentElement;
    expect(fixedBar?.style.position).toBe("fixed");
    expect(fixedBar?.style.bottom).toContain("--app-shell-footer-height");
    expect(fixedBar?.textContent).not.toContain("Asistent nenahrazuje lékaře.");
    expect(screen.getByText("Asistent nenahrazuje lékaře.")).toBeDefined();
    expect(screen.getByText("Časté otázky pacientů:")).toBeDefined();
  });
});

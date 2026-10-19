import { MantineProvider } from "@mantine/core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AnswerMessage } from "../types/chat";

import { AnswerCard } from "./AnswerCard";

function renderAnswer(
  text: string,
  citations: AnswerMessage["citations"] = [],
) {
  return render(
    <MantineProvider env="test">
      <AnswerCard
        message={{
          id: "answer",
          createdAt: "2026-10-16T10:00:00.000Z",
          sender: "assistant",
          kind: "answer",
          text,
          citations,
        }}
        onFeedback={vi.fn()}
      />
    </MantineProvider>,
  );
}

describe("answer source rendering", () => {
  it("renders tagged Markdown under the sources heading instead of the answer body", () => {
    const { container } = renderAnswer(
      "## Answer\n\nUseful details.\n\n[SOURCE]\n- [**Guide**](https://example.com/guide.md)\n- `local-guide.md`\n[/SOURCE]",
    );
    const heading = screen.getByText("Zdroje odpovědi (2)");
    const link = screen.getByRole("link", { name: "Guide" });
    expect(
      heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(link.getAttribute("href")).toBe("https://example.com/guide.md");
    expect(screen.getByText("local-guide.md").tagName).toBe("CODE");
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(link.closest(".mantine-Card-root")).toBe(
      screen.getByText("local-guide.md").closest(".mantine-Card-root"),
    );
    expect(container.textContent).not.toContain("[SOURCE]");
    expect(container.textContent).not.toContain("[/SOURCE]");
    expect(screen.queryByText("Zdroj není přiložen")).toBeNull();
    expect(screen.queryByText(/v\./)).toBeNull();
  });

  it("retains existing structured citations alongside tagged sources", () => {
    renderAnswer("Answer\n[SOURCE]guide.md[/SOURCE]", [
      {
        documentId: "doc",
        title: "Approved guide",
        version: "1",
        quote: "Quoted text",
      },
    ]);
    expect(screen.getByText("Zdroje odpovědi (2)")).toBeDefined();
    expect(screen.getByText("Approved guide v. 1")).toBeDefined();
  });

  it("retains the missing-source notice when no usable sources are provided", () => {
    renderAnswer("Answer\n[SOURCE] [/SOURCE]");
    expect(screen.getByText("Zdroje odpovědi (0)")).toBeDefined();
    expect(screen.getByText("Zdroj není přiložen")).toBeDefined();
  });

  it("filters unsafe Markdown links in source blocks", () => {
    renderAnswer("Answer\n[SOURCE][Unsafe](javascript:alert%281%29)[/SOURCE]");
    expect(screen.queryByRole("link", { name: "Unsafe" })).toBeNull();
    expect(screen.getByText("Unsafe")).toBeDefined();
  });
});

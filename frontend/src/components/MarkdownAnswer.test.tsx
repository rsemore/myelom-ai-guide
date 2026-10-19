import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownAnswer } from "./MarkdownAnswer";

function renderMarkdown(text: string) {
  return render(
    <MantineProvider env="test">
      <MarkdownAnswer>{text}</MarkdownAnswer>
    </MantineProvider>,
  );
}

describe("MarkdownAnswer", () => {
  it("renders headings, emphasis, lists, quotes and code as formatted content", () => {
    const { container } = renderMarkdown(
      "## Care guide\n\nA **bold** and *emphasized* answer.\n\n- First step\n- Second step\n\n1. Ordered step\n\n> Important note\n\nUse `inline code`.\n\n```ts\nconst value = 1;\n```",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Care guide" }),
    ).toBeDefined();
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("emphasized");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(container.querySelector("blockquote")?.textContent).toContain(
      "Important note",
    );
    expect(container.querySelector("pre code")?.textContent).toBe(
      "const value = 1;\n",
    );
    expect(container.querySelector("p code")?.textContent).toBe("inline code");
  });

  it("supports GFM tables, strikethrough and task lists", () => {
    const { container } = renderMarkdown(
      "| Topic | Detail |\n| --- | --- |\n| Care | Information |\n\n~~Old text~~\n\n- [x] Complete",
    );
    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Topic" })).toBeDefined();
    expect(container.querySelector("del")?.textContent).toBe("Old text");
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it("opens source links separately without allowing access to the opener", () => {
    renderMarkdown("[Source](https://example.com/guide)");
    const link = screen.getByRole("link", { name: "Source" });
    expect(link.getAttribute("href")).toBe("https://example.com/guide");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("does not execute raw HTML, render remote images or allow script links", () => {
    const { container } = renderMarkdown(
      '<script>alert("unsafe")</script>\n\n<img src="https://example.com/tracker" onerror="alert(1)">\n\n![Remote image](https://example.com/image.png)\n\n[Unsafe](javascript:alert%281%29)\n\nNormal answer',
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link", { name: "Unsafe" })).toBeNull();
    expect(screen.getByText("Normal answer")).toBeDefined();
  });
});

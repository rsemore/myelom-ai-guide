import { describe, expect, it } from "vitest";

import { extractAnswerSources } from "./answerSources";

describe("extractAnswerSources", () => {
  it("separates Markdown sources from answer text", () => {
    expect(
      extractAnswerSources(
        "## Answer\n\nDetails.\n\n[SOURCE]\n- [Guide](https://example.com/guide)\n- ISBN `00-000-0000-0`\n- `patient-guide.md`\n[/SOURCE]",
      ),
    ).toEqual({
      text: "## Answer\n\nDetails.",
      sources: [
        "[Guide](https://example.com/guide)",
        "ISBN `00-000-0000-0`",
        "`patient-guide.md`",
      ],
    });
  });

  it.each(["md", "markdown", ""])(
    "unwraps %s fences around the tagged section",
    (language) => {
      expect(
        extractAnswerSources(
          `Answer\n\n\`\`\`${language}\n[SOURCE]\n- **Guide** [link](https://example.com)\n[/SOURCE]\n\`\`\``,
        ),
      ).toEqual({
        text: "Answer",
        sources: ["**Guide** [link](https://example.com)"],
      });
    },
  );

  it("unwraps Markdown fences inside the source section", () => {
    expect(
      extractAnswerSources(
        "Answer\n[SOURCE]\n```md\n- guide.md\n```\n[/SOURCE]",
      ),
    ).toEqual({
      text: "Answer",
      sources: ["guide.md"],
    });
  });

  it("supports multiple sections, numbered entries and deduplicates exact duplicates", () => {
    expect(
      extractAnswerSources(
        "Answer\n[SOURCE]\n1. Guide\n2. Other\n[/SOURCE]\n[source]Guide[/source]",
      ),
    ).toEqual({
      text: "Answer",
      sources: ["Guide", "Other"],
    });
  });

  it("keeps multiline Markdown in each source", () => {
    expect(
      extractAnswerSources(
        "[SOURCE]\n- **Guide**\n  [Read more](https://example.com)\n- Next\n[/SOURCE]",
      ).sources,
    ).toEqual(["**Guide**\n  [Read more](https://example.com)", "Next"]);
  });

  it("leaves ordinary Markdown and incomplete sections intact", () => {
    const text = "Answer\n\n```md\n# Example\n```\n\n[SOURCE]unfinished";
    expect(extractAnswerSources(text)).toEqual({ text, sources: [] });
  });

  it("does not count empty sections as sources", () => {
    expect(extractAnswerSources("Answer\n[SOURCE]\n- \n[/SOURCE]")).toEqual({
      text: "Answer",
      sources: [],
    });
  });
});

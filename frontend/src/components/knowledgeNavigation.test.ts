import { describe, expect, it } from "vitest";

import {
  linkKnowledgeFiles,
  resolveKnowledgeFile,
} from "./knowledgeNavigation";

describe("knowledge source links", () => {
  const files = ["guide.md", "patient guide.md"];

  it("links bracketed filenames without retaining the outer brackets", () => {
    const file =
      "2-co-je-to-mnohocetny-myelom-jak-se-nemoc-diagnostikuje-a-jak-se-sleduje-prubeh-lecby.md";
    expect(linkKnowledgeFiles(`[${file}]`, [file])).toBe(
      `[${file}](/sources/${file})`,
    );
    expect(linkKnowledgeFiles("[patient guide.md]", files)).toBe(
      "[patient guide.md](/sources/patient%20guide.md)",
    );
    expect(linkKnowledgeFiles("[missing.md]", files)).toBe("[missing.md]");
    expect(linkKnowledgeFiles("[guide.md](https://example.com)", files)).toBe(
      "[guide.md](https://example.com)",
    );
  });

  it("removes commas between consecutive source-file buttons", () => {
    expect(
      linkKnowledgeFiles(
        "`guide.md`, patient guide.md, [Guide](./guide.md)",
        files,
      ),
    ).toBe(
      "[guide.md](/sources/guide.md) [patient guide.md](/sources/patient%20guide.md) [Guide](./guide.md)",
    );
  });

  it("preserves commas in prose and beside external links", () => {
    expect(
      linkKnowledgeFiles(
        "See guide.md, for details, [Web](https://example.com), [Guide](guide.md)",
        files,
      ),
    ).toBe(
      "See [guide.md](/sources/guide.md), for details, [Web](https://example.com), [Guide](guide.md)",
    );
  });

  it("links plain and code filenames without altering external Markdown links", () => {
    expect(
      linkKnowledgeFiles(
        "`guide.md` and patient guide.md and [Web](https://example.com/guide.md)",
        files,
      ),
    ).toBe(
      "[guide.md](/sources/guide.md) and [patient guide.md](/sources/patient%20guide.md) and [Web](https://example.com/guide.md)",
    );
  });

  it("resolves known relative and internal links with or without the extension", () => {
    expect(resolveKnowledgeFile("./guide.md", files)).toBe("guide.md");
    expect(resolveKnowledgeFile("guide", files)).toBe("guide.md");
    expect(resolveKnowledgeFile("/sources/patient%20guide.md", files)).toBe(
      "patient guide.md",
    );
  });

  it("does not turn missing documents, malformed encodings or external URLs into internal links", () => {
    expect(linkKnowledgeFiles("missing-guide.md", files)).toBe(
      "missing-guide.md",
    );
    expect(resolveKnowledgeFile("missing.md", files)).toBeUndefined();
    expect(resolveKnowledgeFile("%invalid", files)).toBeUndefined();
    expect(
      resolveKnowledgeFile("https://example.com/guide.md", files),
    ).toBeUndefined();
    expect(resolveKnowledgeFile("../guide.md", files)).toBeUndefined();
  });
});

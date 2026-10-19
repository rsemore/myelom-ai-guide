function unwrapMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const match =
    /^(?:```|~~~)(?:md|markdown)?[ \t]*\r?\n([\s\S]*?)\r?\n(?:```|~~~)$/.exec(
      trimmed,
    );
  return match ? match[1].trim() : trimmed;
}

export function extractAnswerSources(text: string) {
  const sources: string[] = [];
  // Some models wrap the entire tagged section in a Markdown code fence.
  const normalized = text.replace(
    /(?:```|~~~)(?:md|markdown)?[ \t]*\r?\n[ \t]*(\[SOURCE\][\s\S]*?\[\/SOURCE\])[ \t]*\r?\n(?:```|~~~)/gi,
    "$1",
  );
  const answer = normalized.replace(
    /\[SOURCE\]([\s\S]*?)\[\/SOURCE\]/gi,
    (_block, content: string) => {
      const markdown = unwrapMarkdownFence(content);
      if (markdown) {
        const entries = markdown.split(/\r?\n(?=(?:[-+*]|\d+[.)])[ \t]+)/);
        for (const entry of entries) {
          const source = entry
            .replace(/^(?:[-+*]|\d+[.)])(?:[ \t]+|$)/, "")
            .trim();
          if (source && !sources.includes(source)) sources.push(source);
        }
      }
      return "";
    },
  );
  return { text: answer.trim(), sources };
}

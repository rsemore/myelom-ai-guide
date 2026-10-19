import { createContext } from "react";

export const KnowledgeNavigationContext = createContext<{
  files: readonly string[];
  openFile: (file: string, answerId: string) => void;
} | null>(null);

export function linkKnowledgeFiles(
  markdown: string,
  files: readonly string[],
): string {
  if (!files.length) return markdown;
  const names = [...files]
    .sort((a, b) => b.length - a.length)
    .map((file) => file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  // Consume existing links and URLs whole so filename linking cannot corrupt them.
  const pattern = new RegExp(
    `\\[[^\\]]*\\]\\([^\\s)]*(?:\\s+"[^"]*")?\\)|https?:\\/\\/[^\\s<>]+|\\[(${names})\\](?![\\[(])|\`(${names})\`|(?<![\\p{L}\\p{N}_./-])(${names})(?![\\p{L}\\p{N}_-])`,
    "gu",
  );
  const linked = markdown.replace(
    pattern,
    (
      match,
      bracketed: string | undefined,
      code: string | undefined,
      plain: string | undefined,
    ) => {
      const file = bracketed ?? code ?? plain;
      return file ? `[${file}](/sources/${encodeURIComponent(file)})` : match;
    },
  );
  return linked.replace(
    /(\[[^\]]*\]\(([^)\s]+)\))[ \t]*,[ \t]*(?=\[[^\]]*\]\(([^)\s]+)\))/g,
    (match, link: string, href: string, nextHref: string) =>
      resolveKnowledgeFile(href, files) && resolveKnowledgeFile(nextHref, files)
        ? `${link} `
        : match,
  );
}

export function resolveKnowledgeFile(
  href: string,
  files: readonly string[],
): string | undefined {
  if (/^(?:https?:|mailto:|\/\/|#)/i.test(href)) return undefined;
  const path = href.replace(/^\/sources\//, "").split(/[?#]/)[0];
  let name: string;
  try {
    name = decodeURIComponent(path).replace(/^\.\//, "");
  } catch {
    return undefined;
  }
  return files.find((file) => file === name || file === `${name}.md`);
}

import { useQuery } from "@tanstack/react-query";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);

async function getKnowledge(path: string, signal: AbortSignal) {
  const response = await fetch(`${baseUrl}/knowledge${path}`, {
    signal,
    credentials: "include",
  });
  if (!response.ok)
    throw new Error(`Požadavek se nezdařil (HTTP ${response.status}).`);
  return response;
}

export function useKnowledgeFiles() {
  return useQuery({
    queryKey: ["knowledge"],
    queryFn: async ({ signal }): Promise<string[]> =>
      (await getKnowledge("", signal)).json(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useKnowledgeFile(file: string) {
  return useQuery({
    queryKey: ["knowledge", file],
    queryFn: async ({ signal }) =>
      (await getKnowledge(`/${encodeURIComponent(file)}`, signal)).text(),
    retry: false,
  });
}

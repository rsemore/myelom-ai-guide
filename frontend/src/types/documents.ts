export type DocumentSection =
  | { kind: "paragraph"; text: string }
  | { kind: "citation"; text: string; location: string };

export type DocumentPage = {
  number: number;
  chapter: string;
  title: string;
  sections: readonly DocumentSection[];
  endNote?: string;
};

export type SourceDocument = {
  id: string;
  title: string;
  code: string;
  version: string;
  guarantor: string;
  approvedAt: string;
  organization: string;
  totalPages: number;
  pages: readonly DocumentPage[];
  pdf?: { url: string; sizeLabel: string };
};

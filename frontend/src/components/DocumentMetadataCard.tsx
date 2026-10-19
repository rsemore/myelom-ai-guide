import { Badge, Card, Stack, Text, Title } from "@mantine/core";

import type { SourceDocument } from "../types/documents";

export type DocumentMetadataCardProps = {
  document: SourceDocument;
};

export function DocumentMetadataCard({ document }: DocumentMetadataCardProps) {
  return (
    <Card>
      <Stack gap="xs">
        <Badge variant="light">Klinický protokol</Badge>
        <Title order={2}>{document.title}</Title>
        <Text size="sm">
          Kód: {document.code} · Verze {document.version}
        </Text>
        <Text size="sm">
          Garant: {document.guarantor} · Schváleno: {document.approvedAt}
        </Text>
        <Text size="sm">{document.organization}</Text>
      </Stack>
    </Card>
  );
}

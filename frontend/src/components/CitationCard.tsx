import { Button, Card, Stack, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";

import type { Citation } from "../types/chat";

export type CitationCardProps = {
  citation: Citation;
  onOpenSource?: (citation: Citation) => void;
};

export function CitationCard({ citation, onOpenSource }: CitationCardProps) {
  return (
    <Card bg="gray.0" shadow="none">
      <Stack gap="xs">
        <Text fw="bold">Zdroj lékařského doporučení:</Text>
        <Text>
          {citation.title} v. {citation.version}
          {citation.page !== undefined && `, str. ${citation.page}`}
        </Text>
        <Text>{citation.quote}</Text>
        <Button
          variant="default"
          leftSection={<IconExternalLink aria-hidden="true" size={20} />}
          disabled={!onOpenSource}
          onClick={() => onOpenSource?.(citation)}
        >
          Otevřít zdrojový dokument
        </Button>
        {!onOpenSource && (
          <Text size="sm">Otevření zdrojového dokumentu není připojeno.</Text>
        )}
      </Stack>
    </Card>
  );
}

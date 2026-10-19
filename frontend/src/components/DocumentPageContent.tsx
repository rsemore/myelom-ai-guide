import {
  Alert,
  Blockquote,
  Card,
  Highlight,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { DocumentPage } from "../types/documents";

export type DocumentPageContentProps = {
  page: DocumentPage;
  search: string;
  citedQuote?: string;
};

export function DocumentPageContent({
  page,
  search,
  citedQuote,
}: DocumentPageContentProps) {
  return (
    <Card component="article" aria-label={page.title} bg="white">
      <Stack>
        <Stack gap="xs">
          <Text size="sm">{page.chapter}</Text>
          <Title order={3}>
            <Highlight component="span" highlight={search}>
              {page.title}
            </Highlight>
          </Title>
        </Stack>
        {page.sections.map((section, index) =>
          section.kind === "citation" ? (
            <Stack key={index} gap="xs">
              <Blockquote
                cite={
                  citedQuote && section.text.includes(citedQuote)
                    ? "Citováno asistentem v odpovědi"
                    : "Úryvek dokumentu"
                }
              >
                <Highlight highlight={search}>{section.text}</Highlight>
              </Blockquote>
              <Text size="sm">{section.location}</Text>
            </Stack>
          ) : (
            <Highlight key={index} highlight={search}>
              {section.text}
            </Highlight>
          ),
        )}
        {page.endNote && (
          <Alert icon={<IconInfoCircle />} title="Konec náhledu">
            {page.endNote}
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

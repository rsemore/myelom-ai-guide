import { Alert, Button, Group, Stack, Title } from "@mantine/core";
import { IconArrowLeft, IconDownload, IconMessage } from "@tabler/icons-react";
import { useState } from "react";

import type { Citation } from "../types/chat";
import type { Contacts } from "../types/contacts";
import type { SourceDocument } from "../types/documents";

import { ContactButton } from "../components/ContactButton";
import { DocumentMetadataCard } from "../components/DocumentMetadataCard";
import { DocumentPageContent } from "../components/DocumentPageContent";
import { DocumentToolbar } from "../components/DocumentToolbar";

export type DocumentDetailPageProps = {
  document: SourceDocument;
  citation?: Citation;
  contacts: Contacts;
  supportContactId: string;
  onBack: () => void;
};

export function DocumentDetailPage({
  document,
  citation,
  contacts,
  supportContactId,
  onBack,
}: DocumentDetailPageProps) {
  const matchingCitation =
    citation?.documentId === document.id &&
    citation.version === document.version
      ? citation
      : undefined;
  const [pageNumber, setPageNumber] = useState(
    matchingCitation?.page ?? document.pages[0]?.number,
  );
  const [search, setSearch] = useState("");
  const page = document.pages.find((item) => item.number === pageNumber);
  const query = search.trim();
  const matchCount =
    page && query
      ? [page.title, ...page.sections.map((section) => section.text)].reduce(
          (count, text) =>
            count +
            text.toLocaleLowerCase("cs").split(query.toLocaleLowerCase("cs"))
              .length -
            1,
          0,
        )
      : 0;

  return (
    <Stack>
      <Group
        justify="space-between"
        pos="sticky"
        top="var(--app-shell-header-height, 0px)"
        bg="var(--mantine-color-body)"
        py="xs"
        style={{ zIndex: 100 }}
      >
        <Button
          variant="default"
          leftSection={<IconArrowLeft aria-hidden="true" size={20} />}
          onClick={onBack}
        >
          Zpět na konverzaci
        </Button>
        <Title order={1}>Detail pokynu</Title>
      </Group>
      <Alert title="Ukázka dokumentu">
        Demonstrační dokument k mnohočetnému myelomu. Nejde o ověřený nemocniční
        standard ani lékařské doporučení. Plný dokument není připojen.
      </Alert>
      <DocumentMetadataCard document={document} />
      {citation && !matchingCitation && (
        <Alert title="Citace neodpovídá dokumentu" role="alert">
          Identifikátor nebo verze citace se neshoduje. Citovaný úryvek nelze
          ověřit.
        </Alert>
      )}
      {page ? (
        <>
          <DocumentToolbar
            page={page.number}
            totalPages={document.totalPages}
            hasPrevious={document.pages.some(
              (item) => item.number === page.number - 1,
            )}
            hasNext={document.pages.some(
              (item) => item.number === page.number + 1,
            )}
            onPrevious={() => setPageNumber(page.number - 1)}
            onNext={() => setPageNumber(page.number + 1)}
            search={search}
            onSearchChange={setSearch}
            matchCount={matchCount}
            partial={document.pages.length < document.totalPages}
          />
          <DocumentPageContent
            page={page}
            search={query}
            citedQuote={
              matchingCitation?.page === page.number
                ? matchingCitation.quote
                : undefined
            }
          />
        </>
      ) : (
        <Alert title="Strana není dostupná" role="alert">
          Požadovaná strana není součástí připojeného náhledu.
        </Alert>
      )}
      <Button
        leftSection={<IconMessage aria-hidden="true" size={20} />}
        onClick={onBack}
        fullWidth
      >
        Zpět do chatu s dotazem
      </Button>
      {document.pdf ? (
        <Button
          component="a"
          href={document.pdf.url}
          download
          variant="default"
          leftSection={<IconDownload aria-hidden="true" size={20} />}
          fullWidth
        >
          Stáhnout PDF ({document.pdf.sizeLabel})
        </Button>
      ) : (
        <Stack gap="xs">
          <Button
            disabled
            variant="default"
            leftSection={<IconDownload aria-hidden="true" size={20} />}
            fullWidth
          >
            Stáhnout PDF
          </Button>
          <Alert title="PDF není připojeno">
            Soubor ke stažení není v ukázce k dispozici.
          </Alert>
        </Stack>
      )}
      <Alert title="Máte nejasnosti v textu pokynů?">
        <ContactButton contacts={contacts} contactId={supportContactId} />
      </Alert>
    </Stack>
  );
}

import type { ReactNode } from "react";

import { Alert, Anchor, Card, Group, Stack, Text, Title } from "@mantine/core";

import type { ContactDirectoryEntry, Contacts } from "../types/contacts";

import { ContactButton } from "./ContactButton";

export type ContactDirectoryCardProps = {
  entry: ContactDirectoryEntry;
  contacts: Contacts;
  hideContact?: boolean;
  contactDetailsId?: string;
  children?: ReactNode;
};

export function ContactDirectoryCard({
  entry,
  contacts,
  hideContact = false,
  contactDetailsId,
  children,
}: ContactDirectoryCardProps) {
  const contact = contacts[entry.contactId];

  return (
    <Card component="article" aria-label={entry.title}>
      <Stack gap="sm">
        <Stack gap="xs">
          <Text size="sm">{entry.category}</Text>
          <Title order={3}>{entry.title}</Title>
        </Stack>
        <Text>Volejte při: {entry.guidance}</Text>
        {entry.note && <Alert title="Konzultace medikace">{entry.note}</Alert>}
        <Stack
          gap="xs"
          id={contactDetailsId}
          display={hideContact ? "none" : undefined}
        >
          {contact?.personName?.trim() && (
            <Text fw="bold">{contact.personName}</Text>
          )}
          {contact?.location && <Text size="sm">{contact.location}</Text>}
          <Text size="sm">
            Ordinační / provozní doba:{" "}
            {contact?.hours?.trim() || "Není nastavena"}
          </Text>
          <Group justify="space-between">
            <Text size="sm">Přímé číslo:</Text>
            <Text fw="bold">{contact?.phone?.trim() || "Není nastaveno"}</Text>
          </Group>
          <ContactButton
            contacts={contacts}
            contactId={entry.contactId}
            label="Zavolat"
            aria-label={`Zavolat – ${contact?.label ?? entry.title}`}
            color="gray"
            fullWidth
          />
          {contact?.sourceUrl && (
            <Anchor
              href={contact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              Zdroj kontaktu: oficiální web FN Ostrava
            </Anchor>
          )}
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}

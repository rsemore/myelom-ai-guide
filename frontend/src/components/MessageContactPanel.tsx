import { Card, Stack, Text } from "@mantine/core";

import type { Contacts } from "../types/contacts";

import { ContactButton } from "./ContactButton";

export type MessageContactPanelProps = {
  contacts: Contacts;
  contactId: string;
  title: string;
  urgent?: boolean;
};

export function MessageContactPanel({
  contacts,
  contactId,
  title,
  urgent = false,
}: MessageContactPanelProps) {
  return (
    <Card component="section" aria-label={title} withBorder>
      <Stack gap="xs">
        <Text size="sm">{title}</Text>
        <Text fw="bold">{contacts[contactId]?.label ?? contactId}</Text>
        {contacts[contactId]?.phone?.trim() && (
          <Text>{contacts[contactId]?.phone?.trim()}</Text>
        )}
        <ContactButton
          contacts={contacts}
          contactId={contactId}
          label="Zavolat"
          color={urgent ? "red" : "gray"}
          fullWidth
        />
      </Stack>
    </Card>
  );
}

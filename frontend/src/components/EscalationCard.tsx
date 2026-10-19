import { Alert, Stack } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { EscalationMessage } from "../types/chat";
import type { Contacts } from "../types/contacts";

import { ContactButton } from "./ContactButton";
import { MessageContactPanel } from "./MessageContactPanel";

export type EscalationCardProps = {
  message: EscalationMessage;
  contacts: Contacts;
  emergencyContactId: string;
};

export function EscalationCard({
  message,
  contacts,
  emergencyContactId,
}: EscalationCardProps) {
  return (
    <Stack>
      <Alert
        title="VYSOKÉ RIZIKO – OKAMŽITÁ AKCE"
        role="alert"
        color="red"
        icon={<IconAlertTriangle />}
      >
        {message.instruction}
      </Alert>
      <MessageContactPanel
        contacts={contacts}
        contactId={message.contactId}
        title="Odpovědné pracoviště"
        urgent
      />
      {message.call155 && message.contactId !== emergencyContactId && (
        <ContactButton
          contacts={contacts}
          contactId={emergencyContactId}
          fullWidth
        />
      )}
    </Stack>
  );
}

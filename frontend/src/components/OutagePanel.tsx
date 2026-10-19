import { Alert, Button, Group, Stack, Text } from "@mantine/core";
import { IconAntennaBarsOff, IconReload } from "@tabler/icons-react";

import type { Contacts } from "../types/contacts";

import { ContactButton } from "./ContactButton";

export type OutagePanelProps = {
  contacts: Contacts;
  receptionContactId: string;
  onRetry: () => void;
  pending: boolean;
};

export function OutagePanel({
  contacts,
  receptionContactId,
  onRetry,
  pending,
}: OutagePanelProps) {
  return (
    <Stack>
      <Alert
        title="Spojení s databází přerušeno"
        role="alert"
        icon={<IconAntennaBarsOff />}
      >
        <Text>
          Odpověď nelze ověřit vůči lékařským standardům oddělení. Z důvodu
          bezpečnosti neuvádíme neověřené informace.
        </Text>
        <Group>
          <Button
            onClick={onRetry}
            loading={pending}
            fullWidth
            leftSection={<IconReload />}
          >
            Zkusit znovu
          </Button>
          <ContactButton
            contacts={contacts}
            contactId={receptionContactId}
            label="Volat recepci hematologie"
          />
        </Group>
      </Alert>
    </Stack>
  );
}

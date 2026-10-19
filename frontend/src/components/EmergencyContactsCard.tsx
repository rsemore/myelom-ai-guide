import { Alert, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { Contacts } from "../types/contacts";

import { ContactButton } from "./ContactButton";

export type EmergencyContactsCardProps = {
  contacts: Contacts;
  contactIds: readonly string[];
};

export function EmergencyContactsCard({
  contacts,
  contactIds,
}: EmergencyContactsCardProps) {
  return (
    <Alert
      title="Život ohrožující stav"
      color="red"
      variant="filled"
      icon={<IconAlertTriangle />}
    >
      <Stack gap="sm">
        <Text>
          V případě ohrožení života, například při zástavě dechu, masivním
          krvácení nebo bezvědomí, volejte tísňovou linku.
        </Text>
        {[...new Set(contactIds)].map((contactId) => (
          <ContactButton
            key={contactId}
            contacts={contacts}
            contactId={contactId}
            color="gray"
            variant="default"
            fullWidth
          />
        ))}
      </Stack>
    </Alert>
  );
}

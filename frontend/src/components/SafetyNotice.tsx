import { Alert, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { Contacts } from "../types/contacts";

export type SafetyNoticeProps = {
  contacts: Contacts;
  emergencyContactIds: readonly string[];
};

export function SafetyNotice({
  contacts,
  emergencyContactIds,
}: SafetyNoticeProps) {
  const configuredContacts = [...new Set(emergencyContactIds)].map((id) => ({
    id,
    label: contacts[id]?.label ?? id,
    phone: contacts[id]?.phone?.trim(),
  }));
  const availableContacts = configuredContacts.filter(
    (contact) => contact.phone,
  );
  const missingContacts = configuredContacts.filter(
    (contact) => !contact.phone,
  );

  return (
    <Alert
      title="Asistent nenahrazuje lékaře."
      icon={<IconInfoCircle />}
      color="red"
    >
      <Stack>
        {availableContacts.length > 0 && (
          <Text>
            V akutním ohrožení volejte{" "}
            {availableContacts.map((contact, index) => (
              <Text component="span" key={contact.id}>
                {index > 0 && " nebo "}
                <Text component="strong" fw={700}>
                  {contact.phone}
                </Text>
              </Text>
            ))}
            .
          </Text>
        )}
        {missingContacts.map((contact) => (
          <Text key={contact.id} role="alert">
            {contact.label}: telefonní číslo není k dispozici.
          </Text>
        ))}
        {configuredContacts.length === 0 && (
          <Text role="alert">Tísňové kontakty nejsou nastaveny.</Text>
        )}
      </Stack>
    </Alert>
  );
}

import { Alert, Badge, Stack, Text, Title } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { Contacts } from "../types/contacts";

import { ContactDirectoryCard } from "../components/ContactDirectoryCard";
import { EmergencyContactsCard } from "../components/EmergencyContactsCard";
import { GpContactCard } from "../components/GpContactCard";
import { contactIds } from "../config/contacts";
import {
  clinicEntry,
  coordinatorEntry,
  gpEntry,
  urgentEntry,
} from "../data/contactDirectory";

export type ContactsPageProps = {
  contacts: Contacts;
};

export function ContactsPage({ contacts }: ContactsPageProps) {
  return (
    <Stack>
      <Badge variant="light">Telefonní rozcestník</Badge>
      <Title order={1}>Důležité kontakty oddělení</Title>
      <Text>
        Kdy a koho kontaktovat při péči o mnohočetný myelom. V případě
        pochybností kontaktujte svůj ošetřující tým.
      </Text>
      <Stack
        component="section"
        aria-label="Seznam pohotovostních a nemocničních kontaktů"
      >
        <EmergencyContactsCard
          contacts={contacts}
          contactIds={[contactIds.medicalHelp, contactIds.emergency]}
        />
        <Alert title="Kontakty FN Ostrava" icon={<IconInfoCircle />}>
          Kontakty Kliniky hematoonkologie převzaty z oficiálního webu FN
          Ostrava dne 17. 10. 2026. Dostupnost a ordinační doba se mohou změnit;
          aktuální údaje ověřte přes odkaz u kontaktu. Ambulantní linky ani
          informace o hospitalizovaných pacientech nejsou nepřetržitou
          pohotovostí. Při ohrožení života volejte 155 nebo 112. Kontakt na
          vlastního praktického lékaře je nutné doplnit individuálně.
        </Alert>
        <ContactDirectoryCard entry={coordinatorEntry} contacts={contacts} />
        <ContactDirectoryCard entry={clinicEntry} contacts={contacts} />
        <GpContactCard entry={gpEntry} contacts={contacts} />
        <ContactDirectoryCard entry={urgentEntry} contacts={contacts} />
      </Stack>
    </Stack>
  );
}

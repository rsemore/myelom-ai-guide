import { Button } from "@mantine/core";
import { IconId } from "@tabler/icons-react";
import { useId, useState } from "react";

import type { ContactDirectoryEntry, Contacts } from "../types/contacts";

import { ContactDirectoryCard } from "./ContactDirectoryCard";

export type GpContactCardProps = {
  entry: ContactDirectoryEntry;
  contacts: Contacts;
};

export function GpContactCard({ entry, contacts }: GpContactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  return (
    <ContactDirectoryCard
      entry={entry}
      contacts={contacts}
      hideContact={!expanded}
      contactDetailsId={detailsId}
    >
      <Button
        variant="default"
        leftSection={<IconId aria-hidden="true" size={20} />}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((current) => !current)}
        fullWidth
      >
        {expanded
          ? "Skrýt kontakt na praktika"
          : "Zobrazit kontakt na praktika"}
      </Button>
    </ContactDirectoryCard>
  );
}

import { Alert, Stack } from "@mantine/core";
import { IconHelpCircle } from "@tabler/icons-react";

import type { NoAnswerMessage } from "../types/chat";
import type { Contacts } from "../types/contacts";

import { MessageContactPanel } from "./MessageContactPanel";

export type NoAnswerCardProps = {
  message: NoAnswerMessage;
  contacts: Contacts;
};

export function NoAnswerCard({ message, contacts }: NoAnswerCardProps) {
  return (
    <Stack>
      <Alert title="Nenalezeno v materiálech" icon={<IconHelpCircle />}>
        K této otázce nemám ve schválených materiálech odpověď. Z důvodu
        bezpečnosti neuvádíme neověřené informace. Obraťte se na své ošetřující
        pracoviště.
      </Alert>
      <MessageContactPanel
        contacts={contacts}
        contactId={message.contactId}
        title="Doporučený kontakt"
      />
    </Stack>
  );
}

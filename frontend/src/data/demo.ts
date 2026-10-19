import type { Procedure } from "../components/ProcedureCard";
import type { ChatMessage } from "../types/chat";
import type { ChatConversation } from "../types/conversations";

import { contactIds } from "../config/contacts";
import { demoDocument } from "./documents";

export const demoProcedure: Procedure = {
  name: "Mnohočetný myelom – konzultace s hematologem",
  schedule: "za 3 dny (Pá 24. 5.)",
  location: "Hematologická ambulance – ukázka pracoviště",
};

export const demoMessages: ChatMessage[] = [
  {
    id: "question",
    createdAt: "2024-05-21T09:17:00+02:00",
    sender: "user",
    text: "Co si mám připravit na konzultaci kvůli mnohočetnému myelomu?",
  },
  {
    id: "answer",
    createdAt: "2024-05-21T09:18:00+02:00",
    sender: "assistant",
    kind: "answer",
    text: "Na konzultaci si připravte seznam užívaných léků, dostupné lékařské zprávy a otázky, které chcete s hematologem probrat.",
    risk: "low",
    citations: [
      {
        documentId: demoDocument.id,
        title: demoDocument.title,
        page: 4,
        version: demoDocument.version,
        quote:
          "Na konzultaci si připravte seznam užívaných léků, dostupné lékařské zprávy a otázky, které chcete s hematologem probrat.",
      },
    ],
  },
  {
    id: "medication-question",
    createdAt: "2024-05-21T09:19:00+02:00",
    sender: "user",
    text: "Mohu si kvůli únavě sám upravit dávku léčby myelomu?",
  },
  {
    id: "no-answer",
    createdAt: "2024-05-21T09:19:00+02:00",
    sender: "assistant",
    kind: "no_answer",
    contactId: contactIds.reception,
  },
  {
    id: "urgent-question",
    createdAt: "2024-05-21T09:20:00+02:00",
    sender: "user",
    text: "Léčím se s myelomem a mám náhle silnou dušnost a bolest na hrudi.",
  },
  {
    id: "escalation",
    createdAt: "2024-05-21T09:20:00+02:00",
    sender: "assistant",
    kind: "escalation",
    instruction:
      "Při náhlé silné dušnosti a bolesti na hrudi nečekejte na odpověď chatu. Vyhledejte okamžitou zdravotnickou pomoc.",
    contactId: contactIds.ward,
    call155: true,
  },
];

export const demoConversations: ChatConversation[] = [
  {
    id: "current-demo",
    title: "Konzultace s hematologem",
    updatedAt: "2024-05-21T09:20:00+02:00",
    messages: demoMessages,
    draft: "",
  },
  {
    id: "previous-demo",
    title: "Otázky k organizaci péče",
    updatedAt: "2024-05-20T14:10:00+02:00",
    draft: "",
    messages: [
      {
        id: "previous-question",
        createdAt: "2024-05-20T14:10:00+02:00",
        sender: "user",
        text: "Jak mohu změnit termín kontroly u hematologa?",
      },
      {
        id: "previous-response",
        createdAt: "2024-05-20T14:10:00+02:00",
        sender: "assistant",
        kind: "no_answer",
        contactId: contactIds.reception,
      },
    ],
  },
];

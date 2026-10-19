import type { SourceDocument } from "../types/documents";

export const demoDocument: SourceDocument = {
  id: "multiple-myeloma-guide",
  title: "Mnohočetný myelom – průvodce pacienta (ukázka)",
  code: "DEMO-MM-01",
  version: "3.1",
  guarantor: "Není přiřazen – demonstrační dokument",
  approvedAt: "Neschváleno – ukázkový obsah",
  organization: "Hematologická ambulance – ukázka pracoviště",
  totalPages: 8,
  pages: [
    {
      number: 4,
      chapter: "Kapitola 3.2",
      title: "Příprava na konzultaci s hematologem",
      sections: [
        {
          kind: "paragraph",
          text: "Tento demonstrační dokument ukazuje, jak bude chatový agent pracovat se zdroji k mnohočetnému myelomu. Nenahrazuje schválené materiály ani individuální doporučení hematologa.",
        },
        {
          kind: "paragraph",
          text: "V cílovém řešení agent vyhledá relevantní pasáže v dokumentech dostupných přes backendové API a u odpovědi uvede zdroj, verzi a stránku.",
        },
        {
          kind: "citation",
          text: "Na konzultaci si připravte seznam užívaných léků, dostupné lékařské zprávy a otázky, které chcete s hematologem probrat.",
          location: "Ukázková pasáž pro demonstraci citace, strana 4",
        },
        {
          kind: "paragraph",
          text: "Dotazy na změnu léčby nebo dávkování musí posoudit ošetřující tým. Ukázka neobsahuje personalizovaný léčebný plán.",
        },
      ],
      endNote:
        "Konec ukázkové kapitoly. Skutečné dokumenty a jejich obsah budou dostupné až po připojení backendu.",
    },
  ],
};

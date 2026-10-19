import type { AuditRecord, ReviewItem } from "../types/dashboard";

export const reviewItems: readonly ReviewItem[] = [
  {
    id: "Q-001",
    time: "14:10",
    procedure: "Mnohočetný myelom – léčba",
    context: "Termín za 2 dny (amb. 3)",
    question: "Mohu kvůli únavě změnit dávkování své léčby?",
    reason: "Vyžaduje individuální posouzení ošetřujícím hematologem",
  },
  {
    id: "Q-002",
    time: "13:25",
    procedure: "Hematologická kontrola",
    context: "Termín: zítra ráno 08:30",
    question: "Mohu při své léčbě užívat nový doplněk stravy?",
    reason: "Možné interakce nejsou popsány v ukázkových dokumentech",
  },
  {
    id: "Q-003",
    time: "11:05",
    procedure: "Konzultace k myelomu",
    context: "Termín za 4 dny",
    question: "Mohu posunout příští termín léčby?",
    reason: "Změna léčebného plánu vyžaduje rozhodnutí pracoviště",
  },
];

export const auditRecords: readonly AuditRecord[] = [
  {
    id: "CNV-9821",
    time: "14:22",
    question: "Co si připravit na konzultaci s hematologem?",
    response:
      "Připravte si seznam léků, dostupné lékařské zprávy a otázky pro hematologa.",
    source: "Mnohočetný myelom – průvodce pacienta (ukázka) v3.1",
    reference: "Kapitola 3.2, strana 4 (demonstrační citace)",
    critical: false,
    validation: "Ověřeno protokolem (ukázkový stav)",
  },
  {
    id: "CNV-9818",
    time: "14:05",
    question:
      "Léčím se s myelomem a mám náhle silnou dušnost a bolest na hrudi.",
    response:
      "Ukázka urgentní eskalace: doporučení okamžitého kontaktu se zdravotníkem. Automatické volání personálu ani záchranné služby není připojeno.",
    source: "Kritický algoritmus eskalace v1.0",
    reference: "Ukázka předání akutních obtíží zdravotníkovi",
    critical: true,
    validation: "Vyřešeno lékařem (ukázkový stav)",
  },
  {
    id: "CNV-9804",
    time: "13:48",
    question: "Mohu si kvůli únavě sám upravit dávku léčby myelomu?",
    response:
      "K individuální úpravě léčby nemám odpověď v dostupných materiálech. Kontaktujte ošetřujícího hematologa.",
    source: "Bez zdrojové odpovědi",
    reference: "Předáno k individuálnímu posouzení",
    critical: false,
    validation: "Vyžaduje hematologa (ukázkový stav)",
  },
];

export function auditCsv(records: readonly AuditRecord[]): string {
  const rows = [
    [
      "ID",
      "Čas",
      "Dotaz",
      "Odpověď",
      "Zdroj",
      "Reference",
      "Riziko",
      "Validace",
    ],
    ...records.map((record) => [
      record.id,
      record.time,
      record.question,
      record.response,
      record.source,
      record.reference,
      record.critical ? "Kritické" : "Nízké",
      record.validation,
    ]),
  ];
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const safe = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(";"),
      )
      .join("\r\n")
  );
}

import type { ContactDirectoryEntry } from "../types/contacts";

import { contactIds } from "../config/contacts";

export const coordinatorEntry: ContactDirectoryEntry = {
  contactId: contactIds.coordinator,
  title: "Myelomová ambulance FN Ostrava",
  category: "Klinika hematoonkologie",
  guidance:
    "Dotazy k péči v myelomové ambulanci. Při zdravotních obtížích se řiďte individuálními pokyny svého ošetřujícího týmu.",
};

export const clinicEntry: ContactDirectoryEntry = {
  contactId: contactIds.clinic,
  title: "Recepce hematologických ambulancí FN Ostrava",
  category: "Recepce ambulance",
  guidance:
    "Objednání nebo změna termínu hematologické kontroly, dotazy k dostupným zprávám a organizaci léčby.",
};

export const gpEntry: ContactDirectoryEntry = {
  contactId: contactIds.gp,
  title: "Váš praktický lékař",
  category: "Osobní medikace",
  guidance:
    "Úprava chronické medikace (např. léky na ředění krve, inzulín a kompenzace diabetu).",
  note: "Změny léčby mnohočetného myelomu konzultujte s ošetřujícím hematologem. Léky neupravujte podle odpovědi chatu.",
};

export const urgentEntry: ContactDirectoryEntry = {
  contactId: contactIds.inpatient,
  title: "Informace o hospitalizovaných pacientech",
  category: "Klinika hematoonkologie FN Ostrava",
  guidance:
    "Informace o pacientech hospitalizovaných na Klinice hematoonkologie ve zveřejněném čase. Nejde o pohotovost ani tísňovou linku.",
};

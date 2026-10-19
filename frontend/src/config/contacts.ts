import type { Contacts } from "../types/contacts";

export const contactIds = {
  medicalHelp: "medical-help",
  emergency: "emergency",
  reception: "hematology-reception",
  ward: "on-call-ward",
  coordinator: "care-coordinator",
  clinic: "hematology-clinic",
  gp: "general-practitioner",
  inpatient: "inpatient-information",
} as const;

export const contacts: Contacts = {
  [contactIds.medicalHelp]: {
    id: contactIds.medicalHelp,
    label: "Zdravotnická záchranná služba",
    phone: "155",
  },
  [contactIds.emergency]: {
    id: contactIds.emergency,
    label: "Tísňová linka",
    phone: "112",
  },
  [contactIds.reception]: {
    id: contactIds.reception,
    label: "Recepce hematologie",
    phone: import.meta.env.VITE_RECEPTION_PHONE,
    ...(!import.meta.env.VITE_RECEPTION_PHONE && {
      phone: "+420 597 372 754",
      hours: "Objednávání nejlépe 13:00–15:00; provoz Po–Pá 7:00–15:30",
      sourceUrl: "https://www.fno.cz/klinika-hematoonkologie/objednavani",
    }),
  },
  [contactIds.ward]: {
    id: contactIds.ward,
    label: "Službu konající lékař / Urgentní příjem oddělení",
    phone: import.meta.env.VITE_WARD_PHONE,
    hours: import.meta.env.VITE_WARD_HOURS,
  },
  [contactIds.inpatient]: {
    id: contactIds.inpatient,
    label: "Informace o hospitalizovaných pacientech – FN Ostrava",
    phone: "+420 553 048 832",
    hours: "Po–Ne 12:00–15:00 (informace o hospitalizovaných pacientech)",
    sourceUrl: "https://www.fno.cz/klinika-hematoonkologie/kontaktni-udaje",
  },
  [contactIds.coordinator]: {
    id: contactIds.coordinator,
    label: "Myelomová ambulance – FN Ostrava",
    phone: import.meta.env.VITE_COORDINATOR_PHONE || "+420 704 960 513",
    hours:
      import.meta.env.VITE_COORDINATOR_HOURS ||
      (import.meta.env.VITE_COORDINATOR_PHONE
        ? undefined
        : "7:00–15:00 (zveřejněné ordinační hodiny)"),
    ...(!import.meta.env.VITE_COORDINATOR_PHONE && {
      sourceUrl: "https://www.fno.cz/klinika-hematoonkologie/ambulance",
      location: "Budova T, 3. patro – hematologické ambulance",
    }),
  },
  [contactIds.clinic]: {
    id: contactIds.clinic,
    label: "Recepce hematologických ambulancí – FN Ostrava",
    phone: import.meta.env.VITE_CLINIC_PHONE || "+420 597 372 754",
    hours:
      import.meta.env.VITE_CLINIC_HOURS ||
      (import.meta.env.VITE_CLINIC_PHONE
        ? undefined
        : "Objednávání 13:00–15:00; ambulance Po–Pá 7:30–13:45"),
    ...(!import.meta.env.VITE_CLINIC_PHONE && {
      sourceUrl: "https://www.fno.cz/klinika-hematoonkologie/ambulance",
      location: "Budova T, 3. patro",
    }),
  },
  [contactIds.gp]: {
    id: contactIds.gp,
    label: "Váš praktický lékař",
    personName: import.meta.env.VITE_GP_NAME,
    phone: import.meta.env.VITE_GP_PHONE,
    hours: import.meta.env.VITE_GP_HOURS,
  },
};

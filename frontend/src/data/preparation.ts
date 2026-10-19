import type {
  PreparationPhase,
  PreparationProfile,
} from "../types/preparation";

export const procedureOptions = [
  { value: "hematology-consultation", label: "Konzultace s hematologem" },
  { value: "treatment-visit", label: "Návštěva v rámci léčby myelomu" },
  { value: "follow-up", label: "Kontrola mnohočetného myelomu" },
];

export const initialPreparationProfile: PreparationProfile = {
  procedureId: "hematology-consultation",
  scheduledAt: "2024-05-24T09:00",
  location: "Hematologická ambulance – ukázka pracoviště",
};

export const initialCompletedSteps = ["reports", "medication-list"];

function calendarDate(date: Date, days: number, hour = 0): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    hour,
  );
}

export function createDemoPreparationPlan(
  profile: PreparationProfile,
): PreparationPhase[] {
  if (
    !procedureOptions.some((option) => option.value === profile.procedureId)
  ) {
    throw new Error("Neznámý typ návštěvy.");
  }
  const appointment = new Date(profile.scheduledAt);
  if (!Number.isFinite(appointment.getTime())) {
    throw new Error("Datum a čas návštěvy nejsou platné.");
  }
  if (profile.procedureId !== "hematology-consultation") return [];

  return [
    {
      id: "three-days",
      title: "Před konzultací",
      date: calendarDate(appointment, -3).toISOString(),
      steps: [
        {
          id: "reports",
          label: "Připravit dostupné lékařské zprávy k mnohočetnému myelomu",
        },
        {
          id: "medication-list",
          label: "Sepsat aktuálně užívané léky a doplňky",
        },
      ],
    },
    {
      id: "previous-day",
      title: "Den před návštěvou",
      date: calendarDate(appointment, -1).toISOString(),
      steps: [
        {
          id: "questions",
          label: "Sepsat otázky k onemocnění a léčbě pro hematologa",
        },
        {
          id: "symptoms",
          label: "Poznamenat změny obtíží, které chcete při konzultaci probrat",
        },
        {
          id: "appointment",
          label: "Ověřit termín, místo a individuální pokyny pracoviště",
        },
      ],
    },
    {
      id: "procedure-day",
      title: "Den návštěvy",
      date: calendarDate(appointment, 0).toISOString(),
      steps: [
        {
          id: "documents",
          label: "Vzít doklady, seznam léků a připravené zprávy",
        },
        {
          id: "discussion",
          label: "Vzít seznam otázek a poznámek ke konzultaci",
        },
        {
          id: "arrival",
          scheduledAt: appointment.toISOString(),
          label: "Plánovaná konzultace s hematologem (ukázkový termín)",
        },
      ],
    },
  ];
}

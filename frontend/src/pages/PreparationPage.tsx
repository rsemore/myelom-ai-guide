import {
  Alert,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconInfoCircle, IconSettings } from "@tabler/icons-react";
import { useState } from "react";

import type { PreparationProfile } from "../types/preparation";

import { PreparationForm } from "../components/PreparationForm";
import { PreparationPhaseCard } from "../components/PreparationPhaseCard";
import {
  createDemoPreparationPlan,
  initialCompletedSteps,
  initialPreparationProfile,
} from "../data/preparation";

export function PreparationPage() {
  const [profile, setProfile] = useState(initialPreparationProfile);
  const [completedIds, setCompletedIds] = useState(initialCompletedSteps);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const phases = createDemoPreparationPlan(profile);
  const steps = phases.flatMap((phase) => phase.steps);
  const completed = steps.filter((step) =>
    completedIds.includes(step.id),
  ).length;
  const percent = steps.length
    ? Math.round((completed / steps.length) * 100)
    : 0;

  function save(next: PreparationProfile) {
    setProfile(next);
    if (
      next.procedureId !== profile.procedureId ||
      next.scheduledAt !== profile.scheduledAt
    ) {
      setCompletedIds([]);
    }
    setSaved(true);
    setDirty(false);
  }

  return (
    <Stack>
      <Title order={1}>Příprava / Kontext</Title>
      <Alert
        title="Mnohočetný myelom – příprava na návštěvu"
        icon={<IconSettings />}
      >
        Organizační checklist pro konzultaci, nikoli léčebný plán nebo ověřené
        lékařské pokyny. Přepočet mění pouze ukázkový harmonogram, ne odpovědi v
        chatu ani termín v nemocnici. Údaje se ukládají jen do paměti aplikace.
      </Alert>
      <PreparationForm
        initialProfile={profile}
        onSave={save}
        onEdit={() => {
          setSaved(false);
          setDirty(true);
        }}
      />
      {dirty && (
        <Alert title="Neuložené změny">
          Zobrazený plán stále odpovídá naposledy uloženým údajům. Změny
          potvrďte tlačítkem Uložit a přepočítat plán.
        </Alert>
      )}
      {saved && (
        <Text role="status">
          Údaje byly uloženy v ukázce.
          {phases.length > 0 && " Ukázkový harmonogram byl přepočítán."}
        </Text>
      )}
      {phases.length > 0 ? (
        <>
          <Card>
            <Stack gap="xs">
              <Text>Aktuální stav přípravy</Text>
              <Text role="status">
                Splněno {completed} z {steps.length} kroků ({percent} %)
              </Text>
              <Progress value={percent} aria-label="Průběh přípravy" />
            </Stack>
          </Card>
          <Group justify="space-between">
            <Title order={2}>Časový harmonogram přípravných kroků</Title>
            <Text>{phases.length} fáze</Text>
          </Group>
          {phases.map((phase, index) => (
            <PreparationPhaseCard
              key={phase.id}
              phase={phase}
              index={index}
              completedIds={completedIds}
              onStepChange={(id, checked) =>
                setCompletedIds((current) =>
                  checked
                    ? [...current.filter((item) => item !== id), id]
                    : current.filter((item) => item !== id),
                )
              }
            />
          ))}
        </>
      ) : (
        <Alert title="Plán není k dispozici">
          Pro tento typ návštěvy nejsou v ukázce pokyny. Vyžádejte si
          individuální plán od svého pracoviště.
        </Alert>
      )}
      <Alert title="Odškrtávání kroků" icon={<IconInfoCircle />}>
        Položky můžete označovat jako splněné. Změna typu návštěvy nebo termínu
        vynuluje splněné kroky. Automatické notifikace nejsou připojeny.
      </Alert>
    </Stack>
  );
}

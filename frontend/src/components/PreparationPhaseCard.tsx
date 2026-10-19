import {
  Badge,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import type { PreparationPhase } from "../types/preparation";

export type PreparationPhaseCardProps = {
  phase: PreparationPhase;
  index: number;
  completedIds: readonly string[];
  onStepChange: (id: string, checked: boolean) => void;
};

const dayFormat = new Intl.DateTimeFormat("cs-CZ", {
  weekday: "long",
  day: "numeric",
  month: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function PreparationPhaseCard({
  phase,
  index,
  completedIds,
  onStepChange,
}: PreparationPhaseCardProps) {
  return (
    <Card component="section" aria-labelledby={`phase-${phase.id}`}>
      <Stack>
        <Group>
          <Badge variant="light">{index + 1}. fáze</Badge>
          <Title order={3} id={`phase-${phase.id}`}>
            {phase.title} ({dayFormat.format(new Date(phase.date))})
          </Title>
        </Group>
        {phase.steps.map((step) => (
          <Checkbox
            key={step.id}
            checked={completedIds.includes(step.id)}
            onChange={(event) =>
              onStepChange(step.id, event.currentTarget.checked)
            }
            label={
              <Stack gap={0}>
                {step.scheduledAt && (
                  <Text component="time" dateTime={step.scheduledAt} fw="bold">
                    {timeFormat.format(new Date(step.scheduledAt))}
                  </Text>
                )}
                <Text component="span">{step.label}</Text>
              </Stack>
            }
          />
        ))}
      </Stack>
    </Card>
  );
}

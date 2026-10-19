import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconCalendarWeek, IconPencil } from "@tabler/icons-react";

export type Procedure = {
  name: string;
  schedule: string;
  location: string;
};

export type ProcedureCardProps = {
  procedure: Procedure;
  onChange: () => void;
};

export function ProcedureCard({ procedure, onChange }: ProcedureCardProps) {
  return (
    <Card>
      <Group justify="space-between">
        <Group>
          <IconCalendarWeek />
          <Stack gap="0">
            <Text fw="bold">
              Péče: {procedure.name} · {procedure.schedule}
            </Text>
            <Text c="dimmed">{procedure.location}</Text>
          </Stack>
        </Group>

        <Button
          onClick={onChange}
          aria-label="Změnit plánovanou návštěvu"
          leftSection={<IconPencil />}
        >
          Změnit
        </Button>
      </Group>
    </Card>
  );
}

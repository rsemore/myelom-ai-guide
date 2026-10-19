import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";

import type { ReviewItem } from "../types/dashboard";

export type ReviewQueueProps = {
  items: readonly ReviewItem[];
  resolvedIds: readonly string[];
  onReview: (item: ReviewItem) => void;
};

export function ReviewQueue({
  items,
  resolvedIds,
  onReview,
}: ReviewQueueProps) {
  return (
    <Card withBorder bg="white">
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Nezodpovězené dotazy k revizi</Title>
          <Badge variant="light">
            Čeká k vyřízení:{" "}
            {items.filter((item) => !resolvedIds.includes(item.id)).length}
          </Badge>
        </Group>
        <Text size="sm">Ukázková fronta k manuálnímu posouzení.</Text>
        <Table.ScrollContainer minWidth={1000}>
          <Table striped highlightOnHover captionSide="top">
            <Table.Caption>Dotazy pacientů – demonstrační data</Table.Caption>
            <Table.Thead>
              <Table.Tr>
                {[
                  "Čas",
                  "Výkon / Kontext",
                  "Dotaz pacienta",
                  "Důvod nezodpovězení",
                  "Akce",
                ].map((label) => (
                  <Table.Th key={label}>{label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.time}</Table.Td>
                  <Table.Td>
                    <Text>{item.procedure}</Text>
                    <Text size="sm">{item.context}</Text>
                  </Table.Td>
                  <Table.Td>{item.question}</Table.Td>
                  <Table.Td>{item.reason}</Table.Td>
                  <Table.Td>
                    {resolvedIds.includes(item.id) ? (
                      <Badge variant="light">Vyřešeno v ukázce</Badge>
                    ) : (
                      <Button
                        onClick={() => onReview(item)}
                        aria-label={`Prověřit dotaz ${item.id}`}
                      >
                        Prověřit a kontaktovat
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Card>
  );
}

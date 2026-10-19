import { Badge, Card, Stack, Table, Text, Title } from "@mantine/core";

import type { AuditRecord } from "../types/dashboard";

export function AuditLogTable({
  records,
}: {
  records: readonly AuditRecord[];
}) {
  return (
    <Card withBorder bg="white">
      <Stack>
        <Title order={2}>Log nedávných konverzací a citací</Title>
        <Text size="sm">
          Zobrazeno {records.length} ukázkových záznamů. Další relace nejsou
          připojeny.
        </Text>
        <Table.ScrollContainer minWidth={1100}>
          <Table striped highlightOnHover>
            <Table.Caption>
              Ukázkový auditní log – nikoli produkční auditní stopa
            </Table.Caption>
            <Table.Thead>
              <Table.Tr>
                {[
                  "ID záznamu",
                  "Čas",
                  "Dotaz a odpověď",
                  "Zdrojový dokument",
                  "Úroveň rizika",
                  "Stav validace",
                ].map((label) => (
                  <Table.Th key={label}>{label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((record) => (
                <Table.Tr
                  key={record.id}
                  bg={record.critical ? "red.1" : undefined}
                  c={record.critical ? "red.8" : undefined}
                >
                  <Table.Td>{record.id}</Table.Td>
                  <Table.Td>{record.time}</Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Text fw="bold">Dotaz: {record.question}</Text>
                      <Text size="sm">Odpověď: {record.response}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text>{record.source}</Text>
                    <Text size="sm">{record.reference}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={record.critical ? "red" : undefined}
                      variant="light"
                    >
                      {record.critical ? "KRITICKÉ – ESK." : "Nízké riziko"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{record.validation}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Card>
  );
}

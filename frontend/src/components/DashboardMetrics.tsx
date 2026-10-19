import { Card, SimpleGrid, Stack, Text } from "@mantine/core";

const metrics = [
  {
    label: "Celkem konverzací",
    value: "342",
    detail: "+12 % oproti včerejšku",
  },
  {
    label: "Odpovězeno ze zdrojů",
    value: "318",
    detail: "93,0 % – ukázková metrika",
  },
  {
    label: "Nezodpovězené dotazy",
    value: "19",
    detail: "Vyžaduje revizi lékařem / FAQ",
  },
  { label: "Akutní eskalace", value: "5", detail: "Ukázkový souhrn incidentů" },
];

export function DashboardMetrics() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      {metrics.map((metric, index) => (
        <Card
          key={metric.label}
          withBorder
          bg={index === 3 ? "red.1" : "white"}
        >
          <Stack gap="xs">
            <Text c={index === 3 ? "red" : undefined}>{metric.label}</Text>
            <Text size="xl" fw="bold">
              {metric.value}
            </Text>
            <Text size="sm">{metric.detail}</Text>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}

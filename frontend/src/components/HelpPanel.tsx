import { Stack, Text, Title } from "@mantine/core";

export function HelpPanel() {
  return (
    <Stack gap="md">
      <Title order={2}>Jak vám mohu pomoci?</Title>
      <Stack gap="xs">
        <Text fw={600}>Napište svou otázku</Text>
        <Text size="sm">
          Ptejte se na mnohočetný myelom, dostupné materiály nebo organizaci
          péče. Individuální léčbu a dávkování řešte s hematologem.
        </Text>
      </Stack>
      <Stack gap="xs">
        <Text fw={600}>Prohlédněte si zdroje</Text>
        <Text size="sm">
          U odpovědi otevřete zdrojový dokument a přečtěte si citovanou pasáž.
          Po připojení backendového API bude agent vyhledávat v dokumentech.
          Nyní jsou odpovědi i citace pouze demonstrační.
        </Text>
      </Stack>
      <Stack gap="xs">
        <Text fw={600}>Vraťte se k předchozímu chatu</Text>
        <Text size="sm">
          Historie konverzací uchová chaty a rozepsané dotazy do obnovení
          stránky. Nový chat začne prázdnou konverzaci. Do ukázky nevkládejte
          osobní ani skutečné zdravotní údaje.
        </Text>
      </Stack>
      <Stack gap="xs">
        <Text fw={600}>Upravte podrobnost odpovědí</Text>
        <Text size="sm">
          V Nastavení chatu zvolte Jednoduše nebo Podrobně. Volba se předává s
          novým dotazem; již zobrazené odpovědi se nemění.
        </Text>
      </Stack>
    </Stack>
  );
}

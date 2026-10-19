import type { ReactNode } from "react";

import {
  AppShell,
  Badge,
  Burger,
  Group,
  NativeSelect,
  NavLink,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconHospital } from "@tabler/icons-react";

import type { DashboardSection } from "../types/dashboard";

export type DoctorAppShellProps = {
  children: ReactNode;
  section: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onOpenPatient?: () => void;
};

const sections: { value: DashboardSection; label: string }[] = [
  { value: "overview", label: "Přehled a eskalace" },
  { value: "registration", label: "Registrace pacientů" },
  { value: "unanswered", label: "Nezodpovězené dotazy" },
  { value: "logs", label: "Log konverzací" },
  { value: "documents", label: "Správa zdrojových dokumentů" },
  { value: "safety", label: "Nastavení limitů bezpečnosti" },
];

export function DoctorAppShell({
  children,
  section,
  onSectionChange,
  onOpenPatient,
}: DoctorAppShellProps) {
  const [opened, { toggle, close }] = useDisclosure();
  return (
    <AppShell
      header={{ height: { base: 120, sm: 80 } }}
      navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              aria-label="Navigace personálu"
            />
            <IconHospital aria-hidden="true" />
            <Stack gap={0}>
              <Text fw="bold">Nemocniční asistent</Text>
              <Text size="sm">Portál zdravotnického personálu</Text>
            </Stack>
          </Group>
          <Group>
            <NativeSelect
              aria-label="Oddělení"
              data={["Hematologie – mnohočetný myelom"]}
              disabled
            />
            <Badge variant="light">
              {section === "registration"
                ? "Registrace přes API"
                : "Offline ukázka"}
            </Badge>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Stack gap="xs" component="nav" aria-label="Administrace a audit">
            <Text size="sm">Administrace a audit</Text>
            {sections.map((item) => (
              <NavLink
                key={item.value}
                component="button"
                type="button"
                label={item.label}
                active={section === item.value}
                aria-current={section === item.value ? "page" : undefined}
                onClick={() => {
                  onSectionChange(item.value);
                  close();
                }}
              />
            ))}
          </Stack>
          <Stack gap="xs">
            <Text size="sm">Demo bez přihlášeného uživatele</Text>
            <NavLink
              component="a"
              href="/"
              onClick={
                onOpenPatient
                  ? (event) => {
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        event.preventDefault();
                        onOpenPatient();
                      }
                    }
                  : undefined
              }
              label="Otevřít pacientskou aplikaci"
            />
          </Stack>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

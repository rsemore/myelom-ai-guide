import type { ReactNode } from "react";

import { AppShell, Box, Container } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";

import { AppHeader } from "./AppHeader";
import {
  BottomNavigation,
  type BottomNavigationProps,
} from "./BottomNavigation";

export type MobileAppShellProps = BottomNavigationProps & {
  children: ReactNode;
};

export function MobileAppShell({
  children,
  activeSection,
  onNavigate,
}: MobileAppShellProps) {
  const { ref, height } = useElementSize();

  return (
    <AppShell
      padding={0}
      header={{ height }}
      footer={{ height: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
    >
      <AppShell.Header>
        <Box ref={ref}>
          <AppHeader onLogout={() => onNavigate("messages")} />
        </Box>
      </AppShell.Header>
      <AppShell.Main>
        <Container p="md">{children}</Container>
      </AppShell.Main>
      <AppShell.Footer pb="env(safe-area-inset-bottom, 0px)">
        <BottomNavigation
          activeSection={activeSection}
          onNavigate={onNavigate}
        />
      </AppShell.Footer>
    </AppShell>
  );
}

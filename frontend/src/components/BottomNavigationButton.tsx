import type { ReactNode } from "react";

import { Box, Button, Stack, Text } from "@mantine/core";

export type BottomNavigationButtonProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

export function BottomNavigationButton({
  icon,
  label,
  active,
  onClick,
}: BottomNavigationButtonProps) {
  return (
    <Button
      type="button"
      h={56}
      px="xs"
      variant={active ? "filled" : "subtle"}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Stack component="span" align="center" gap={0}>
        <Box component="span" aria-hidden="true" h={24}>
          {icon}
        </Box>
        <Text component="span" size="xs">
          {label}
        </Text>
      </Stack>
    </Button>
  );
}

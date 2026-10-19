import { Alert, Box, Button, Loader, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

import { ChatHistory, type ChatHistoryProps } from "../components/ChatHistory";

export type ChatHistoryPageProps = ChatHistoryProps & {
  onBack?: () => void;
  pending?: boolean;
  error?: Error | null;
  onReload?: () => void;
};

export function ChatHistoryPage({
  onBack,
  pending,
  error,
  onReload,
  ...props
}: ChatHistoryPageProps) {
  return (
    <Stack>
      {onBack && (
        <Box
          pos="sticky"
          top="var(--app-shell-header-height, 0px)"
          bg="var(--mantine-color-body)"
          py="xs"
          style={{ zIndex: 100 }}
        >
          <Button
            variant="default"
            leftSection={<IconArrowLeft aria-hidden="true" size={20} />}
            onClick={onBack}
            fullWidth
          >
            Zpět na konverzaci
          </Button>
        </Box>
      )}
      <Title order={1}>Předchozí chaty</Title>
      <Text size="sm" c="dimmed">
        Konverzace jsou načtené ze serveru pro zadaný e-mail. Rozepsané dotazy
        zůstávají pouze v paměti této stránky.
      </Text>
      {onReload && (
        <Button variant="default" onClick={onReload} loading={pending}>
          Obnovit historii
        </Button>
      )}
      {pending && (
        <Stack role="status">
          <Loader />
          <Text>Načítám historii chatů...</Text>
        </Stack>
      )}
      {error && (
        <Alert title="Historii se nepodařilo načíst" role="alert">
          {error.message}
        </Alert>
      )}
      {((!pending && !error) || props.conversations.length > 0) && (
        <ChatHistory {...props} />
      )}
    </Stack>
  );
}

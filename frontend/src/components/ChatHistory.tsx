import { Badge, Button, Card, Group, Stack, Text } from "@mantine/core";

import type { ChatConversationSummary } from "../types/conversations";

export type ChatHistoryProps = {
  conversations: readonly ChatConversationSummary[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
};

const dateFormat = new Intl.DateTimeFormat("cs-CZ", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ChatHistory({
  conversations,
  activeConversationId,
  onSelect,
}: ChatHistoryProps) {
  return (
    <Stack component="section" aria-label="Historie chatů">
      {conversations.length === 0 && (
        <Text>Zatím nemáte žádné konverzace.</Text>
      )}
      {conversations.map((conversation) => (
        <Card key={conversation.id}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text
                size="sm"
                component="time"
                dateTime={conversation.updatedAt}
              >
                {dateFormat.format(new Date(conversation.updatedAt))}
              </Text>
              {conversation.id === activeConversationId && (
                <Badge variant="light">Aktuální chat</Badge>
              )}
            </Group>
            <Button
              variant={
                conversation.id === activeConversationId ? "filled" : "default"
              }
              aria-current={
                conversation.id === activeConversationId ? "true" : undefined
              }
              onClick={() => onSelect(conversation.id)}
              fullWidth
              h="auto"
              mih={44}
              py="xs"
            >
              {conversation.title}
            </Button>
            {conversation.messageCount !== undefined && (
              <Text size="xs" c="dimmed">
                Počet zpráv: {conversation.messageCount}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

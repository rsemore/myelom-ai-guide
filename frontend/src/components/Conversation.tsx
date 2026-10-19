import { Badge, Box, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { IconRobot, IconRosetteDiscountCheck } from "@tabler/icons-react";
import { useEffect, useRef } from "react";

import type { ChatMessage } from "../types/chat";

import { MessageCard, type MessageCardProps } from "./MessageCard";

export type ConversationProps = Omit<MessageCardProps, "message"> & {
  messages: readonly ChatMessage[];
  pending: boolean;
  messagesBeforeSend?: ReadonlySet<string> | null;
  composerHeight?: number;
};

export function Conversation({
  messages,
  pending,
  messagesBeforeSend,
  composerHeight = 112,
  ...props
}: ConversationProps) {
  const loadingRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const completedSend = useRef<ReadonlySet<string> | null>(null);
  const newMessages = messagesBeforeSend
    ? messages.filter(({ id }) => !messagesBeforeSend.has(id))
    : [];
  const answer = newMessages.find((message) => message.sender === "assistant");
  const hasQuestion = newMessages.some((message) => message.sender === "user");

  useEffect(() => {
    if (!messagesBeforeSend || completedSend.current === messagesBeforeSend)
      return;
    const target = answer
      ? answerRef.current
      : pending && hasQuestion
        ? loadingRef.current
        : null;
    if (!target) return;
    const frame = requestAnimationFrame(() => {
      // Hidden chat/history views must retain their own scroll position.
      if (target.getClientRects().length === 0) return;
      target.scrollIntoView({
        block: answer ? "start" : "end",
        behavior: "smooth",
      });
      if (answer) completedSend.current = messagesBeforeSend;
    });
    return () => cancelAnimationFrame(frame);
  }, [answer, hasQuestion, pending, messagesBeforeSend, composerHeight]);

  return (
    <Stack
      role="log"
      aria-label="Konverzace"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.length === 0 && (
        <Card maw="96%">
          <Stack>
            <Group gap="xs">
              <IconRobot />
              <Text fw="bold">Nemocniční asistent</Text>
            </Group>
            <Text>
              Na co se chcete zeptat ohledně mnohočetného myelomu? Napište dotaz
              nebo vyberte některou z otázek níže.
            </Text>
            <Badge
              variant="light"
              leftSection={<IconRosetteDiscountCheck size={18} />}
            >
              Ukázka: odpovědi s citacemi dokumentů
            </Badge>
          </Stack>
        </Card>
      )}
      {messages.map((message) => (
        <Box
          key={message.id}
          id={`answer-${message.id}`}
          ref={message.id === answer?.id ? answerRef : undefined}
          style={{
            scrollMarginTop: "calc(var(--app-shell-header-height, 0px) + 16px)",
          }}
        >
          <MessageCard message={message} {...props} />
        </Box>
      ))}
      {pending && (
        <Group
          role="status"
          ref={loadingRef}
          style={{
            scrollMarginBottom: `calc(var(--app-shell-footer-height, 72px) + ${composerHeight}px + 16px)`,
          }}
        >
          <Loader />
          <Text>Hledám ve schválených materiálech nemocnice...</Text>
        </Group>
      )}
    </Stack>
  );
}

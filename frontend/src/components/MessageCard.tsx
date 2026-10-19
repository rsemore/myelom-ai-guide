import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { IconRobot } from "@tabler/icons-react";

import type { AssistantMessage, ChatMessage } from "../types/chat";
import type { Contacts } from "../types/contacts";

import { AnswerCard, type AnswerCardProps } from "./AnswerCard";
import { EscalationCard } from "./EscalationCard";
import { NoAnswerCard } from "./NoAnswerCard";

export type MessageCardProps = {
  message: ChatMessage;
  contacts: Contacts;
  emergencyContactId: string;
  onFeedback: AnswerCardProps["onFeedback"];
  onOpenSource?: AnswerCardProps["onOpenSource"];
};

function assertNever(message: never): never {
  throw new Error(`Unsupported assistant message: ${JSON.stringify(message)}`);
}

function AssistantContent({
  message,
  contacts,
  emergencyContactId,
  onFeedback,
  onOpenSource,
}: Omit<MessageCardProps, "message"> & { message: AssistantMessage }) {
  switch (message.kind) {
    case "answer":
      return (
        <AnswerCard
          message={message}
          onFeedback={onFeedback}
          onOpenSource={onOpenSource}
        />
      );
    case "no_answer":
      return <NoAnswerCard message={message} contacts={contacts} />;
    case "escalation":
      return (
        <EscalationCard
          message={message}
          contacts={contacts}
          emergencyContactId={emergencyContactId}
        />
      );
    default:
      return assertNever(message);
  }
}

const timeFormat = new Intl.DateTimeFormat("cs-CZ", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Prague",
});

const statusLabels: Record<AssistantMessage["kind"], string> = {
  answer: "Standardní odpověď",
  no_answer: "Vyžaduje lékaře",
  escalation: "Urgentní eskalace",
};

export function MessageCard({ message, ...props }: MessageCardProps) {
  return (
    <Group justify={message.sender === "user" ? "flex-end" : "flex-start"}>
      <Card
        maw={message.sender === "user" ? "90%" : "96%"}
        miw={0}
        c={message.sender === "user" ? "white" : undefined}
        styles={{
          root: {
            borderInlineStart: `4px solid var(--mantine-color-${
              message.sender === "assistant" && message.kind === "escalation"
                ? "red-6"
                : "gray-7"
            })`,
          },
        }}
        bg={
          message.sender === "user"
            ? "gray.8"
            : message.kind === "escalation"
              ? "red.1"
              : "white"
        }
      >
        <Stack>
          <Group>
            <Group gap="xs">
              {message.sender !== "user" && <IconRobot />}
              <Text fw="bold">
                {message.sender === "user"
                  ? "Vy (Pacient)"
                  : "Nemocniční asistent"}
              </Text>
            </Group>
            {message.sender === "assistant" && (
              <Badge
                variant="light"
                color={message.kind === "escalation" ? "red" : undefined}
              >
                {statusLabels[message.kind]}
              </Badge>
            )}
            <Text component="time" dateTime={message.createdAt}>
              {timeFormat.format(new Date(message.createdAt))}
            </Text>
          </Group>
          {message.sender === "user" ? (
            <Text>{message.text}</Text>
          ) : (
            <AssistantContent message={message} {...props} />
          )}
        </Stack>
      </Card>
    </Group>
  );
}

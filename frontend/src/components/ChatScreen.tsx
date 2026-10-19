import {
  Accordion,
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconHistory,
  IconHelpCircle,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useState } from "react";

import type { ChatMessage, ReadingLevel } from "../types/chat";
import type { Contacts } from "../types/contacts";
import type { MessageCardProps } from "./MessageCard";

import { ChatHeader } from "./ChatHeader";
import { Conversation } from "./Conversation";
import { HelpPanel } from "./HelpPanel";
import { OutagePanel } from "./OutagePanel";
import { ProcedureCard, type Procedure } from "./ProcedureCard";
import {
  QuestionComposer,
  type QuestionComposerProps,
} from "./QuestionComposer";
import { SafetyNotice } from "./SafetyNotice";

export type ChatScreenProps = {
  title?: string;
  messages: readonly ChatMessage[];
  contacts: Contacts;
  receptionContactId: string;
  emergencyContactId: string;
  emergencyContactIds: readonly string[];
  procedure: Procedure;
  readingLevel: ReadingLevel;
  pending: boolean;
  onReadingLevelChange: (level: ReadingLevel) => void;
  onChangeProcedure: () => void;
  onRetry: () => void;
  onSend: QuestionComposerProps["onSend"];
  onFeedback: MessageCardProps["onFeedback"];
  onOpenSource?: MessageCardProps["onOpenSource"];
  draft?: QuestionComposerProps["draft"];
  onOpenHistory?: () => void;
  onNewChat?: () => void;
};

export function ChatScreen(props: ChatScreenProps) {
  const [panel, setPanel] = useState<"settings" | "help" | null>(null);
  const [composerHeight, setComposerHeight] = useState(112);
  const [messagesBeforeSend, setMessagesBeforeSend] =
    useState<ReadonlySet<string> | null>(null);

  return (
    <Stack>
      <Group
        role="group"
        aria-label="Ovládání chatu"
        justify="space-between"
        wrap="nowrap"
        gap="xs"
        pos="sticky"
        top="var(--app-shell-header-height, 0px)"
        bg="var(--mantine-color-body)"
        py="xs"
        style={{ zIndex: 100 }}
      >
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          {props.onOpenHistory && (
            <Button
              variant="default"
              bg="white"
              size="sm"
              disabled={props.pending}
              leftSection={<IconHistory aria-hidden="true" size={18} />}
              onClick={() => {
                setMessagesBeforeSend(null);
                props.onOpenHistory?.();
              }}
            >
              Historie
            </Button>
          )}
          {props.onNewChat && (
            <Tooltip label="Nový chat">
              <ActionIcon
                size="lg"
                aria-label="Nový chat"
                disabled={props.pending}
                onClick={() => {
                  setMessagesBeforeSend(null);
                  props.onNewChat?.();
                }}
              >
                <IconPlus aria-hidden="true" size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        <Text
          component="h2"
          size="sm"
          fw={600}
          ta="center"
          truncate
          title={props.title ?? "Nová konverzace"}
          m={0}
          miw={0}
          style={{ flex: 1 }}
        >
          {props.title ?? "Nová konverzace"}
        </Text>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            variant="default"
            bg="white"
            size="sm"
            leftSection={<IconHelpCircle aria-hidden="true" size={18} />}
            onClick={() => setPanel("help")}
          >
            Nápověda
          </Button>
          <Tooltip label="Nastavení chatu">
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Nastavení chatu"
              onClick={() => setPanel("settings")}
            >
              <IconSettings aria-hidden="true" size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <Modal
        opened={panel !== null}
        onClose={() => setPanel(null)}
        title={panel === "settings" ? "Nastavení chatu" : "Nápověda"}
      >
        {panel === "settings" && (
          <Stack>
            <ChatHeader
              readingLevel={props.readingLevel}
              onReadingLevelChange={props.onReadingLevelChange}
            />
            <ProcedureCard
              procedure={props.procedure}
              onChange={() => {
                setPanel(null);
                props.onChangeProcedure();
              }}
            />
          </Stack>
        )}
        {panel === "help" && (
          <Stack>
            <HelpPanel />
            <Accordion variant="contained">
              <Accordion.Item value="connection">
                <Accordion.Control>Ukázka výpadku připojení</Accordion.Control>
                <Accordion.Panel>
                  <OutagePanel
                    contacts={props.contacts}
                    receptionContactId={props.receptionContactId}
                    onRetry={() => {
                      setPanel(null);
                      props.onRetry();
                    }}
                    pending={props.pending}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        )}
      </Modal>
      <Stack>
        <Conversation
          messages={props.messages}
          pending={props.pending}
          messagesBeforeSend={messagesBeforeSend}
          composerHeight={composerHeight}
          contacts={props.contacts}
          emergencyContactId={props.emergencyContactId}
          onFeedback={props.onFeedback}
          onOpenSource={props.onOpenSource}
        />
        <QuestionComposer
          showSuggestions={props.messages.length === 0}
          draft={props.draft}
          readingLevel={props.readingLevel}
          pending={props.pending}
          onSend={(text, readingLevel) => {
            setMessagesBeforeSend(new Set(props.messages.map(({ id }) => id)));
            props.onSend(text, readingLevel);
          }}
          onHeightChange={setComposerHeight}
        >
          <SafetyNotice
            contacts={props.contacts}
            emergencyContactIds={props.emergencyContactIds}
          />
        </QuestionComposer>
      </Stack>
    </Stack>
  );
}

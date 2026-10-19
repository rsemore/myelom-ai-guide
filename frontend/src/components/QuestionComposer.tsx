import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { IconArrowRight, IconSend2 } from "@tabler/icons-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { ReadingLevel } from "../types/chat";

export type QuestionComposerProps = {
  readingLevel: ReadingLevel;
  pending: boolean;
  onSend: (text: string, readingLevel: ReadingLevel) => void;
  draft?: {
    value: string;
    onChange: (value: string) => void;
  };
  showSuggestions?: boolean;
  children?: ReactNode;
  onHeightChange?: (height: number) => void;
};

const questions = [
  "Co je mnohočetný myelom?",
  "Co si připravit na kontrolu u hematologa?",
  "Kde najdu informace o své léčbě?",
];

export function QuestionComposer({
  readingLevel,
  pending,
  onSend,
  draft,
  showSuggestions = false,
  children,
  onHeightChange,
}: QuestionComposerProps) {
  const [localText, setLocalText] = useState("");
  const text = draft?.value ?? localText;
  const setText = draft?.onChange ?? setLocalText;
  const input = useRef<HTMLInputElement>(null);
  const { ref: composerRef, height: composerHeight } = useElementSize();

  useEffect(() => {
    if (composerHeight > 0) onHeightChange?.(composerHeight);
  }, [composerHeight, onHeightChange]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !text.trim()) return;
    onSend(text.trim(), readingLevel);
    setText("");
  }

  return (
    <Stack>
      {showSuggestions && (
        <Stack>
          <Text>Časté otázky pacientů:</Text>
          {questions.map((question) => (
            <Button
              key={question}
              variant="light"
              justify="space-between"
              rightSection={<IconArrowRight aria-hidden="true" size={20} />}
              disabled={pending}
              onClick={() => {
                setText(question);
                input.current?.focus();
              }}
            >
              {question}
            </Button>
          ))}
        </Stack>
      )}
      {children}
      <Box h={composerHeight || 112} aria-hidden="true" />
      <Box
        pos="fixed"
        left={0}
        right={0}
        bottom="var(--app-shell-footer-height, calc(72px + env(safe-area-inset-bottom, 0px)))"
        bg="var(--mantine-color-body)"
        style={{
          zIndex: 99,
          borderTop: "1px solid var(--mantine-color-gray-4)",
        }}
      >
        <Container p="md" ref={composerRef}>
          <Box component="form" onSubmit={submit} aria-label="Odeslání dotazu">
            <Group wrap="nowrap" align="end">
              <TextInput
                ref={input}
                autoComplete="off"
                aria-label="Váš dotaz k mnohočetnému myelomu"
                placeholder="Zeptejte se na onemocnění, péči nebo léčbu..."
                value={text}
                onChange={(event) => setText(event.currentTarget.value)}
                disabled={pending}
                w="100%"
              />

              <ActionIcon
                type="submit"
                disabled={!text.trim()}
                loading={pending}
                size="input-sm"
                aria-label="Odeslat dotaz"
              >
                <IconSend2 />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </Box>
    </Stack>
  );
}

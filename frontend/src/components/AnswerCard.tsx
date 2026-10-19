import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { IconHelpCircle, IconThumbUp } from "@tabler/icons-react";
import { useContext } from "react";

import type { AnswerMessage, RiskLevel } from "../types/chat";

import { extractAnswerSources } from "./answerSources";
import { CitationCard, type CitationCardProps } from "./CitationCard";
import {
  KnowledgeNavigationContext,
  linkKnowledgeFiles,
  resolveKnowledgeFile,
} from "./knowledgeNavigation";
import { MarkdownAnswer } from "./MarkdownAnswer";

export type AnswerCardProps = {
  message: AnswerMessage;
  onFeedback: (messageId: string, feedback: "clear" | "clarify") => void;
  onOpenSource?: CitationCardProps["onOpenSource"];
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Nízké riziko",
  medium: "Střední riziko",
  high: "Vysoké riziko",
};

export function AnswerCard({
  message,
  onFeedback,
  onOpenSource,
}: AnswerCardProps) {
  const answer = extractAnswerSources(message.text);
  const sourceCount = message.citations.length + answer.sources.length;
  const knowledge = useContext(KnowledgeNavigationContext);

  return (
    <Stack>
      {message.risk && (
        <Badge
          variant={message.risk === "high" ? "filled" : "light"}
          color={message.risk === "high" ? "red" : undefined}
        >
          {riskLabels[message.risk]}
        </Badge>
      )}
      <MarkdownAnswer>{answer.text}</MarkdownAnswer>
      <Text fw="bold">Zdroje odpovědi ({sourceCount})</Text>
      {sourceCount === 0 && (
        <Alert title="Zdroj není přiložen">
          U této odpovědi není k dispozici citace pro ověření.
        </Alert>
      )}
      {answer.sources.length > 0 && (
        <Card bg="gray.0" shadow="none">
          <Box component="ul" m={0} pl="lg">
            {answer.sources.map((source) => (
              <Box component="li" key={source}>
                <MarkdownAnswer
                  resolveLink={(href) => {
                    const file =
                      knowledge && resolveKnowledgeFile(href, knowledge.files);
                    return file
                      ? {
                          href: `/sources/${encodeURIComponent(file)}?answer=${encodeURIComponent(message.id)}`,
                          onOpen: () => knowledge.openFile(file, message.id),
                        }
                      : undefined;
                  }}
                >
                  {knowledge
                    ? linkKnowledgeFiles(source, knowledge.files)
                    : source}
                </MarkdownAnswer>
              </Box>
            ))}
          </Box>
        </Card>
      )}
      {message.citations.map((citation, index) => {
        const file =
          knowledge &&
          (resolveKnowledgeFile(citation.documentId, knowledge.files) ??
            knowledge.files.find((file) => file === citation.title));
        return (
          <CitationCard
            key={`${citation.documentId}-${index}`}
            citation={citation}
            onOpenSource={
              file ? () => knowledge.openFile(file, message.id) : onOpenSource
            }
          />
        );
      })}
    </Stack>
  );
}

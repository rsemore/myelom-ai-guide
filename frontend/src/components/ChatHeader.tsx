import { Group, SegmentedControl, Text } from "@mantine/core";

import type { ReadingLevel } from "../types/chat";

export type ChatHeaderProps = {
  readingLevel: ReadingLevel;
  onReadingLevelChange: (level: ReadingLevel) => void;
};

export function ChatHeader({
  readingLevel,
  onReadingLevelChange,
}: ChatHeaderProps) {
  return (
    <Group justify="space-between">
      <Group>
        <Text id="reading-level-label">Podrobnost textu:</Text>
        <SegmentedControl
          aria-labelledby="reading-level-label"
          value={readingLevel}
          data={[
            { value: "simple", label: "Jednoduše" },
            { value: "detailed", label: "Podrobně" },
          ]}
          onChange={(value) => {
            if (value === "simple" || value === "detailed")
              onReadingLevelChange(value);
          }}
        />
      </Group>
    </Group>
  );
}

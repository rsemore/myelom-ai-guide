import { Button, Card, Group, Stack, Text, TextInput } from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";

export type DocumentToolbarProps = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  matchCount: number;
  partial: boolean;
};

export function DocumentToolbar(props: DocumentToolbarProps) {
  return (
    <Card>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text>
            Strana {props.page} z {props.totalPages}
          </Text>
          <Group gap="xs">
            <Button
              aria-label="Předchozí strana"
              variant="default"
              disabled={!props.hasPrevious}
              onClick={props.onPrevious}
              leftSection={<IconChevronLeft aria-hidden="true" size={18} />}
            >
              Předchozí
            </Button>
            <Button
              aria-label="Další strana"
              variant="default"
              disabled={!props.hasNext}
              onClick={props.onNext}
              rightSection={<IconChevronRight aria-hidden="true" size={18} />}
            >
              Další
            </Button>
          </Group>
        </Group>
        {props.partial && (
          <Text size="sm">
            K dispozici je pouze náhled vybraných stran. Ostatní strany nejsou
            připojeny.
          </Text>
        )}
        <TextInput
          type="search"
          label="Hledat na zobrazené straně"
          placeholder="Hledat v náhledu..."
          leftSection={<IconSearch aria-hidden="true" size={20} />}
          value={props.search}
          onChange={(event) => props.onSearchChange(event.currentTarget.value)}
        />
        {props.search.trim() && (
          <Text role="status" size="sm">
            Počet shod: {props.matchCount}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

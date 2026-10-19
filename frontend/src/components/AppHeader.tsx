import {
  Avatar,
  Container,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useIsMutating, useQuery } from "@tanstack/react-query";

import type { AuthUser } from "../api/chat";

import { useLogout } from "../api/useLogout";
import { contactIds, contacts } from "../config/contacts";
import { ContactButton } from "./ContactButton";

export const AppHeader = ({ onLogout }: { onLogout?: () => void }) => {
  const { data: user } = useQuery<AuthUser | null>({
    queryKey: ["auth-user"],
    enabled: false,
  });
  const mutating = useIsMutating();
  const logout = useLogout(onLogout);
  return (
    <Container p="md">
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Stack gap={0} miw={0}>
          <Text size="xs" tt="uppercase" c="dimmed" truncate>
            Průvodce mnohočetným myelomem
          </Text>
          <Title order={1} size="h3" lineClamp={1}>
            Asistent pro pacienty
          </Title>
        </Stack>
        <Group wrap="nowrap" gap="xs">
          <ContactButton
            contacts={contacts}
            contactId={contactIds.medicalHelp}
            label="Pomoc"
            aria-label="Kontaktovat zdravotníka"
          />
          {user ? (
            <Menu position="bottom-end" closeOnItemClick={false}>
              <Menu.Target>
                <Avatar
                  component="button"
                  type="button"
                  aria-label="Účet pacienta"
                  variant="light"
                  radius="xl"
                  size={42}
                  style={{ cursor: "pointer" }}
                >
                  <IconUser />
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={() => logout.mutate()}
                  disabled={mutating > 0}
                >
                  {logout.isPending ? "Odhlašování…" : "Odhlásit se"}
                </Menu.Item>
                {logout.error && (
                  <Text role="alert" c="red" size="sm" p="xs">
                    Odhlášení se nezdařilo. {logout.error.message}
                  </Text>
                )}
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Avatar aria-label="Pacient" variant="light" radius="xl" size={42}>
              <IconUser />
            </Avatar>
          )}
        </Group>
      </Group>
    </Container>
  );
};

import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { authenticateUser } from "../api/chat";

export function LoginLinkPage() {
  const hash = useLocation({ select: (location) => location.hash });
  const [credentials] = useState(() => {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    return { email: params.get("email") ?? "", key: params.get("key") ?? "" };
  });
  const started = useRef(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: async () => {
      await navigate({ to: "/login", replace: true, hash: "" });
      if (!credentials.email || !credentials.key)
        throw new Error("Přihlašovací odkaz není úplný.");
      return authenticateUser(credentials.email, credentials.key);
    },
    retry: false,
    onSuccess: async (user) => {
      await queryClient.cancelQueries();
      for (const queryKey of [["chat"], ["chat-sessions"], ["knowledge"]])
        queryClient.removeQueries({ queryKey });
      queryClient.setQueryData(["auth-user"], user);
      await navigate({ to: "/", replace: true });
    },
  });
  const { mutate } = login;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate();
  }, [mutate]);

  return (
    <Container size="xs" p="md">
      <Stack>
        {login.error ? (
          <Alert title="Přihlášení se nezdařilo" role="alert">
            {login.error.message}
          </Alert>
        ) : (
          <Text role="status">Přihlašování…</Text>
        )}
        {login.error && (
          <Button component={Link} to="/">
            Přejít na přihlášení
          </Button>
        )}
      </Stack>
    </Container>
  );
}

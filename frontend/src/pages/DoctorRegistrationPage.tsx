import {
  Alert,
  Button,
  Code,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useMutation } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"

import { chatApi } from "../api/chat"

export function DoctorRegistrationPage() {
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const registration = useMutation({
    mutationFn: (email: string) => chatApi.registerUser(email),
    retry: false,
  })
  const copy = useMutation({
    mutationFn: (link: string) => navigator.clipboard.writeText(link),
    retry: false,
    onSuccess: () => setCopied(true),
  })
  const loginUrl = registration.data
    ? new URL("/login", window.location.origin)
    : null
  if (loginUrl && registration.data)
    loginUrl.hash = new URLSearchParams({
      email: registration.data.email,
      key: registration.data.key,
    }).toString()
  const loginLink = loginUrl?.toString()

  return (
    <Stack maw={640}>
      <Title order={1}>Registrace pacientů</Title>
      <Alert title="Přístupový odkaz je důvěrný">
        Registrace vytvoří skutečný účet v backendu. Odkaz a QR kód obsahují
        přístupový klíč; kdokoli s odkazem se může přihlásit jako tento pacient.
        Předávejte je pouze příslušnému pacientovi. Portál zatím nemá ověření
        personálu ani řízení jeho oprávnění.
      </Alert>
      {!registration.data && (
        <Stack
          component="form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!registration.isPending) registration.mutate(email.trim())
          }}
        >
          <TextInput
            label="E-mail pacienta"
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            disabled={registration.isPending}
          />
          {registration.error && (
            <Alert title="Registrace se nezdařila" role="alert">
              {registration.error.message}
            </Alert>
          )}
          <Button type="submit" loading={registration.isPending}>
            Registrovat pacienta
          </Button>
        </Stack>
      )}
      {registration.data && loginLink && (
        <Paper withBorder p="md">
          <Stack>
            <Text role="status">
              Pacient {registration.data.email} byl zaregistrován.
            </Text>
            <QRCodeSVG
              value={loginLink}
              size={256}
              marginSize={4}
              title="QR kód pro přihlášení pacienta"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <Text size="sm">
              Naskenováním QR kódu se pacient přihlásí a otevře chat.
            </Text>
            <TextInput label="Přihlašovací odkaz" value={loginLink} readOnly />
            <Button
              onClick={() => copy.mutate(loginLink)}
              loading={copy.isPending}
            >
              Kopírovat přihlašovací odkaz
            </Button>
            {copied && <Text role="status">Odkaz byl zkopírován.</Text>}
            {copy.error && (
              <Alert title="Odkaz se nepodařilo zkopírovat" role="alert">
                {copy.error.message} Odkaz můžete označit a zkopírovat ručně.
              </Alert>
            )}
            <Text size="sm">
              Přístupový klíč: <Code style={{ whiteSpace: "wrap", wordBreak: "break-word" }}>{registration.data.key}</Code>
            </Text>
            <Button
              variant="default"
              onClick={() => {
                registration.reset()
                copy.reset()
                setEmail("")
                setCopied(false)
              }}
            >
              Registrovat dalšího pacienta
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

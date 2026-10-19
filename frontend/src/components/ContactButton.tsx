import { Alert, Button, type ButtonProps } from "@mantine/core";
import { IconPhone } from "@tabler/icons-react";

import type { Contacts } from "../types/contacts";

export type ContactButtonProps = {
  contacts: Contacts;
  contactId: string;
  label?: string;
  "aria-label"?: string;
} & Pick<ButtonProps, "color" | "fullWidth" | "variant">;

export function ContactButton({
  contacts,
  contactId,
  label,
  color = "red",
  fullWidth,
  variant,
  "aria-label": ariaLabel,
}: ContactButtonProps) {
  const contact = contacts[contactId];
  const phone = contact?.phone?.trim();

  if (!contact || !phone) {
    return (
      <Alert title="Kontakt není nastaven" role="alert">
        {contact?.label ?? contactId}: telefonní číslo není k dispozici.
      </Alert>
    );
  }

  return (
    <Button
      component="a"
      href={`tel:${phone.replace(/\s/g, "")}`}
      color={color}
      fullWidth={fullWidth}
      variant={variant}
      aria-label={ariaLabel}
      leftSection={<IconPhone aria-hidden="true" size={20} />}
    >
      {label ?? `${contact.label}: ${phone}`}
    </Button>
  );
}

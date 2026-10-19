import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  NativeSelect,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { IconCalendar, IconMapPin, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";

import type { PreparationProfile } from "../types/preparation";

import { procedureOptions } from "../data/preparation";

export type PreparationFormProps = {
  initialProfile: PreparationProfile;
  onSave: (profile: PreparationProfile) => void;
  onEdit: () => void;
};

export function PreparationForm({
  initialProfile,
  onSave,
  onEdit,
}: PreparationFormProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [locationError, setLocationError] = useState(false);

  function update(field: keyof PreparationProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setLocationError(false);
    onEdit();
  }

  return (
    <Card>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!profile.location.trim()) {
            setLocationError(true);
            return;
          }
          onSave({ ...profile, location: profile.location.trim() });
        }}
      >
        <Stack>
          <Group justify="space-between">
            <Title order={2}>Údaje návštěvy hematologie</Title>
            <Badge variant="light">Ukázkový profil</Badge>
          </Group>
          <NativeSelect
            label="Typ návštěvy"
            data={procedureOptions}
            value={profile.procedureId}
            onChange={(event) =>
              update("procedureId", event.currentTarget.value)
            }
            required
          />
          <TextInput
            label="Datum a čas návštěvy"
            type="datetime-local"
            value={profile.scheduledAt}
            onChange={(event) =>
              update("scheduledAt", event.currentTarget.value)
            }
            leftSection={<IconCalendar aria-hidden="true" size={20} />}
            required
          />
          <TextInput
            label="Oddělení / Pracoviště"
            value={profile.location}
            onChange={(event) => update("location", event.currentTarget.value)}
            leftSection={<IconMapPin aria-hidden="true" size={20} />}
            error={
              locationError ? "Zadejte oddělení nebo pracoviště." : undefined
            }
            required
          />
          <Button
            type="submit"
            aria-label="Uložit zadané údaje a přepočítat plán"
            leftSection={<IconRefresh aria-hidden="true" size={20} />}
            fullWidth
          >
            Uložit a přepočítat plán
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}

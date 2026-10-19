import {
  Alert,
  Button,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";

import type { DashboardSection, ReviewItem } from "../types/dashboard";

import { AuditLogTable } from "../components/AuditLogTable";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { DoctorAppShell } from "../components/DoctorAppShell";
import { ReviewQueue } from "../components/ReviewQueue";
import { auditCsv, auditRecords, reviewItems } from "../data/dashboard";
import { DoctorRegistrationPage } from "./DoctorRegistrationPage";

type DoctorDashboardPageProps = {
  section?: DashboardSection;
  onSectionChange?: (section: DashboardSection) => void;
  onOpenPatient?: () => void;
};

export function DoctorDashboardPage(props: DoctorDashboardPageProps) {
  const [localSection, setLocalSection] =
    useState<DashboardSection>("overview");
  const section = props.section ?? localSection;
  const setSection = props.onSectionChange ?? setLocalSection;
  const [review, setReview] = useState<ReviewItem | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [crisisOpen, setCrisisOpen] = useState(false);

  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([auditCsv(auditRecords)], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ukazkovy-audit.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setNotice("Byl připraven CSV export 3 ukázkových záznamů.");
  }

  if (section === "registration")
    return (
      <DoctorAppShell
        section={section}
        onSectionChange={setSection}
        onOpenPatient={props.onOpenPatient}
      >
        <DoctorRegistrationPage />
      </DoctorAppShell>
    );

  return (
    <DoctorAppShell
      section={section}
      onSectionChange={setSection}
      onOpenPatient={props.onOpenPatient}
    >
      <Stack>
        <Alert title="Offline demo portálu personálu">
          Data z návrhu jsou fiktivní a nejsou klinicky ověřena. Živý provoz,
          přihlášení, oprávnění, kontaktování pacientů a trvalý audit nejsou
          připojeny. Oddělená URL není bezpečnostní ochranou.
        </Alert>
        <Group justify="space-between">
          <Stack gap="xs">
            <Title order={1}>
              Klinický audit a monitoring asistenta pacientů
            </Title>
            <Text>
              Hematologie · mnohočetný myelom · ukázka posledních 24 hodin
            </Text>
          </Stack>
          <Group>
            <NativeSelect
              aria-label="Časový filtr"
              data={["Posledních 24 hodin (ukázka)"]}
              disabled
            />
            <Button
              variant="default"
              leftSection={<IconRefresh aria-hidden="true" size={20} />}
              onClick={() =>
                setNotice(
                  "Živá data nejsou připojena. Zobrazený ukázkový snímek se nezměnil.",
                )
              }
            >
              Obnovit data
            </Button>
            <Button
              leftSection={<IconDownload aria-hidden="true" size={20} />}
              onClick={exportCsv}
            >
              Export protokolu (CSV)
            </Button>
          </Group>
        </Group>
        {notice && <Text role="status">{notice}</Text>}
        {section === "overview" && (
          <>
            <Alert
              title="Kritická bezpečnostní eskalace – 5 ukázkových incidentů"
              color="red"
              icon={<IconAlertTriangle />}
            >
              <Stack gap="sm">
                <Text>
                  Souhrn z návrhu: 4 eskalace na oddělení, 1 na záchrannou
                  službu. Nejde o aktuální hlášení ani potvrzení uskutečněných
                  hovorů.
                </Text>
                <Button color="red" onClick={() => setCrisisOpen(true)}>
                  Otevřít krizový protokol
                </Button>
              </Stack>
            </Alert>
            <DashboardMetrics />
          </>
        )}
        {(section === "overview" || section === "unanswered") && (
          <ReviewQueue
            items={reviewItems}
            resolvedIds={resolvedIds}
            onReview={setReview}
          />
        )}
        {(section === "overview" || section === "logs") && (
          <AuditLogTable records={auditRecords} />
        )}
        {section === "documents" && (
          <Alert title="Správa dokumentů není připojena">
            Nahrávání, verzování a schvalování klinických protokolů vyžaduje
            backend. Ukázkové citace nejsou důkazem schválení dokumentu.
          </Alert>
        )}
        {section === "safety" && (
          <Alert title="Bezpečnostní konfigurace není připojena">
            Limity nelze v ukázce měnit. Produkční nastavení musí podléhat
            oprávnění, schválení a auditování změn.
          </Alert>
        )}
        <Alert title="Demonstrační audit">
          Není doložen soulad s MDR, ISO 27799, anonymizace produkčních dat ani
          desetiletá archivace. Ukázka takové záruky neposkytuje.
        </Alert>
      </Stack>
      <Modal
        opened={review !== null}
        onClose={() => setReview(null)}
        title={review ? `Revize dotazu ${review.id}` : "Revize dotazu"}
      >
        {review && (
          <Stack>
            <Text>{review.question}</Text>
            <Alert title="Kontaktování pacienta není připojeno">
              Ukázka neobsahuje identitu ani kontakt pacienta. Poznámka a stav
              se uchovávají pouze do obnovení stránky.
            </Alert>
            <Textarea
              label="Interní poznámka (pouze ukázka)"
              description="Nevkládejte osobní ani skutečné zdravotní údaje."
              value={notes[review.id] ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setNotes((current) => ({ ...current, [review.id]: value }));
              }}
            />
            <Button
              onClick={() => {
                setNotice(
                  `Poznámka k ${review.id} je uložena jen v paměti ukázky.`,
                );
                setReview(null);
              }}
            >
              Uložit poznámku v ukázce
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setResolvedIds((current) => [
                  ...new Set([...current, review.id]),
                ]);
                setNotice(
                  `Dotaz ${review.id} byl označen jako vyřešený pouze v ukázce.`,
                );
                setReview(null);
              }}
            >
              Označit jako vyřešené v ukázce
            </Button>
          </Stack>
        )}
      </Modal>
      <Modal
        opened={crisisOpen}
        onClose={() => setCrisisOpen(false)}
        title="Krizový protokol"
      >
        <Alert title="Protokol není připojen" color="red">
          Schválený krizový protokol ani živé incidenty nejsou v ukázce
          dostupné. Postupujte podle platných interních pravidel svého
          pracoviště.
        </Alert>
      </Modal>
    </DoctorAppShell>
  );
}

import {
  Alert,
  Box,
  Button,
  Card,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { IconArrowLeft, IconChevronRight, IconFileText } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import { useKnowledgeFile, useKnowledgeFiles } from "../api/knowledge"
import { MarkdownAnswer } from "../components/MarkdownAnswer"

export function KnowledgePage() {
  const files = useKnowledgeFiles()
  return (
    <Stack>
      <Title order={1}>Zdroje</Title>
      {files.isPending && <Loader aria-label="Načítám zdroje" />}
      {files.error && (
        <Alert title="Zdroje se nepodařilo načíst" role="alert">
          {files.error.message}
        </Alert>
      )}
      {files.error && (
        <Button onClick={() => void files.refetch()}>Zkusit znovu</Button>
      )}
      {files.data?.length === 0 && (
        <Text>Zatím nejsou dostupné žádné dokumenty.</Text>
      )}
      {files.data && (
        <Stack component="ul" m={0} p={0} style={{ listStyle: "none" }}>
          {files.data.map((file) => (
            <Box component="li" key={file}>
              <Button
                renderRoot={(props) => (
                  <Link
                    {...props}
                    to="/sources/$file"
                    params={{ file }}
                    search={{}}
                  />
                )}
                variant="default"
                fullWidth
                h="auto"
                mih={56}
                py="sm"
                justify="center"
                leftSection={<IconFileText aria-hidden="true" size={20} />}
                rightSection={<IconChevronRight aria-hidden="true" size={18} />}
                styles={{
                  root: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  inner: {
                    width: "100%",
                    height: "auto",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  label: {
                    height: "auto",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    textAlign: "center",
                  },
                }}
              >
                {file}
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export function KnowledgeDetailPage({
  file,
  answerId,
}: {
  file: string
  answerId?: string
}) {
  const document = useKnowledgeFile(file)
  return (
    <Stack>
      {answerId ? (
        <Button
          component={Link}
          variant="default"
          to="/"
          hash={`answer-${answerId}`}
        >
          Zpět na odpověď v chatu
        </Button>
      ) : (
        <Button
          leftSection={<IconArrowLeft aria-hidden="true" size={20} />}
          component={Link}
          variant="default"
          to="/sources"
        >
          Zpět na zdroje
        </Button>
      )}
      <Title order={1} style={{ overflowWrap: "anywhere" }}>
        {file}
      </Title>
      {document.isPending && <Loader aria-label="Načítám dokument" />}
      {document.error && (
        <Alert title="Dokument se nepodařilo načíst" role="alert">
          {document.error.message}
        </Alert>
      )}
      {document.error && (
        <Button onClick={() => void document.refetch()}>Zkusit znovu</Button>
      )}
      {document.data !== undefined && (
        <Card>
          <MarkdownAnswer>{document.data}</MarkdownAnswer>
        </Card>
      )}
    </Stack>
  )
}

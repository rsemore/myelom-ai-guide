import {
  Alert,
  Box,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { authenticateUser, chatApi } from "../api/chat";
import { useChat } from "../api/useChat";
import { ChatScreen } from "../components/ChatScreen";
import { ContactButton } from "../components/ContactButton";
import { contactIds, contacts } from "../config/contacts";
import { demoProcedure } from "../data/demo";
import { demoDocument } from "../data/documents";
import { Citation, ReadingLevel } from "../types/chat";
import { ChatHistoryPage } from "./ChatHistoryPage";
import { DocumentDetailPage } from "./DocumentDetailPage";

type DemoPanel = "procedure" | "feedback" | "source";

const panelTitles: Record<DemoPanel, string> = {
  procedure: "Změnit plánovanou návštěvu",
  feedback: "Zpětná vazba",
  source: "Zdrojový dokument",
};

export type ChatView = "chat" | "history" | "document";
type ChatPageProps = {
  view?: ChatView;
  onViewChange?: (view: ChatView) => void;
};

export const ChatPage = (props: ChatPageProps) => {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const queryClient = useQueryClient();
  const loggingOut = useIsMutating({ mutationKey: ["logout"] }) > 0;
  const currentUser = useQuery({
    queryKey: ["auth-user"],
    queryFn: ({ signal }) => chatApi.getCurrentUser(signal),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const login = useMutation({
    mutationFn: (credentials: { email: string; key: string }) =>
      authenticateUser(credentials.email, credentials.key),
    retry: false,
    onSuccess: (user) => {
      setKey("");
      queryClient.setQueryData(["auth-user"], user);
      void queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
  useEffect(() => {
    if (currentUser.data === null) {
      setEmail("");
      setKey("");
    }
  }, [currentUser.data]);

  if (!currentUser.data && props.view === "document") {
    return (
      <DocumentDetailPage
        document={demoDocument}
        contacts={contacts}
        supportContactId={contactIds.reception}
        onBack={() => props.onViewChange?.("chat")}
      />
    );
  }

  if (currentUser.data)
    return (
      <Stack>
        <Box
          component="fieldset"
          disabled={loggingOut}
          m={0}
          p={0}
          style={{ border: 0, minWidth: 0 }}
        >
          <ConnectedChatPage email={currentUser.data.email} {...props} />
        </Box>
      </Stack>
    );

  if (currentUser.isPending)
    return <Text role="status">Ověřování přihlášení…</Text>;

  return (
    <Stack
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!login.isPending) login.mutate({ email: email.trim(), key });
      }}
    >
      <Text>Pro zahájení chatu zadejte svůj e-mail a přístupový klíč.</Text>
      {currentUser.error && (
        <Alert title="Přihlášení se nepodařilo ověřit" role="alert">
          {currentUser.error.message}
          <Button
            onClick={() => void currentUser.refetch()}
            loading={currentUser.isFetching}
          >
            Zkusit znovu
          </Button>
        </Alert>
      )}
      <Alert title="Ochrana osobních údajů">
        E-mail a přístupový klíč budou odeslány backendu pro ověření identity.
        Do této ukázky nezadávejte citlivé osobní ani zdravotní údaje.
      </Alert>
      <TextInput
        label="E-mail"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        autoComplete="email"
        disabled={login.isPending}
      />
      <PasswordInput
        label="Přístupový klíč"
        required
        value={key}
        onChange={(event) => setKey(event.currentTarget.value)}
        autoComplete="current-password"
        disabled={login.isPending}
      />
      {login.error && (
        <Alert title="Přihlášení se nezdařilo" role="alert">
          {login.error.message}
        </Alert>
      )}
      <Button type="submit" loading={login.isPending}>
        Pokračovat do chatu
      </Button>
    </Stack>
  );
};

function ConnectedChatPage({
  email,
  view,
  onViewChange,
}: ChatPageProps & { email: string }) {
  const chat = useChat(email);
  const { conversations, activeConversation } = chat;
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("simple");
  const [panel, setPanel] = useState<DemoPanel | null>(null);
  const [feedback, setFeedback] = useState("");
  const [source, setSource] = useState<Citation | null>(null);
  const [localView, setLocalView] = useState<ChatView>("chat");
  const activeView = view ?? localView;
  const changeView = onViewChange ?? setLocalView;
  const showingHistory = activeView === "history";
  const chatScrollPosition = useRef<{ left: number; top: number } | null>(null);
  const [scrollToSelectedChat, setScrollToSelectedChat] = useState(false);
  const showingDocument = activeView === "document";

  function selectConversation(id: string) {
    chatScrollPosition.current = null;
    setScrollToSelectedChat(true);
    chat.selectConversation(id);
    changeView("chat");
  }

  useEffect(() => {
    if (!scrollToSelectedChat || activeView !== "chat" ||
      !activeConversation || chat.pending)
      return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({
        left: 0,
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      });
      setScrollToSelectedChat(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToSelectedChat, activeView, activeConversation, chat.pending]);

  useLayoutEffect(() => {
    if (showingDocument || showingHistory) {
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    } else if (chatScrollPosition.current) {
      window.scrollTo({ ...chatScrollPosition.current, behavior: "instant" });
      chatScrollPosition.current = null;
    }
  }, [showingDocument, showingHistory]);

  if (!activeConversation) {
    if (showingDocument)
      return (
        <DocumentDetailPage
          document={demoDocument}
          citation={source ?? undefined}
          contacts={contacts}
          supportContactId={contactIds.reception}
          onBack={() => changeView("chat")}
        />
      );
    return (
      <Stack>
        {chat.error && (
          <Alert title="Chat se nepodařilo vytvořit" role="alert">
            {chat.error.message}
          </Alert>
        )}
        <Button
          loading={chat.pending}
          onClick={() => {
            chat.newChat();
            changeView("chat");
          }}
        >
          Nový chat
        </Button>
        <ChatHistoryPage
          conversations={conversations}
          activeConversationId={null}
          pending={chat.historyPending}
          error={chat.historyError}
          onReload={() => void chat.reloadHistory()}
          onSelect={selectConversation}
        />
      </Stack>
    );
  }

  return (
    <>
      <Stack display={showingDocument || showingHistory ? "none" : undefined}>
        <Text size="sm" c="dimmed">
          Ukázka asistenta pro mnohočetný myelom · Odpovědi generuje AI. Obsah
          není ověřeným lékařským doporučením.
        </Text>
        {chat.error && (
          <Alert title="Spojení s chatem se nezdařilo" role="alert">
            <Stack>
              <Text>
                {chat.error.message} Dotaz již mohl být uložen. Než jej odešlete
                znovu, načtěte zprávy.
              </Text>
              <Button onClick={() => void chat.reload()} loading={chat.pending}>
                Načíst zprávy
              </Button>
            </Stack>
          </Alert>
        )}
        <ChatScreen
          title={activeConversation.title}
          onOpenHistory={() => {
            chatScrollPosition.current = {
              left: window.scrollX,
              top: window.scrollY,
            };
            void chat.reloadHistory();
            changeView("history");
          }}
          onNewChat={() => {
            chat.newChat();
            setPanel(null);
            setSource(null);
            changeView("chat");
          }}
          messages={activeConversation.messages}
          draft={{
            value: activeConversation.draft,
            onChange: chat.setDraft,
          }}
          contacts={contacts}
          receptionContactId={contactIds.reception}
          emergencyContactId={contactIds.medicalHelp}
          emergencyContactIds={[contactIds.medicalHelp, contactIds.emergency]}
          procedure={demoProcedure}
          readingLevel={readingLevel}
          onReadingLevelChange={setReadingLevel}
          pending={chat.pending}
          onChangeProcedure={() => setPanel("procedure")}
          onRetry={() => void chat.reload()}
          onOpenSource={(citation) => {
            if (
              citation.documentId === demoDocument.id &&
              citation.version === demoDocument.version
            ) {
              chatScrollPosition.current = {
                left: window.scrollX,
                top: window.scrollY,
              };
            }
            setSource(citation);
            if (
              citation.documentId === demoDocument.id &&
              citation.version === demoDocument.version
            )
              changeView("document");
            if (
              citation.documentId !== demoDocument.id ||
              citation.version !== demoDocument.version
            ) {
              setPanel("source");
            }
          }}
          onSend={chat.send}
          onFeedback={(_, value) => {
            setFeedback(
              value === "clear"
                ? "Zvolili jste: Ano."
                : "Zvolili jste: Upřesnit.",
            );
            setPanel("feedback");
          }}
        />
        <Modal
          opened={panel !== null}
          onClose={() => setPanel(null)}
          title={panel === null ? "" : panelTitles[panel]}
        >
          <Stack>
            {panel === "source" && source && (
              <>
                <Alert title="Ukázková citace">
                  Plný zdrojový dokument není připojen. Zobrazený úryvek je
                  součástí ukázky a není ověřeným lékařským doporučením.
                </Alert>
                <Text fw="bold">{source.title}</Text>
                <Text>
                  Verze {source.version}
                  {source.page !== undefined && ` · Strana ${source.page}`}
                </Text>
                <Text>{source.quote}</Text>
              </>
            )}
            {panel === "procedure" && (
              <Text>
                Změny termínu nejsou v ukázce dostupné. Kontaktujte recepci
                hematologie.
              </Text>
            )}
            {panel === "procedure" && (
              <ContactButton
                contacts={contacts}
                contactId={contactIds.reception}
              />
            )}
            {panel === "feedback" && (
              <Text>
                {feedback} Backend pro uložení zpětné vazby není připojen.
              </Text>
            )}
            <Button onClick={() => setPanel(null)}>Zavřít</Button>
          </Stack>
        </Modal>
      </Stack>
      {showingHistory && (
        <ChatHistoryPage
          conversations={[...conversations]
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
            .map(({ id, title, updatedAt, messageCount }) => ({
              id,
              title,
              updatedAt,
              messageCount,
            }))}
          pending={chat.historyPending}
          error={chat.historyError}
          onReload={() => void chat.reloadHistory()}
          activeConversationId={activeConversation.id}
          onBack={() => changeView("chat")}
          onSelect={(id) => {
            if (!conversations.some((conversation) => conversation.id === id)) {
              throw new Error(`Conversation not found: ${id}`);
            }
            selectConversation(id);
          }}
        />
      )}
      {showingDocument && (
        <DocumentDetailPage
          key={`${source?.documentId}-${source?.version}-${source?.page}`}
          document={demoDocument}
          citation={source ?? undefined}
          contacts={contacts}
          supportContactId={contactIds.reception}
          onBack={() => changeView("chat")}
        />
      )}
    </>
  );
}

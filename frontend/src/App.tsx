import type { RouterHistory } from "@tanstack/react-router";

import { Box, Text } from "@mantine/core";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";

import type { NavigationSection } from "./components/BottomNavigation";
import type { ChatView } from "./pages/ChatPage";
import type { DashboardSection } from "./types/dashboard";

import { useKnowledgeFiles } from "./api/knowledge";
import { KnowledgeNavigationContext } from "./components/knowledgeNavigation";
import { MobileAppShell } from "./components/MobileAppShell";
import { contacts } from "./config/contacts";
import { ChatPage } from "./pages/ChatPage";
import { ContactsPage } from "./pages/ContactsPage";
import { DoctorDashboardPage } from "./pages/DoctorDashboardPage";
import { KnowledgePage, KnowledgeDetailPage } from "./pages/KnowledgePage";
import { LoginLinkPage } from "./pages/LoginLinkPage";
import { PreparationPage } from "./pages/PreparationPage";

const sectionPaths = {
  messages: "/",
  preparation: "/preparation",
  contacts: "/contacts",
  sources: "/sources",
} as const;

const chatPaths = {
  chat: "/",
  history: "/history",
  document: "/document",
} as const;
const doctorPaths = {
  overview: "/doctor",
  registration: "/doctor/registration",
  unanswered: "/doctor/unanswered",
  logs: "/doctor/logs",
  documents: "/doctor/documents",
  safety: "/doctor/safety",
} as const;

function NotFound() {
  return (
    <Box p="md">
      <Text>Stránka nebyla nalezena.</Text>
      <Link to="/">Pacientská aplikace</Link>
    </Box>
  );
}

function PatientApp() {
  const pathname = useLocation({
    select: (location) => location.pathname.replace(/\/+$/, "") || "/",
  });
  const navigate = useNavigate();
  const { file } = useParams({ strict: false });
  const { answer } = useSearch({ strict: false });
  const knowledge = useKnowledgeFiles();
  const activeSection: NavigationSection =
    pathname === "/preparation"
      ? "preparation"
      : pathname === "/contacts"
        ? "contacts"
        : pathname === "/sources" || pathname.startsWith("/sources/")
          ? "sources"
          : "messages";
  const chatView: ChatView =
    pathname === "/history"
      ? "history"
      : pathname === "/document"
        ? "document"
        : "chat";

  return (
    <KnowledgeNavigationContext.Provider
      value={{
        files: knowledge.data ?? [],
        openFile: (file, answerId) =>
          void navigate({
            to: "/sources/$file",
            params: { file },
            search: { answer: answerId },
          }),
      }}
    >
      <MobileAppShell
        activeSection={activeSection}
        onNavigate={(section) => {
          void navigate({ to: sectionPaths[section] }).then(() => {
            if (section !== "messages") return;
            requestAnimationFrame(() => {
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                left: 0,
                behavior: "instant",
              });
            });
          });
        }}
      >
        <Box display={activeSection === "messages" ? undefined : "none"}>
          <ChatPage
            view={chatView}
            onViewChange={(view) => void navigate({ to: chatPaths[view] })}
          />
        </Box>
        <Box display={activeSection === "preparation" ? undefined : "none"}>
          <PreparationPage />
        </Box>
        <Box display={activeSection === "contacts" ? undefined : "none"}>
          <ContactsPage contacts={contacts} />
        </Box>
        {activeSection === "sources" &&
          (file ? (
            <KnowledgeDetailPage file={file} answerId={answer} />
          ) : (
            <KnowledgePage />
          ))}
      </MobileAppShell>
    </KnowledgeNavigationContext.Provider>
  );
}

function DoctorApp() {
  const pathname = useLocation({
    select: (location) => location.pathname.replace(/\/+$/, "") || "/",
  });
  const navigate = useNavigate();
  const section =
    (Object.keys(doctorPaths) as DashboardSection[]).find(
      (key) => doctorPaths[key] === pathname,
    ) ?? "overview";
  return (
    <DoctorDashboardPage
      section={section}
      onSectionChange={(next) => void navigate({ to: doctorPaths[next] })}
      onOpenPatient={() => void navigate({ to: "/" })}
    />
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
});
const patientRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "patient",
  component: PatientApp,
  notFoundComponent: NotFound,
});
const doctorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "doctor",
  component: DoctorApp,
  notFoundComponent: NotFound,
});

const routeTree = rootRoute.addChildren([
  createRoute({
    getParentRoute: () => rootRoute,
    path: "login",
    component: LoginLinkPage,
  }),
  patientRoute.addChildren([
    createRoute({ getParentRoute: () => patientRoute, path: "/" }),
    createRoute({ getParentRoute: () => patientRoute, path: "history" }),
    createRoute({ getParentRoute: () => patientRoute, path: "document" }),
    createRoute({ getParentRoute: () => patientRoute, path: "preparation" }),
    createRoute({ getParentRoute: () => patientRoute, path: "contacts" }),
    createRoute({ getParentRoute: () => patientRoute, path: "sources" }),
    createRoute({
      getParentRoute: () => patientRoute,
      path: "sources/$file",
      validateSearch: (
        search: Record<string, unknown>,
      ): { answer?: string } => ({
        answer: typeof search.answer === "string" ? search.answer : undefined,
      }),
    }),
  ]),
  doctorRoute.addChildren([
    createRoute({ getParentRoute: () => doctorRoute, path: "/" }),
    createRoute({ getParentRoute: () => doctorRoute, path: "registration" }),
    createRoute({ getParentRoute: () => doctorRoute, path: "unanswered" }),
    createRoute({ getParentRoute: () => doctorRoute, path: "logs" }),
    createRoute({ getParentRoute: () => doctorRoute, path: "documents" }),
    createRoute({ getParentRoute: () => doctorRoute, path: "safety" }),
  ]),
]);

function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history, scrollRestoration: true });
}

const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App({ history }: { history?: RouterHistory }) {
  const [appRouter] = useState(() =>
    history ? createAppRouter(history) : router,
  );
  return <RouterProvider router={appRouter} />;
}

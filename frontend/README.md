# WigymTrio

React + TypeScript conversion of the supplied Czech patient-assistant screen.
The proof of concept focuses on **mnohočetný myelom (multiple myeloma)** across
the patient app and practitioner portal. The intended architecture is a chat
agent with document access through a backend API, returning answers with source
citations. Patient chat connects to the Fastify backend using TanStack Query.
New questions receive live AI answers, not demo `no_answer` fallbacks.
The current API returns plain text, without structured citations or clinical
risk assessments. Tagged `[SOURCE]` sections appear under **Zdroje odpovědi**;
answers without sources show the missing-source notice. Live answers have no risk badge.
Replace the sample documents with approved materials
before enabling clinical use.
Uses Mantine v7 components with a shared screenshot-inspired theme. The sole
stylesheet import is Mantine's required `@mantine/core/styles.css`; there is no
Tailwind or custom stylesheet. Tabler supplies icons.

## Visual theme

[`src/theme/theme.ts`](./src/theme/theme.ts) centralizes the light theme:
lavender-gray page backgrounds, white bordered cards with subtle shadows,
dark patient bubbles with white text, black primary actions, compact corners,
neutral controls and red urgent states. Nested citations use tinted surfaces;
active bottom navigation uses a filled background and high-risk badges are red.
Card/control borders are explicit rather than transparent. The provider applies matching body/text CSS variables
through Mantine's resolver. Patient and staff screens share these tokens;
white document/table surfaces and critical rows are explicit semantic overrides.
Typography prefers Public Sans when available locally, with system-font fallbacks;
no external font request is made. The screenshots guide styling only: sample
content, integration notices and clinical-verification limitations are preserved.

## Navigation

TanStack Router owns browser URLs, Back/Forward navigation and scroll
restoration. Patient routes are `/` (chat), `/history`, `/document` (demo document),
`/preparation`, `/contacts`, `/sources` (knowledge list) and `/sources/$file`
(knowledge detail).
The patient layout keeps chat, preparation and contact screens mounted when
switching sections so in-memory drafts and checklist state survive navigation.
Email is never included in the URL or browser storage; opening a fresh chat or
history URL requires entering it again. The demo document route can open directly;
its citation highlight is available only when opened from a chat citation.
History and document back buttons return to `/`, while browser Back/Forward
follows the actual navigation stack. Unknown URLs show the not-found page.
The chat toolbar (history, new chat, help and settings) stays sticky below the
application header while scrolling through messages.
The active chat title is centered between the new-chat and help controls,
with long titles truncated to keep the controls accessible.
The **Zpět na konverzaci** bars in chat history and document detail also stay
sticky below the application header.
Selecting the **Zprávy** bottom tab scrolls instantly to the bottom after
navigation, without animation.
Source links that return to a specific answer retain their targeted scrolling.

Staff routes are `/doctor` (overview), `/doctor/unanswered`, `/doctor/logs`,
`/doctor/documents`, `/doctor/safety` and `/doctor/registration`. Switching staff sections keeps local
review state mounted. These demo routes do not provide authentication.
Production hosting must serve `index.html` for frontend routes while keeping
`/api` requests proxied to the backend.

### Patient registration and QR login

Open **Registrace pacientů** in the doctor portal (`/doctor/registration`).
Submitting an email calls `POST /api/user`; success displays the generated key,
a copyable login link and a QR code rendered locally with `qrcode.react` (no
external QR service receives credentials). Registration errors are shown without
generating a link. **Registrovat dalšího pacienta** clears the displayed result.

The link targets the current frontend origin at
`/login#email=...&key=...`. Credentials are URL-encoded in the fragment, not the
frontend query string. The login page removes the fragment from the current
browser history entry before authenticating, verifies the resulting cookie,
clears previous patient caches, and opens chat. Missing credentials or failed
authentication show an error and a way to open manual login.

Treat the QR code and link as reusable credentials: anyone possessing them can
sign in as that patient. Share them privately, use HTTPS, and do not store them
in analytics or browser storage. The existing backend login contract still
sends credentials in the API query string; redact it in server access logs.
The registration page performs real API writes, unlike the other demo staff
screens. Staff authentication and role-based authorization are not implemented;
the doctor URL alone is not access control. No email is automatically sent.

## Patient chat history

[`ChatHistoryPage`](./src/pages/ChatHistoryPage.tsx) shows the previous-chats list
from [`ChatHistory`](./src/components/ChatHistory.tsx) as a separate in-app page,
opened using **Historie**. Like source documents, it opens at the top, hides the
chat composer and restores the original scroll position on return. Selecting
any saved conversation scrolls instantly to the bottom once its messages load. Settings and new-chat actions use labeled icon buttons with
tooltips; help is a text button with an icon. After email-and-key login, the app loads
the authenticated user's saved chats from the backend. Selecting one loads its messages and restores its unsent draft;
new chats start empty and take their title from the first submitted question.
History is sorted by the last message timestamp, with an active-chat indicator
and message counts for chats whose messages have been loaded (the session-list
API does not return counts). Document and citation components remain available for
future structured API responses.

[`useChat`](./src/api/useChat.ts) uses an email-scoped TanStack Query for the
server session list, per-session queries for messages, and in-memory drafts.
[`src/types/conversations.ts`](./src/types/conversations.ts) separates full
conversation data from history summaries without changing the message union.
The history component receives summaries and selection/new-chat callbacks;
`ChatScreen` accepts an optional controlled `draft` for conversation-specific
composer state. Sessions and submitted messages are stored by the backend.
Refreshing loses unsent drafts; a valid login cookie restores the authenticated
user and saved chats without requiring the access key again.
History refreshes when opened and after chat creation or submission, with
explicit loading, empty, error and retry states. The backend stores the first
question as the session title and updates its activity timestamp.
The frontend checks the existing login cookie with the backend before showing
the login form. Missing or expired cookies require email-and-key login.
Session-check server or network errors are displayed with a retry action.
There is no retention management.
No chat messages, email or access key are written to browser storage. The backend
stores the login JWT in an HttpOnly cookie.

The chat composer is fixed above the shell's bottom navigation, including its
safe-area offset, and uses the same container width as the page. Its measured
height reserves scroll space so messages and the final medical disclaimer are
not covered. Suggested questions appear only in empty conversations. The
disclaimer remains at the end of the scrollable content rather than in the
floating input bar, so it is reached when scrolling to the bottom. Hidden
patient sections and document views also hide the composer.

The conversation is the default view, without a permanent visit card or
demo-state tabs. **Nastavení chatu** opens reading preferences and visit details;
**Nápověda** opens a short usage guide and an expandable connection-failure demo.
History, new-chat, help and settings controls form a compact toolbar, with settings
last and white backgrounds on history and help. The composer uses a placeholder
and an accessible name without a visible input label. The demo notice is a compact text
line, the welcome message appears only in empty chats, and feedback actions use
compact secondary buttons. Citation links, urgent states, history drafts,
floating input and scroll restoration remain available.

## Run

Use Node.js 22.12+, 24+, or 26+ (the supported versions for the test runner).

```sh
npm install
npm run dev
```

```sh
npm test
npm run lint
npm run build
```

### Backend connection

Start the backend separately from `backend/` with `npm ci` and `npm run dev`,
using its required environment variables: `DATABASE_URL`, `KNOWLEDGE_BASE_PATH`,
`OPENAI_BASE_URL`, `OPENAI_API_KEY`, `COOKIE_SECRET` and `JWT_SECRET`. The PostgreSQL schema must be provisioned
using `npm run db:push`. Keep backend credentials out of frontend environment
variables. The default backend port is 3000.

Vite proxies `/api` to `http://localhost:3000`. For production, configure your
web server to proxy `/api` to the backend too. Alternatively set
`VITE_API_BASE_URL` to the API base URL (including `/api`) at build time; an
external origin requires credentialed CORS support at the backend or reverse proxy.
Vite's preview server is not a production API proxy.

The frontend first checks `GET /api/auth/me` to restore an existing login.
Otherwise, the patient enters an email and access key before opening the chat.
The frontend calls the backend login endpoint and verifies the resulting cookie
before opening the chat. Failed logins show an error and allow manual retry. Requests include
credentials so the browser accepts and sends the HttpOnly login cookie. The
backend marks that cookie `Secure`; use HTTPS for reliable cookie authentication.
The key is sent in the query string to match the current backend contract, so
deployment access logs must redact login query parameters. Do not deploy this
proof of concept with sensitive data.
The integration calls:

- `POST /api/auth/logout` to clear the HttpOnly login cookie. **Odhlásit se**
  is available in the header Avatar's account dropdown when signed in. It
  returns to the login form and clears cached chat, knowledge and user data.
  Failed logout requests show an error and allow retry without claiming success.
- `GET /api/auth/me` to obtain the current user's ID and email from the verified
  login cookie. HTTP 401 means the login is missing or expired; other failures
  are surfaced rather than treated as logged out.
- `GET /api/auth?email=...&key=...` with URL-encoded credentials to log in.
  Success returns HTTP 204 with an empty body and sets the login cookie.
- `POST /api/chat/new` with `{ email }` to create each session.
- `GET /api/chat` to list the authenticated user's sessions. The backend uses
  the JWT user ID; no email or user ID is sent in the request URL.
- `GET /api/chat/:sessionId` to load the authoritative conversation.
- `GET /api/knowledge` to list available Markdown filenames.
- `GET /api/knowledge/:file` to load the selected file as Markdown text.
- `POST /api/chat/:sessionId` with `{ content }` to send a question, then
  reloads the full history because POST returns only newly generated messages.

System prompts and tool output are not displayed. Pending requests disable
submission and creation of another chat. Errors are displayed explicitly;
submitted questions appear immediately with a loading indicator below them.
The temporary question is replaced by server history when the answer arrives,
or rolled back on failure before reloading any messages the server saved.
On submission, the chat scrolls to the bottom of the loading indicator, leaving
room for the fixed composer and navigation. Once the answer arrives, it scrolls
to the top of the first new answer below the app header. Existing history and
hidden chat views do not trigger automatic scrolling.
Failed submissions restore the draft, and **Načíst zprávy** reloads history
without resending the question. POST requests are never retried automatically,
because a failed response may still have persisted the question.
Backend history saves each submitted question once and final AI answers only,
not incomplete tool exchanges that cannot be replayed on later turns.
Reading level, feedback, appointments, preparation, contacts and the doctor
dashboard have no matching backend endpoints and remain local/demo features.

ESLint uses [`eslint.config.ts`](./eslint.config.ts) for TypeScript, React Hooks,
React Refresh, import sorting and Prettier checks. Run `npm run lint:fix` to apply
automatic fixes. Source files use browser globals; tooling configs use Node.js
globals. Build output is ignored.

## Integration

- [`src/types/chat.ts`](./src/types/chat.ts) defines chat messages; answer risk
  is optional because the backend does not return a clinical risk assessment.
- [`ChatScreen`](./src/components/ChatScreen.tsx) is a controlled integration
  boundary for messages, reading level, loading, contacts, procedure and callbacks.
- [`MessageCard`](./src/components/MessageCard.tsx) first narrows on `sender`
  (user messages have no `kind`), then exhaustively switches on assistant `kind`.
- [`src/config/contacts.ts`](./src/config/contacts.ts) owns FN Ostrava contact defaults.
  Components resolve contacts by `contactId`. Override the reception number
  with `VITE_RECEPTION_PHONE` in `.env.local`, then restart Vite. Missing contacts
  display an explicit alert instead of dialing an emergency number as a fallback.
- `emergencyContactId` identifies the configured medical emergency contact used
  when `call155` is true; `emergencyContactIds` supplies the safety notice contacts.
  Pass actual configured IDs rather than phone numbers to these props.
- `onSend(text, readingLevel)` passes the selected reading level to the host.
  The host must obtain approved simple/detailed content; the UI does not rewrite
  medical advice or modify existing answers on level changes.
- Feedback, procedure changes and retries are delegated to the host.
  Set `pending` during requests and pass returned messages back into the screen.
  Manage delivery errors and draft persistence in the host as appropriate.

### Message variants

The components support all three Stitch response states through the `kind`
union. Live plain-text responses currently use only `answer`:

- `answer`: optional risk badge, answer text, citation count, source metadata and feedback.
  Answers without citations show an explicit missing-source notice.
  Complete `[SOURCE]...[/SOURCE]` sections in answer text are moved into
  **Zdroje odpovědi** and included in its source count alongside structured
  citations. Tagged sources share one card with an unordered list.
  Markdown links, emphasis, ISBNs and `.md` filenames are preserved;
  Markdown fences around source sections are unwrapped. Sources are not given
  invented versions or approval metadata. Empty sections
  do not suppress the missing-source notice, and incomplete tags remain visible.
  [`MarkdownAnswer`](./src/components/MarkdownAnswer.tsx) renders assistant text
  as Markdown with Mantine typography: headings, emphasis, lists, quotes,
  inline/fenced code and GitHub-flavored tables, task lists and strikethrough.
  Wide tables and code blocks scroll horizontally inside the answer.
  Links open in a separate tab with opener isolation. Raw HTML and images are
  disabled, and unsafe link protocols are filtered; user messages remain plain text.
- `no_answer`: neutral missing-materials notice and a recommended contact resolved
  from `contactId`. This is distinct from the connection failure/retry panel.
- `escalation`: red urgent-action alert displaying the supplied `instruction`,
  responsible contact and an additional emergency action only when `call155`
  requests it. Identical contact IDs are not duplicated.

[`MessageContactPanel`](./src/components/MessageContactPanel.tsx) shares contact
presentation between the latter two variants. Set `VITE_WARD_PHONE` for the demo's
on-call department number; unset numbers show an explicit configuration alert.
The example hospital phone numbers and opening hours in Stitch are not assumed
to be real configuration.

Pass `onOpenSource(citation)` to
[`ChatScreen`](./src/components/ChatScreen.tsx) to connect citation buttons to your
document viewer. Without this callback, buttons are disabled with an explanation.
The offline demo opens the document-detail page for the supplied sample document,
or an unavailable-document modal for other sources. Protocol-verification and non-generative guarantees
from the mockup are not asserted by the UI: the message types do not carry proof
of these claims.

### Knowledge library

**Zdroje** lists files as full-width document buttons from the knowledge API, with loading, empty, error and
retry states. Selecting a file opens `/sources/$file` and renders its Markdown
using the same safe typography as chat answers. Files load on demand and are
cached with TanStack Query; the file-list query is shared with chat source matching.
Known filenames in `[SOURCE]` blocks, whether plain text, inline code or relative
Markdown links, open the corresponding internal file page. Existing structured
citations also open knowledge files when their ID or title matches a filename.
External web URLs remain external; unknown filenames are not given invented links.
Files opened from chat carry the answer ID in the URL. **Zpět na odpověď v chatu**
returns to the mounted chat and scrolls to that specific answer without losing
the conversation or unsent draft. Files opened from the library return to the
source list instead. A full browser reload restores a valid login cookie but
still requires selecting the chat again; email and chat content are not stored
in URLs.

### Document detail

[`DocumentDetailPage`](./src/pages/DocumentDetailPage.tsx) renders the second
Stitch screen within the existing mobile shell (no duplicate fixed header).
Opening a citation preserves the chat state and draft; either back button
returns to the conversation. No router is required.
Opening the document saves the chat's window scroll position and immediately
scrolls to the top. Both return buttons restore that position after the chat
content is visible again.

- [`src/types/documents.ts`](./src/types/documents.ts) defines typed document
  metadata, available pages, paragraph/citation sections and an optional PDF.
- [`DocumentMetadataCard`](./src/components/DocumentMetadataCard.tsx) shows the
  title, version, code, guarantor, approval date and institution.
- [`DocumentToolbar`](./src/components/DocumentToolbar.tsx) provides adjacent-page
  navigation and a case-insensitive search of the displayed title and body, with
  highlighted matches and an explicit match count.
- [`DocumentPageContent`](./src/components/DocumentPageContent.tsx) renders the
  chapter and quoted passage. Citation labeling requires matching document ID,
  version and quote text.

The document viewer retains a sample page 4 of 8 layout. The myeloma demo in
[`src/data/documents.ts`](./src/data/documents.ts) marks that limitation explicitly:
unavailable adjacent pages and PDF download are disabled, not simulated. Pass
additional `pages` and `pdf: { url, sizeLabel }` when real resources are available.
The metadata and content are explicitly synthetic, not an approved hospital
document. No real guarantor or approval is claimed. Support uses the configured
hematology reception contact.

When using the page with a different document/citation, remount it with a key
including the document ID, version and citation page to reset its local viewer
state, as the demo does.

[`src/App.tsx`](./src/App.tsx) is a proof of concept with connected chat, not a medical
service. Chat retry reloads server messages; appointment and feedback actions
remain demos without backend endpoints. Myeloma fixture content, citation
metadata and appointment dates are demonstration fixtures, not independently
verified clinical sources. No reviewer identity is invented because the supplied `Citation` type
does not include a reviewer.

The loading indicator is conditional rather than permanently appearing before a
completed answer. Mantine supplies typography, colors, cards, tabs and controls.

## Mobile application shell

## Practitioner desktop dashboard

Open `/doctor` (or `/doctor/`) for the separate desktop practitioner portal;
`/` remains the patient application. The portal does not render the mobile
patient header or bottom navigation. Direct URLs use Vite's SPA fallback. In
production, configure the host to serve `index.html` for `/doctor` and
`/doctor/`; this is client-side URL selection, not a second server application.
Links between portals use normal page navigation; unknown paths show a
not-found message. No routing dependency was added.

[`DoctorDashboardPage`](./src/pages/DoctorDashboardPage.tsx) contains the
practitioner dashboard, with small typed components:

- [`DoctorAppShell`](./src/components/DoctorAppShell.tsx): desktop sidebar,
  separate staff header and collapsible navigation on smaller screens.
- [`DashboardMetrics`](./src/components/DashboardMetrics.tsx): four sample KPIs.
- [`ReviewQueue`](./src/components/ReviewQueue.tsx): three sample questions,
  local review notes and explicit demo-only resolution state.
- [`AuditLogTable`](./src/components/AuditLogTable.tsx): three sample audit
  records with sources and critical-risk indicators.
- [`src/types/dashboard.ts`](./src/types/dashboard.ts) and
  [`src/data/dashboard.ts`](./src/data/dashboard.ts): typed fixtures and CSV
  serialization.

CSV export downloads the three displayed sample audit records, escaping quoted
fields and neutralizing spreadsheet-formula prefixes. It does not export
production records, queue notes or fictitious additional pages. Refresh reports
that live data is unavailable; unsupported department/time filters are disabled.
Document management, safety settings and crisis-protocol actions show explicit
integration notices instead of pretending to perform clinical operations.

The mockup's 342 conversations, 318 answers, 19 unanswered questions and 5
escalations are labeled sample aggregate metrics, not live totals derived from
the three example rows. Local queue resolution changes only the pending sample
queue count. Notes/status reset on reload; no patient is contacted and no
emergency call is placed.

**This is an unauthenticated UI demo. A different URL is not access control.**
Before connecting real records, implement server-side authentication,
authorization by role/department, secure APIs and durable audit storage.
No actual clinician identity, live operational status, MDR/ISO compliance,
anonymization guarantee or retention policy is asserted by this demo.

### Patient shell layout

[`MobileAppShell`](./src/components/MobileAppShell.tsx) wraps page content in
Mantine's `AppShell.Main` and keeps one bottom navigation fixed in
`AppShell.Footer` at every viewport width. Main content automatically reserves
space for the footer, including the mobile bottom safe area.

[`AppHeader`](./src/components/AppHeader.tsx) owns the shared title, medical help
contact and patient avatar. Its rendered height is measured with Mantine's
`useElementSize`, so the fixed header and main offset follow content wrapping
and resizing rather than assuming a fixed height. Header and main use matching
Mantine containers with `md` padding; pages should not add another outer container.
Chat keeps only its page-specific reading-level controls.

Pass `children`, `activeSection` and `onNavigate` to connect your own pages or
router. [`src/App.tsx`](./src/App.tsx) currently selects the chat page for
`messages`, the preparation page for `preparation`, the contacts directory for
`contacts` and the knowledge library for `sources`, using TanStack Router.
The chat page
no longer owns navigation or opens navigation demo modals.

## Preparation page

[`PreparationPage`](./src/pages/PreparationPage.tsx) implements the preparation/
context Stitch screen under the **Příprava** navigation item. The shared shell
provides the header and fixed navigation; no page-level CSS or duplicate shell
is added.

- [`PreparationForm`](./src/components/PreparationForm.tsx) edits procedure type,
  local appointment date/time and department with required-field validation.
- [`PreparationPhaseCard`](./src/components/PreparationPhaseCard.tsx) displays
  accessible checkboxes and dated step times across three sample phases.
- [`src/types/preparation.ts`](./src/types/preparation.ts) defines the profile,
  phase and step props; [`src/data/preparation.ts`](./src/data/preparation.ts)
  contains the sample profile and timeline calculation.

The initial sample has 2 of 8 steps checked (25%). Progress is calculated from
the actual checklist. Saving applies the form; unsaved edits do not change the
displayed plan. Changing procedure or date/time resets completion; changing
only the department preserves it. Chat and preparation stay mounted across
navigation so drafts and checklist changes survive section switches, but
reloading the browser resets them. There is no backend or device storage.

Recalculation is explicitly a UI demo, **not approved clinical scheduling**.
It shifts an organizational consultation checklist around the selected visit:
collecting reports, listing medications, preparing questions and attending the
appointment. It contains no medication timing, fasting instructions or treatment
regimen. Dates use the browser's local timezone; no hospital timezone is assumed.
Treatment visits and follow-ups show an unavailable-plan notice rather than
inventing individual clinical instructions.
Saving does not book an appointment, alter the chat's example context or medical
answers, or enable mobile notifications. Those integrations need approved
procedure-specific data and a backend.

## Contacts directory

[`ContactsPage`](./src/pages/ContactsPage.tsx) implements the contacts Stitch
screen under **Kontakty**, reusing the shared shell and configured telephone
links. Emergency actions appear first, followed by the FN Ostrava myeloma
ambulance, hematology reception, expandable GP details and inpatient information.

Published defaults checked against the official FN Ostrava website on 2026-10-17:

| Purpose | Telephone | Published availability | Source |
| --- | --- | --- | --- |
| Myeloma ambulance | +420 704 960 513 | 7:00–15:00 (days not specified for this specialty) | [Ambulance](https://www.fno.cz/klinika-hematoonkologie/ambulance) |
| Hematology reception | +420 597 372 754 | Bookings 13:00–15:00; general ambulance Mon–Fri 7:30–13:45 | [Ambulance](https://www.fno.cz/klinika-hematoonkologie/ambulance) |
| Booking service | +420 597 372 754 | Mon–Fri 7:00–15:30; best to call 13:00–15:00 | [Objednávání](https://www.fno.cz/klinika-hematoonkologie/objednavani) |
| Information about hospitalized patients | +420 553 048 832 | Mon–Sun 12:00–15:00 | [Specialist contacts](https://www.fno.cz/klinika-hematoonkologie/kontaktni-udaje) |

Ambulance location: building T, third floor. Each hospital card links to its
official source; availability may change. The inpatient information line is
not an emergency or on-call service and has its own ID, separate from `ward`.
No unverified 24-hour ward number or personal GP is provided.

- [`ContactDirectoryCard`](./src/components/ContactDirectoryCard.tsx) shows
  contact guidance, configured hours, phone number and call action.
- [`GpContactCard`](./src/components/GpContactCard.tsx) provides an accessible
  show/hide toggle; its disclosure state survives navigation between sections.
- [`EmergencyContactsCard`](./src/components/EmergencyContactsCard.tsx) resolves
  medical-emergency and general-emergency links from the contacts config.
- [`src/data/contactDirectory.ts`](./src/data/contactDirectory.ts) contains the
  directory descriptions and contact IDs, never telephone numbers.

Override defaults or supply personal/on-call contacts in `.env.local` and restart Vite.
Custom phone overrides do not carry the official-source link or location of the
default number:

| Contact | Phone | Hours |
| --- | --- | --- |
| Myeloma ambulance (legacy coordinator config keys) | `VITE_COORDINATOR_PHONE` | `VITE_COORDINATOR_HOURS` |
| Clinic | `VITE_CLINIC_PHONE` | `VITE_CLINIC_HOURS` |
| GP | `VITE_GP_PHONE` | `VITE_GP_HOURS` |
| Out-of-hours department | `VITE_WARD_PHONE` | `VITE_WARD_HOURS` |

`VITE_GP_NAME` optionally supplies the GP's display name. No assigned doctor,
opening hours, hospital numbers or revision/verification guarantees are inferred
from the mockup. Missing phones show explicit alerts rather than emergency
fallbacks; missing hours are labeled as not configured. The clinic, coordinator
and existing hematology reception are separate IDs, even if a deployment later
configures the same phone number for them. All Vite environment values are
public client configuration: do not use them for private patient records or
secrets. A patient-specific GP should come from the authenticated host instead.

## Component files

- [`ChatScreen.tsx`](./src/components/ChatScreen.tsx): conversation and on-demand settings/help.
- [`AppHeader.tsx`](./src/components/AppHeader.tsx): shared application title, help and avatar.
- [`ChatHeader.tsx`](./src/components/ChatHeader.tsx): reading-level preferences in chat settings.
- [`ProcedureCard.tsx`](./src/components/ProcedureCard.tsx): appointment context.
- [`Conversation.tsx`](./src/components/Conversation.tsx): messages and pending state.
- [`MessageCard.tsx`](./src/components/MessageCard.tsx): sender and union rendering.
- [`AnswerCard.tsx`](./src/components/AnswerCard.tsx): answer, risk and feedback.
- [`CitationCard.tsx`](./src/components/CitationCard.tsx): source metadata and quote.
- [`NoAnswerCard.tsx`](./src/components/NoAnswerCard.tsx): unverified-answer fallback.
- [`EscalationCard.tsx`](./src/components/EscalationCard.tsx): contact escalation.
- [`ContactButton.tsx`](./src/components/ContactButton.tsx): configured telephone link.
- [`HelpPanel.tsx`](./src/components/HelpPanel.tsx): empty/help state.
- [`OutagePanel.tsx`](./src/components/OutagePanel.tsx): outage and retry.
- [`QuestionComposer.tsx`](./src/components/QuestionComposer.tsx): suggestions and input.
- [`SafetyNotice.tsx`](./src/components/SafetyNotice.tsx): disclaimer and emergency contacts.
- [`BottomNavigation.tsx`](./src/components/BottomNavigation.tsx): navigation actions with labeled icons.
- [`BottomNavigationButton.tsx`](./src/components/BottomNavigationButton.tsx): mobile navigation button with an icon above a visible label, a 56px touch target and active-page indication.
- [`MobileAppShell.tsx`](./src/components/MobileAppShell.tsx): fixed bottom navigation and page layout.

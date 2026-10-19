# Backend

Run `npm install` and configure the environment variables used by the backend,
then start the development server with `npm run dev`.

## API documentation

The running backend serves Swagger UI at `/docs` (by default,
`http://localhost:3000/docs`). The generated OpenAPI specification is available
as JSON at `/docs/json` and YAML at `/docs/yaml`. Documentation is generated from
the Fastify route schemas.

User registration (`POST /api/user`) and login (`GET /api/auth`) are public.
Other API routes require a JWT, either in the `access_token` cookie set by login
or in the `Authorization: Bearer <token>` header. Use Swagger UI's **Authorize**
button with the `bearerAuth` scheme to try protected endpoints with a JWT.
Browser restrictions prevent Swagger UI from manually setting the cookie
header; cookie authentication requires an existing login cookie on the same
origin. The login cookie is marked `Secure`, so browser cookie use requires a
secure context.

The documentation endpoints themselves are public; API authentication and
resource ownership checks still apply to requests made through Swagger UI.

`GET /api/auth/me` verifies the existing JWT and returns only the current user's
ID and email. It returns HTTP 401 for an invalid/expired session or a deleted user,
and successful responses use `Cache-Control: no-store`. The frontend uses this
endpoint to restore login state after a page reload without reading the
HttpOnly cookie.

Run `npm run build` to compile and type-check the backend.
The production build emits `dist/index.js` and rewrites TypeScript `@/`
aliases to relative paths so `npm start` runs without a TypeScript loader.
Test files are excluded from the production build.

For a combined frontend/backend container and PostgreSQL setup, see the
[root Docker instructions](../README.md#docker). `HOST` controls the listen
address (default `localhost`); Docker sets it to `0.0.0.0`.
`FRONTEND_PATH`, when set to an absolute frontend build path, enables static
hosting and browser-route fallback without masking missing API/docs/assets.

## Agent execution

Each question supports up to five tool rounds and twenty total tool calls,
with at most six model requests so the final tool round can be followed by an
answer. Exceeding a limit, receiving an incomplete answer, or a tool throwing
an error fails the invocation explicitly; partial exchanges are not committed
to the agent's in-memory history. These limits bound execution counts, not
wall-clock time or token usage.

Run `npx tsx --test src/lib/ai.test.ts` from the backend directory to test the
loop using mocked model responses without making external API calls.

`POST /api/auth/logout` expires the HttpOnly `access_token` cookie using the
same path as login and returns HTTP 204. It also works for an expired or missing
session. This removes the browser login; it does not revoke copies of the JWT,
which remain valid until they expire.

## Agent prompt guardrails

New chat sessions include medical-safety and prompt-injection instructions in
their initial system messages. These cover document-grounded answers and real
citations, no personalized diagnoses or treatment/dose changes, uncertainty,
privacy, and urgent escalation without delaying for document retrieval.
User text and retrieved documents are treated as evidence rather than trusted
instructions; tool use is restricted in the prompt to listed documents.

These are model instructions, not guaranteed enforcement or a substitute for
server-side tool validation, access controls, clinical review, or adversarial
testing. No clinical or prompt-injection effectiveness is established by a
TypeScript build.

Initial system messages are stored when a session is created. Existing sessions
keep their previously stored prompt; start a new chat to use these guardrails.

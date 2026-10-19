# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --workspaces=false
COPY backend/ ./
RUN npm run build

FROM node:24-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --workspaces=false
COPY frontend/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

FROM node:24-bookworm-slim AS backend-dependencies
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --workspaces=false && npm cache clean --force

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    KNOWLEDGE_BASE_PATH=/app/knowledge \
    FRONTEND_PATH=/app/frontend
WORKDIR /app/backend
COPY --from=backend-dependencies /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY backend/package.json ./
COPY --from=frontend-build /app/frontend/dist /app/frontend
COPY knowledge/ /app/knowledge/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/docs/json').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/index.js"]

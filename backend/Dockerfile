# --- Build stage -------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
# Use npm install (not ci) so platform-specific optional binaries (esbuild, etc.)
# resolve correctly for the linux/amd64 build regardless of the host that
# generated the lockfile.
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage -----------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist

# App Runner expects the service to listen on this port.
EXPOSE 8080

# Run as the built-in non-root user for a smaller attack surface.
USER node

CMD ["node", "dist/index.js"]

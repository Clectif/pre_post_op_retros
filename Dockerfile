# Imagen de producción para Cloud Run
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Las NEXT_PUBLIC_* se incrustan en el JavaScript al compilar: ponerlas solo en Cloud Run no sirve.
# /backend es la pasarela de app/backend/[...path]/route.ts; no es un secreto, va fija.
ENV NEXT_PUBLIC_API_BASE=/backend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
# Cloud Run inyecta PORT (8080 por defecto); el servidor standalone lo respeta
EXPOSE 8080
CMD ["node", "server.js"]

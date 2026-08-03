# --- Étape 1 : build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

# --- Étape 2 : image de production, allégée (sortie standalone Next.js) ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN addgroup -S rogweb && adduser -S rogweb -G rogweb
USER rogweb

EXPOSE 3000
CMD ["node", "server.js"]

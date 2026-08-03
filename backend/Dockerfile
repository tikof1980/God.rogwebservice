# --- Étape 1 : build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : image de production, allégée ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Utilisateur non-root — bonne pratique de sécurité en conteneur
RUN addgroup -S rogweb && adduser -S rogweb -G rogweb
USER rogweb

EXPOSE 3001
CMD ["node", "dist/main.js"]

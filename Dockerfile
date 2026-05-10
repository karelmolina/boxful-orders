FROM node:22-alpine

WORKDIR /app

# Instalar herramientas de compilación necesarias para dependencias nativas (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/main"]

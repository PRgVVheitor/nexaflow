FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://postgres:postgres@db:5432/nexaflow?schema=public" npm run prisma:generate

COPY src ./src

EXPOSE 3001

CMD ["npm", "start"]

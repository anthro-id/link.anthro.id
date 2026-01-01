FROM node:24-trixie-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY src ./src

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "dev"]
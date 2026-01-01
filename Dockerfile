FROM node:24-trixie-slim AS base

COPY package.json pnpm-lock.yaml ./
COPY src ./src

RUN corepack enable && \
  corepack prepare pnpm@latest --activate && \
  pnpm install --frozen-lockfile

CMD ["pnpm", "start"]
FROM node:24-trixie-slim AS base

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml jsconfig.json ./
COPY src ./src

RUN corepack enable && \
  corepack prepare pnpm@latest --activate && \
  pnpm install --frozen-lockfile

CMD ["pnpm", "start:no-env"]
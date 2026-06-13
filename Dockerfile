# build
FROM node:24-alpine AS base

COPY package.json jsconfig.json ./
COPY src ./src

RUN npm install

# production
FROM gcr.io/distroless/nodejs24-debian13

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app ./

CMD ["pnpm", "start:no-env"]
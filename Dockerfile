# build
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev && npm cache clean

COPY src ./src

# production
FROM gcr.io/distroless/nodejs24-debian13

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

CMD ["npm", "run", "start:no-env"]
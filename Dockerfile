FROM node:24-trixie-slim AS base


COPY package.json ./
COPY src ./src

RUN npm install

CMD ["npm", "run", "dev"]
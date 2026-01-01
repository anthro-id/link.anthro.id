FROM node:lts-alpine AS base

COPY package.json ./
COPY src ./src

RUN npm install

CMD ["npm", "run", "dev"]
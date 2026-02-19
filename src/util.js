import ms from "ms";

const command = process.env.npm_lifecycle_event;

export function isProduction() {
  return (command === "start" || command === "start:no-env");
};

export function isProductionWithoutEnv() {
  return command === "start:no-env";
};

export function generateCacheControlHeader(ttl = Math.floor(ms("7d") / 1000)) {
  return ["public", `max-age=${ttl}`, "immutable"].join(", ");
};
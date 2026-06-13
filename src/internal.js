const command = process.env.npm_lifecycle_event || "start:no-env";

export function isProduction() {
  return (command === "start" || command === "start:no-env");
};

export function isProductionWithoutEnv() {
  return command === "start:no-env";
};
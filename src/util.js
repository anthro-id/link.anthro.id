import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";

import ms from "ms";

import { randomBytesLength, cacheKey } from "./config.js";
import redis from "./services/redis.js";

export function generateCacheControlHeader(ttl = Math.floor(ms("7d") / 1000)) {
  return ["public", `max-age=${ttl}`, "immutable"].join(", ");
};

export async function generateUniqueCode() {
  /**
   * @type string | null
   */
  let newIdentifier = null;
  
  let retries = 0;
  while (retries <= 3) {
    if (retries >= 1) {
      await setTimeout(1000);
    };

    newIdentifier = randomBytes(randomBytesLength).toString("base64url");

    const isExists = await redis.hexists(cacheKey, newIdentifier);
    if (isExists !== 0) {
      retries++;
      continue;
    };

    break;
  };

  return newIdentifier;
};
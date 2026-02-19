export const randomBytesLength = 4;

export const cacheKey = "links";

export const limit = {
  identifier: 6,
  rawUrl: 2048
};

/**
 * @type { Map<string, { url: string, ttl?: number }> }
 */
export const cachedUrls = new Map();

/**
 * @type {Partial<import("express-rate-limit").Options>}
 */
export const ratelimitConfig = {
  standardHeaders: "draft-8",
  legacyHeaders: false
};
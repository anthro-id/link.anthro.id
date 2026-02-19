export const randomBytesLength = 4;

export const cacheKey = "links";

export const limit = {
  identifier: 6,
  rawUrl: 2048
};

/**
 * @type {Partial<import("express-rate-limit").Options>}
 */
export const ratelimitConfig = {
  standardHeaders: "draft-8",
  legacyHeaders: false
};
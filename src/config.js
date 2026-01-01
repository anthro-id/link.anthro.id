import ms from "ms";

export const randomBytesLength = 4;

export const limit = {
  identifier: 6,
  rawUrl: 2048
};

export const cacheControlDefaultValue = [
  "public", `max-age=${ms("7d")}`, "immutable"
].toString(", ");

export const cachedUrls = new Map();

/**
 * @type {Partial<import("express-rate-limit").Options>}
 */
export const ratelimitConfig = {
  standardHeaders: "draft-8",
  legacyHeaders: false
};
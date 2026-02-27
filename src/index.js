import { isProduction as _isProduction, generateCacheControlHeader } from "./util.js";

const isProduction = _isProduction();
process.env.NODE_ENV = isProduction ? "production" : "development";

const PORT = +(process.env.PORT || 3000);
if (isNaN(PORT)) {
  throw new Error("PORT contains invalid value.");
};

import pkg from "../package.json" with { type: "json" };
import { randomBytes } from "node:crypto";
import Express from "ultimate-express";
import ratelimiter from "express-rate-limit";
import ms from "ms";
import isBase64 from "validator/lib/isBase64.js";
import isURL from "validator/lib/isURL.js";

import redis from "./services/redis.js";
import { limit, cacheKey, randomBytesLength, ratelimitConfig } from "./config.js";

const app = Express();
const { raw, text } = Express;

if (isProduction) {
  app.set("trust proxy", true);
};

const initialAuthKey = process.env.REQUEST_KEY;

app.use(ratelimiter({ ...ratelimitConfig, identifier: "main", limit: 5, windowMs: ms("1m") }), (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (typeof initialAuthKey === "string" && initialAuthKey.length > 0) {
      const header = req.get("Authorization");
      if (!header || typeof header !== "string" || header.length <= 0) {
        return res.status(401).send("Authorization required.");
      };

      const [scheme, key] = header.split(" ");
      if (!scheme.startsWith("Bearer") || key !== initialAuthKey) {
        return res.sendStatus(401);
      };
    };
  };

  res.setHeader("X-Powered-By", `link.anthro.id (Build ${pkg.version})`);

  next();
});

app.param("identifier", (req, res, next, identifier) => {
  if (req.method !== "GET" && (!identifier || typeof identifier !== "string" || identifier.length <= 0)) {
    return res.status(400).send("Invalid URL identifier.");
  };

  if (identifier.length !== limit.identifier || !isBase64(identifier, { urlSafe: true })) {
    return res.status(400).send("The identifier contains invalid format.");
  };

  return next();
});

app.get("/ping", (_, res) => res.sendStatus(204));

app.get(["/", "/:identifier"], raw({ limit: 0 }), async (req, res) => {
  const { identifier } = req.params || {};
  if (!identifier || typeof identifier !== "string" || identifier.length <= 0) {
    return res.redirect(pkg.repository.url);
  };

  const [url, ttl] = await redis.multi()
    .hget(cacheKey, identifier)
    .httl(cacheKey, identifier)
    .exec();

  if (!url || typeof url !== "string" || !isURL(url, { protocols: ["https"] })) {
    return res.status(400).send("Malformed destination URL.");
  };

  const ttlValue = ttl[0];

  return res.setHeader("Cache-Control", generateCacheControlHeader((!ttlValue || ttlValue <= 0) ? undefined : ttlValue)).redirect(302, url);
});

app.post("/", ratelimiter({ ...ratelimitConfig, identifier: "post", limit: 2, windowMs: ms("5m") }), text({ limit: limit.rawUrl, type: "text/plain" }), async (req, res) => {
  const rawUrl = req.body;
  if (!rawUrl || typeof rawUrl !== "string" || !isURL(rawUrl, { protocols: ["https"], max_allowed_length: limit.rawUrl })) {
    return res.status(400).send("Invalid or malformed input URL.");
  };

  const ttl = typeof req.query.ttl === "string" ? +req.query.ttl : null;
  if (ttl !== null) {
    if (isNaN(ttl)) {
      return res.status(400).send("The \"ttl\" value must be a number.");
    };

    if (ttl < 30 || ttl > 3.156e+7) {
      return res.status(400).send("The \"ttl\" value must be in between 30 seconds and a year (31,536,000 seconds).");
    };
  };

  try {
    let newIdentifier;

    let retries = 0;
    while (retries < 3) {
      newIdentifier = randomBytes(randomBytesLength).toString("base64url");

      const isExists = await redis.hexists(cacheKey, newIdentifier);
      if (isExists !== 0) {
        retries++;
        continue;
      };

      break;
    };

    if (!newIdentifier || retries >= 3) {
      return res.status(500).send("The identifier resource generation is exhausted, try again later.");
    };

    const transactions = redis.multi();

    transactions.hset(cacheKey, {
      [newIdentifier]: rawUrl
    });

    if (ttl !== null) {
      transactions.hexpire(cacheKey, newIdentifier, ttl);
    };

    await transactions.exec();

    return res.status(201).send("https://link.anthro.id/" + newIdentifier);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred when preparing the link shortener.");
  };
});

app.delete("/:identifier", ratelimiter({ ...ratelimitConfig, identifier: "delete", limit: 3, windowMs: ms("1m") }), raw({ limit: 0 }), async (req, res) => {
  const { identifier } = req.params;
  const deletion = await redis.hdel(cacheKey, identifier);
  if (deletion <= 0) {
    return res.status(404).send("The URL with specified identifier does not exist.");
  };

  return res.sendStatus(204);
});

app.listen(PORT, () => {
  return console.log(`Server listened to PORT ${PORT}`);
});
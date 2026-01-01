process.env.NODE_ENV = process.env.npm_lifecycle_event === "start" ? "production" : "development";

const PORT = process.env.PORT || 3000;

import pkg from "../package.json" with { type: "json" };
import { randomBytes } from "node:crypto";
import Express from "ultimate-express";
import ratelimiter from "express-rate-limit";
import ms from "ms";
import isBase64 from "validator/lib/isBase64.js";
import isURL from "validator/lib/isURL.js";

import redis, { kvKey } from "./services/redis.js";
import { limit, cacheControlDefaultValue, randomBytesLength, cachedUrls, ratelimitConfig } from "./config.js";

const app = Express();

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

app.get("/ping", (_, res) => res.sendStatus(204));

app.get(["/", "/:identifier"], Express.raw({ limit: 0 }), async (req, res) => {
  const identifier = req.params.identifier;
  if (!identifier || typeof identifier !== "string" || identifier.length <= 0) {
    return res.redirect(pkg.repository.url);
  };

  if (identifier.length !== limit.identifier || !isBase64(identifier, { urlSafe: true })) {
    return res.sendStatus(400);
  };

  if (cachedUrls.has(identifier)) {
    return res.setHeader("Cache-Control", cacheControlDefaultValue).redirect(302, cachedUrls.get(identifier));
  };

  const url = await redis.hget(kvKey, identifier);
  if (!url || typeof url !== "string" || !isURL(url, { protocols: ["https"] })) {
    return res.status(400).send("Malformed destination URL.");
  };

  cachedUrls.set(identifier, url);

  return res.setHeader("Cache-Control", cacheControlDefaultValue).redirect(302, url);
});

app.post("/", ratelimiter({ ...ratelimitConfig, identifier: "post", limit: 2, windowMs: ms("5m") }), Express.text({ limit: limit.rawUrl, type: "text/plain" }), async (req, res) => {
  const rawUrl = req.body;
  if (!rawUrl || typeof rawUrl !== "string" || !isURL(rawUrl, { protocols: ["https"], max_allowed_length: limit.rawUrl })) {
    return res.status(400).send("Invalid or malformed input URL.");
  };

  try {
    const newIdentifier = randomBytes(randomBytesLength).toString("base64url");

    await redis.hset(kvKey, {
      [newIdentifier]: rawUrl
    });

    cachedUrls.set(newIdentifier, rawUrl);

    return res.status(201).send("https://link.anthro.id/" + newIdentifier);
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred when preparing the link shortener.");
  };
});

app.listen(PORT, () => {
  return console.log(`Server listened to PORT ${PORT}`);
});
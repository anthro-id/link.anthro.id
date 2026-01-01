// ".env" file must exists, otherwise it'll throw an error
process.loadEnvFile(); 

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const kvKey = "links";

export default redis;
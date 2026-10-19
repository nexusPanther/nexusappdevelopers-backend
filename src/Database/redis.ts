import Redis, { RedisOptions } from "ioredis";

let redisClient: Redis | null = null;
let isRedisConnected = false;

const getRedisConfig = (): RedisOptions => {
  if (process.env.REDIS_URL) {
    return {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
    };
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
  };
};

/**
 * Connect to Redis instance with graceful fallback
 */
export const connectToRedis = async (): Promise<Redis | null> => {
  if (redisClient && isRedisConnected) {
    return redisClient;
  }

  try {
    const config = getRedisConfig();
    redisClient = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, config)
      : new Redis(config);

    redisClient.on("connect", () => {
      isRedisConnected = true;
      console.log("⚡ Connected to Redis successfully!");
    });

    redisClient.on("ready", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      console.warn("⚠️ Redis connection warning:", err?.message || err);
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    console.warn("⚠️ Redis initialization error (falling back to database):", error?.message || error);
    isRedisConnected = false;
    return null;
  }
};

/**
 * Check if Redis is ready
 */
export const isRedisReady = (): boolean => {
  return isRedisConnected && redisClient !== null && redisClient.status === "ready";
};

/**
 * Get parsed JSON value from Redis
 */
export const redisGet = async <T = any>(key: string): Promise<T | null> => {
  try {
    if (!isRedisReady() || !redisClient) return null;
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err: any) {
    console.warn(`Redis GET failed for key "${key}":`, err?.message || err);
    return null;
  }
};

/**
 * Set JSON value in Redis with optional TTL (seconds)
 */
export const redisSet = async (
  key: string,
  value: any,
  ttlSeconds: number = 86400
): Promise<boolean> => {
  try {
    if (!isRedisReady() || !redisClient) return false;
    const str = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.set(key, str, "EX", ttlSeconds);
    } else {
      await redisClient.set(key, str);
    }
    return true;
  } catch (err: any) {
    console.warn(`Redis SET failed for key "${key}":`, err?.message || err);
    return false;
  }
};

/**
 * Delete one or more keys from Redis
 */
export const redisDel = async (...keys: string[]): Promise<boolean> => {
  try {
    if (!isRedisReady() || !redisClient || keys.length === 0) return false;
    await redisClient.del(...keys);
    return true;
  } catch (err: any) {
    console.warn(`Redis DEL failed:`, err?.message || err);
    return false;
  }
};

/**
 * Delete all keys matching a pattern (e.g. "meta_tags:*")
 */
export const redisDelByPattern = async (pattern: string): Promise<number> => {
  try {
    if (!isRedisReady() || !redisClient) return 0;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  } catch (err: any) {
    console.warn(`Redis DEL by pattern "${pattern}" failed:`, err?.message || err);
    return 0;
  }
};

/**
 * Helper to fetch from Redis cache or execute fetcher function and populate cache
 */
export const getOrSetCache = async <T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 86400
): Promise<{ data: T; isCached: boolean }> => {
  const cached = await redisGet<T>(key);
  if (cached !== null && cached !== undefined) {
    return { data: cached, isCached: true };
  }
  const data = await fetcher();
  if (data !== null && data !== undefined) {
    await redisSet(key, data, ttlSeconds);
  }
  return { data, isCached: false };
};

/**
 * Invalidate one or more keys or patterns
 */
export const invalidateCache = async (...patternsOrKeys: string[]): Promise<void> => {
  try {
    for (const item of patternsOrKeys) {
      if (item.includes("*")) {
        await redisDelByPattern(item);
      } else {
        await redisDel(item);
      }
    }
  } catch (err: any) {
    console.warn("invalidateCache error:", err?.message || err);
  }
};

/**
 * Flush all cached keys in the current database
 */
export const flushAllCache = async (): Promise<boolean> => {
  try {
    if (!isRedisReady() || !redisClient) return false;
    await redisClient.flushdb();
    return true;
  } catch (err: any) {
    console.warn("Redis flushdb failed:", err?.message || err);
    return false;
  }
};

export const getRedisClient = (): Redis | null => redisClient;

export interface RedisCacheStats {
  isConnected: boolean;
  status: string;
  host: string;
  port: number;
  totalKeys: number;
  memory: {
    used: string;
    peak: string;
  };
  uptime: number;
  categories: Record<string, { label: string; count: number; pattern: string }>;
  recentKeys: Array<{ key: string; ttl: number; category: string }>;
}

/**
 * Retrieve live Redis statistics and key breakdowns
 */
export const getRedisStats = async (): Promise<RedisCacheStats> => {
  const defaultCategories: Record<string, { label: string; count: number; pattern: string }> = {
    services: { label: "Services", count: 0, pattern: "cache:services:*" },
    portfolio: { label: "Portfolio", count: 0, pattern: "cache:portfolio:*" },
    blogs: { label: "Blogs", count: 0, pattern: "cache:blogs:*" },
    testimonials: { label: "Testimonials", count: 0, pattern: "cache:testimonials:*" },
    faqs: { label: "FAQs", count: 0, pattern: "cache:faqs:*" },
    metaTags: { label: "Meta Tags & SEO", count: 0, pattern: "meta_tags:*" },
    popups: { label: "Marketing Popups", count: 0, pattern: "cache:popups:*" },
    dashboard: { label: "Dashboard Stats", count: 0, pattern: "cache:dashboard:*" },
    hero: { label: "Hero Sections", count: 0, pattern: "cache:hero:*" },
    about: { label: "About Sections", count: 0, pattern: "cache:about:*" },
    contacts: { label: "Contact Queries", count: 0, pattern: "cache:contacts:*" },
    legal: { label: "Legal Pages", count: 0, pattern: "cache:legal:*" },
    other: { label: "Other Caches", count: 0, pattern: "*" },
  };

  if (!isRedisReady() || !redisClient) {
    return {
      isConnected: false,
      status: redisClient ? redisClient.status : "disconnected",
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      totalKeys: 0,
      memory: { used: "0 MB", peak: "0 MB" },
      uptime: 0,
      categories: defaultCategories,
      recentKeys: [],
    };
  }

  try {
    const [infoRaw, totalKeys, allKeys] = await Promise.all([
      redisClient.info().catch(() => ""),
      redisClient.dbsize().catch(() => 0),
      redisClient.keys("*").catch(() => [] as string[]),
    ]);

    const parseInfo = (section: string) => {
      const match = infoRaw.match(new RegExp(`${section}:([^\r\n]+)`));
      return match ? match[1].trim() : "";
    };

    const usedMemory = parseInfo("used_memory_human") || "N/A";
    const peakMemory = parseInfo("used_memory_peak_human") || "N/A";
    const uptime = Number(parseInfo("uptime_in_seconds")) || 0;

    for (const k of allKeys) {
      if (k.startsWith("cache:services")) defaultCategories.services.count++;
      else if (k.startsWith("cache:portfolio")) defaultCategories.portfolio.count++;
      else if (k.startsWith("cache:blogs")) defaultCategories.blogs.count++;
      else if (k.startsWith("cache:testimonials")) defaultCategories.testimonials.count++;
      else if (k.startsWith("cache:faqs")) defaultCategories.faqs.count++;
      else if (k.startsWith("meta_tags")) defaultCategories.metaTags.count++;
      else if (k.startsWith("cache:popups")) defaultCategories.popups.count++;
      else if (k.startsWith("cache:dashboard")) defaultCategories.dashboard.count++;
      else if (k.startsWith("cache:hero")) defaultCategories.hero.count++;
      else if (k.startsWith("cache:about")) defaultCategories.about.count++;
      else if (k.startsWith("cache:contacts")) defaultCategories.contacts.count++;
      else if (k.startsWith("cache:legal")) defaultCategories.legal.count++;
      else defaultCategories.other.count++;
    }

    const sampleKeys = allKeys.slice(0, 60);
    const ttlPromises = sampleKeys.map((k) => redisClient!.ttl(k).catch(() => -1));
    const ttls = await Promise.all(ttlPromises);

    const getCat = (k: string) => {
      if (k.startsWith("cache:services")) return "Services";
      if (k.startsWith("cache:portfolio")) return "Portfolio";
      if (k.startsWith("cache:blogs")) return "Blogs";
      if (k.startsWith("cache:testimonials")) return "Testimonials";
      if (k.startsWith("cache:faqs")) return "FAQs";
      if (k.startsWith("meta_tags")) return "Meta Tags";
      if (k.startsWith("cache:popups")) return "Popups";
      if (k.startsWith("cache:dashboard")) return "Dashboard";
      if (k.startsWith("cache:hero")) return "Hero";
      if (k.startsWith("cache:about")) return "About";
      if (k.startsWith("cache:contacts")) return "Contacts";
      if (k.startsWith("cache:legal")) return "Legal";
      return "General";
    };

    const recentKeys = sampleKeys.map((key, i) => ({
      key,
      ttl: ttls[i],
      category: getCat(key),
    }));

    return {
      isConnected: true,
      status: "connected",
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      totalKeys: typeof totalKeys === "number" ? totalKeys : allKeys.length,
      memory: { used: usedMemory, peak: peakMemory },
      uptime,
      categories: defaultCategories,
      recentKeys,
    };
  } catch (err: any) {
    console.warn("getRedisStats error:", err?.message || err);
    return {
      isConnected: isRedisReady(),
      status: "error",
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      totalKeys: 0,
      memory: { used: "N/A", peak: "N/A" },
      uptime: 0,
      categories: defaultCategories,
      recentKeys: [],
    };
  }
};

export default {
  connectToRedis,
  isRedisReady,
  redisGet,
  redisSet,
  redisDel,
  redisDelByPattern,
  getOrSetCache,
  invalidateCache,
  flushAllCache,
  getRedisStats,
  getRedisClient,
};

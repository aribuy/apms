const DEFAULT_TTL_MS = Number(process.env.IDEMPOTENCY_TTL_MS || 2 * 60 * 1000);
const cache = new Map();
const pending = new Map();

const getHeader = (req, name) => {
  if (typeof req.get === 'function') {
    return req.get(name);
  }
  return req.headers?.[name.toLowerCase()];
};

const getKey = (req) => getHeader(req, 'Idempotency-Key') || getHeader(req, 'X-Request-ID');

const isFresh = (entry) => Date.now() - entry.createdAt < DEFAULT_TTL_MS;

const clearIdempotencyCache = () => {
  cache.clear();
  pending.clear();
};

const getCacheStats = () => ({
  size: cache.size,
  entries: Array.from(cache.entries()).map(([key, value]) => ({
    key,
    ageMs: Date.now() - value.createdAt
  }))
});

// Idempotency middleware with in-memory cache
const idempotencyCheck = (req, res, next) => {
  const key = getKey(req);
  if (!key) {
    return next();
  }

  const cached = cache.get(key);
  if (cached) {
    if (isFresh(cached)) {
      return res.status(cached.status).json(cached.body);
    }
    cache.delete(key);
  }

  const pendingEntry = pending.get(key);
  if (pendingEntry) {
    return pendingEntry.promise
      .then((result) => res.status(result.status).json(result.body))
      .catch(next);
  }

  let resolvePending;
  let rejectPending;
  const promise = new Promise((resolve, reject) => {
    resolvePending = resolve;
    rejectPending = reject;
  });
  pending.set(key, { promise, resolve: resolvePending, reject: rejectPending });

  let stored = false;
  const storeResponse = (body) => {
    if (stored) {
      return;
    }
    stored = true;
    const status = res.statusCode || 200;
    const result = { status, body };

    if (status >= 200 && status < 300) {
      cache.set(key, { ...result, createdAt: Date.now() });
    }

    const pendingItem = pending.get(key);
    if (pendingItem) {
      pendingItem.resolve(result);
      pending.delete(key);
    }
  };

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    storeResponse(body);
    return originalJson(body);
  };

  res.send = (body) => {
    storeResponse(body);
    return originalSend(body);
  };

  res.on('close', () => {
    const pendingItem = pending.get(key);
    if (pendingItem) {
      pendingItem.reject(new Error('Response closed before completion'));
      pending.delete(key);
    }
  });

  return next();
};

module.exports = {
  idempotencyCheck,
  clearIdempotencyCache,
  getCacheStats
};

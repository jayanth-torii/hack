// Runs once per test file, before its module graph loads — so env.ts and
// redis.ts both pick up test-safe values.
process.env.NODE_ENV = "test";
process.env.MOCK_MODE = "true";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.GENERATE_RATE_LIMIT_MAX = "1000"; // don't let rate limiting interfere with unrelated tests

// Real Redis is never available/needed in CI — swap ioredis for the
// in-memory ioredis-mock everywhere the app imports it.
jest.mock("ioredis", () => require("ioredis-mock"));

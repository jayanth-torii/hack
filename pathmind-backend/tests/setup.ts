// Runs once per test file, before its module graph loads — so env.ts and
// redis.ts both pick up test-safe values.
process.env.NODE_ENV = "test";
process.env.MOCK_MODE = "true";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.GENERATE_RATE_LIMIT_MAX = "1000"; // don't let rate limiting interfere with unrelated tests
process.env.VERIFY_LINKS = "false"; // keep generation hermetic — no network HEAD checks in tests

// dotenv never overrides already-set vars, so pin these to empty to keep the
// suite hermetic even when the developer's .env has real Google credentials.
process.env.GOOGLE_CALENDAR_CLIENT_ID = "";
process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "";

// Real Redis is never available/needed in CI — swap ioredis for the
// in-memory ioredis-mock everywhere the app imports it.
jest.mock("ioredis", () => require("ioredis-mock"));

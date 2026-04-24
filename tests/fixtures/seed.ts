/**
 * Seed data definitions for E2E tests.
 * All test data is scoped to TEST_USER_ID so it can be cleanly wiped.
 */

export const TEST_USER_ID = "playwright-test-user";
export const TEST_USERNAME = "testuser";
export const TEST_EMAIL = "test@rpthreadtracker.test";
export const TEST_PASSWORD = "TestPassword123!";

// Post IDs used in Tumblr mock responses
export const POST_IDS = {
	yourTurn: "101010101",
	theirTurn: "202020202",
	queued: "303030303",
	archived: "404040404",
	hiatus: "505050505",
} as const;

// Character URL identifiers
export const CHAR_IDS = {
	active: "active-character",
	hiatus: "hiatus-character",
} as const;

/**
 * Expected dashboard counts given the seed data + Tumblr mock.
 * - All Threads: yourTurn + theirTurn + queued + noPost (not archived, not hiatus)
 * - Your Turn:   yourTurnThread + noPostThread
 * - Their Turn:  theirTurnThread
 * - Queued:      queuedThread
 */
export const EXPECTED_COUNTS = {
	allThreads: 4,
	yourTurn: 2,
	theirTurn: 1,
	queued: 1,
} as const;

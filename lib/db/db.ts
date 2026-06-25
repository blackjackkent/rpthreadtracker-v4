import { PrismaClient } from "@prisma/client";

const TRANSIENT_ERROR_PATTERNS = [
	"Can't reach database server",
	"Server has closed the connection",
	"Connection reset",
	"ETIMEOUT",
	"ECONNRESET",
	"TLS settings didn't allow the connection",
];

function isTransientError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return TRANSIENT_ERROR_PATTERNS.some((p) => message.includes(p));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt >= retries || !isTransientError(error)) throw error;
			await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
		}
	}
}

function createPrismaClient() {
	const base = new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

	return base.$extends({
		query: {
			$allModels: {
				async $allOperations({ args, query }) {
					return withRetry(() => query(args));
				},
			},
		},
	});
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

// Keep the connection pool warm so idle periods don't cause slow reconnects.
// Azure SQL aggressively closes idle connections; retry on failure to force
// Prisma to open a fresh one before a real request needs it.
const KEEPALIVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const globalForKeepalive = globalThis as unknown as {
	keepaliveTimer: ReturnType<typeof setInterval> | undefined;
};
if (!globalForKeepalive.keepaliveTimer) {
	globalForKeepalive.keepaliveTimer = setInterval(async () => {
		try {
			console.log("[db keepalive] pinging database...");
			await withRetry(() => prisma.$queryRawUnsafe("SELECT 1"));
		} catch (error) {
			console.warn("[db keepalive] failed after retries:", error);
		}
	}, KEEPALIVE_INTERVAL_MS);
}

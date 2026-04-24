import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import { TEST_USER_ID } from "./fixtures/seed";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function globalTeardown() {
	const dbUrl = process.env.TEST_DATABASE_URL;
	if (!dbUrl) return;

	const prisma = new PrismaClient({
		datasources: { db: { url: dbUrl } },
	});

	try {
		await prisma.threadTags.deleteMany({
			where: { Threads: { Characters: { UserId: TEST_USER_ID } } },
		});
		await prisma.threads.deleteMany({
			where: { Characters: { UserId: TEST_USER_ID } },
		});
		await prisma.characters.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.profileSettings.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.passwordResetTokens.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.emailChangeTokens.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.aspNetUsers.deleteMany({ where: { Id: TEST_USER_ID } });
		console.log("🧹 Test data cleaned up.");
	} finally {
		await prisma.$disconnect();
	}
}

export default globalTeardown;

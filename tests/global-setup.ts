import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import * as dotenv from "dotenv";
import * as path from "path";
import {
	TEST_USER_ID,
	TEST_USERNAME,
	TEST_EMAIL,
	TEST_PASSWORD,
	POST_IDS,
	CHAR_IDS,
} from "./fixtures/seed";

// Load env — .env.test.local takes precedence over .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.test.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function globalSetup() {
	const dbUrl = process.env.TEST_DATABASE_URL;
	if (!dbUrl) {
		throw new Error(
			"TEST_DATABASE_URL is not set. Create .env.test.local with TEST_DATABASE_URL."
		);
	}

	const prisma = new PrismaClient({
		datasources: { db: { url: dbUrl } },
	});

	try {
		console.log("🌱 Seeding test database...");

		// ── Wipe existing test data ──────────────────────────────────────────
		// Order matters due to FK constraints (threads → characters → users)
		await prisma.threadTags.deleteMany({
			where: { Threads: { Characters: { UserId: TEST_USER_ID } } },
		});
		await prisma.threads.deleteMany({
			where: { Characters: { UserId: TEST_USER_ID } },
		});
		await prisma.characters.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.publicViews.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.profileSettings.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.passwordResetTokens.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.emailChangeTokens.deleteMany({ where: { UserId: TEST_USER_ID } });
		await prisma.aspNetUsers.deleteMany({ where: { Id: TEST_USER_ID } });

		// ── Test user ────────────────────────────────────────────────────────
		const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
		await prisma.aspNetUsers.create({
			data: {
				Id: TEST_USER_ID,
				UserName: TEST_USERNAME,
				NormalizedUserName: TEST_USERNAME.toUpperCase(),
				Email: TEST_EMAIL,
				NormalizedEmail: TEST_EMAIL.toUpperCase(),
				PasswordHash: passwordHash,
				EmailConfirmed: true,
				LockoutEnabled: false,
				PhoneNumberConfirmed: false,
				TwoFactorEnabled: false,
				AccessFailedCount: 0,
			},
		});

		// ── Profile settings ─────────────────────────────────────────────────
		await prisma.profileSettings.create({
			data: {
				UserId: TEST_USER_ID,
				ShowDashboardThreadDistribution: true,
				UseInvertedTheme: false,
				AllowMarkQueued: true,
				ThreadTablePageSize: 10,
			},
		});

		// ── Platforms (reference data) ────────────────────────────────────────
		const platformExists = await prisma.platforms.findUnique({ where: { PlatformId: 1 } });
		if (!platformExists) {
			await prisma.$executeRawUnsafe(`
				SET IDENTITY_INSERT [dbo].[Platforms] ON;
				INSERT INTO [dbo].[Platforms] (PlatformId, PlatformName) VALUES (1, 'Tumblr');
				SET IDENTITY_INSERT [dbo].[Platforms] OFF;
			`);
		}

		// ── Characters ───────────────────────────────────────────────────────
		const activeChar = await prisma.characters.create({
			data: {
				UserId: TEST_USER_ID,
				CharacterName: "Active Character",
				UrlIdentifier: CHAR_IDS.active,
				IsOnHiatus: false,
				PlatformId: 1, // Tumblr
			},
		});

		const hiatusChar = await prisma.characters.create({
			data: {
				UserId: TEST_USER_ID,
				CharacterName: "Hiatus Character",
				UrlIdentifier: CHAR_IDS.hiatus,
				IsOnHiatus: true,
				PlatformId: 1,
			},
		});

		// ── Threads ──────────────────────────────────────────────────────────
		// Your Turn thread
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: POST_IDS.yourTurn,
				UserTitle: "Your Turn Thread",
				PartnerUrlIdentifier: "partner1",
				IsArchived: false,
			},
		});

		// Their Turn thread
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: POST_IDS.theirTurn,
				UserTitle: "Their Turn Thread",
				PartnerUrlIdentifier: "partner2",
				IsArchived: false,
			},
		});

		// Queued thread
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: POST_IDS.queued,
				UserTitle: "Queued Thread",
				PartnerUrlIdentifier: "partner3",
				IsArchived: false,
				DateMarkedQueued: new Date("2024-01-01"),
			},
		});

		// Archived thread
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: POST_IDS.archived,
				UserTitle: "Archived Thread",
				PartnerUrlIdentifier: "partner4",
				IsArchived: true,
			},
		});

		// No-PostId thread (defaults to Your Turn in context)
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: null,
				UserTitle: "No Post Thread",
				IsArchived: false,
			},
		});

		// Queued thread where a new post arrived after the queue date
		// (should drop out of Queued and back into Your Turn)
		await prisma.threads.create({
			data: {
				CharacterId: activeChar.CharacterId,
				PostId: POST_IDS.queuedButPosted,
				UserTitle: "Queued But Posted Thread",
				PartnerUrlIdentifier: "partner5",
				IsArchived: false,
				DateMarkedQueued: new Date("2024-01-01"),
			},
		});

		// Hiatus character thread (should not appear in active views)
		await prisma.threads.create({
			data: {
				CharacterId: hiatusChar.CharacterId,
				PostId: POST_IDS.hiatus,
				UserTitle: "Hiatus Thread",
				IsArchived: false,
			},
		});

		// ── Tags ─────────────────────────────────────────────────────────────
		// Add tags to some threads for tag management tests
		const yourTurnThread = await prisma.threads.findFirst({
			where: { UserTitle: "Your Turn Thread", Characters: { UserId: TEST_USER_ID } },
		});
		const theirTurnThread = await prisma.threads.findFirst({
			where: { UserTitle: "Their Turn Thread", Characters: { UserId: TEST_USER_ID } },
		});
		const queuedThread = await prisma.threads.findFirst({
			where: { UserTitle: "Queued Thread", Characters: { UserId: TEST_USER_ID } },
		});

		if (yourTurnThread) {
			await prisma.threadTags.createMany({
				data: [
					{ TagID: crypto.randomUUID(), ThreadID: yourTurnThread.ThreadId, TagText: "adventure" },
					{ TagID: crypto.randomUUID(), ThreadID: yourTurnThread.ThreadId, TagText: "angst" },
				],
			});
		}
		if (theirTurnThread) {
			await prisma.threadTags.createMany({
				data: [
					{ TagID: crypto.randomUUID(), ThreadID: theirTurnThread.ThreadId, TagText: "adventure" },
					{ TagID: crypto.randomUUID(), ThreadID: theirTurnThread.ThreadId, TagText: "fluff" },
				],
			});
		}
		if (queuedThread) {
			await prisma.threadTags.createMany({
				data: [
					{ TagID: crypto.randomUUID(), ThreadID: queuedThread.ThreadId, TagText: "angst" },
				],
			});
		}

		// ── Public View ──────────────────────────────────────────────────
		await prisma.publicViews.create({
			data: {
				Id: crypto.randomUUID(),
				UserId: TEST_USER_ID,
				Name: "Seeded Public View",
				Slug: "seeded-view",
				IncludeMyTurn: true,
				IncludeTheirTurn: true,
				IncludeQueued: false,
				IncludeArchived: false,
				Columns: JSON.stringify(["threadTitle", "partner", "lastPostDate", "status"]),
				SortKey: "lastPostDate",
				SortDescending: true,
				CharacterIds: null,
				Tags: null,
			},
		});

		console.log("✅ Test database seeded.");
	} finally {
		await prisma.$disconnect();
	}
}

export default globalSetup;

/**
 * One-time migration script: DocumentDB (CosmosDB) public views → SQL Server
 *
 * Usage:
 *   npx tsx scripts/migrate-public-views.ts           # live run
 *   npx tsx scripts/migrate-public-views.ts --dry-run # preview only, no writes
 *
 * Required environment variables (add to .env.local or pass inline):
 *   DATABASE_URL           — already set (SQL Server connection string)
 *   COSMOSDB_ENDPOINT      — CosmosDB endpoint (e.g. https://xxx.documents.azure.com:443/)
 *   COSMOSDB_KEY           — CosmosDB primary key
 *   COSMOSDB_DATABASE_ID   — Database name
 *   COSMOSDB_COLLECTION_ID — Collection/container name
 */

import { CosmosClient } from "@azure/cosmos";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local (same as Next.js does)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

// ── CosmosDB document types ──────────────────────────────────────────────────

interface CosmosPublicTurnFilter {
	IncludeMyTurn: boolean;
	IncludeTheirTurn: boolean;
	IncludeQueued: boolean;
	IncludeArchived: boolean;
}

interface CosmosPublicView {
	id: string;
	Name: string;
	Slug: string;
	UserId: string;
	Columns: string[];
	SortKey: string;
	SortDescending: boolean;
	TurnFilter: CosmosPublicTurnFilter;
	CharacterIds: number[] | null;
	Tags: string[] | null;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateEnv() {
	const required = [
		"DATABASE_URL",
		"COSMOSDB_ENDPOINT",
		"COSMOSDB_KEY",
		"COSMOSDB_DATABASE_ID",
		"COSMOSDB_COLLECTION_ID",
	];
	const missing = required.filter((k) => !process.env[k]);
	if (missing.length > 0) {
		console.error("❌ Missing required environment variables:");
		missing.forEach((k) => console.error(`   ${k}`));
		process.exit(1);
	}
}

// ── Fetch all documents from CosmosDB ────────────────────────────────────────

async function fetchAllPublicViews(): Promise<CosmosPublicView[]> {
	const client = new CosmosClient({
		endpoint: process.env.COSMOSDB_ENDPOINT!,
		key: process.env.COSMOSDB_KEY!,
	});

	const container = client
		.database(process.env.COSMOSDB_DATABASE_ID!)
		.container(process.env.COSMOSDB_COLLECTION_ID!);

	const { resources } = await container.items
		.query<CosmosPublicView>("SELECT * FROM c")
		.fetchAll();

	return resources;
}

// ── Map CosmosDB document → SQL Server row ────────────────────────────────────

function mapToSqlRow(doc: CosmosPublicView) {
	return {
		Id: doc.id,
		UserId: doc.UserId,
		Name: doc.Name,
		Slug: doc.Slug,
		IncludeMyTurn: doc.TurnFilter?.IncludeMyTurn ?? false,
		IncludeTheirTurn: doc.TurnFilter?.IncludeTheirTurn ?? false,
		IncludeQueued: doc.TurnFilter?.IncludeQueued ?? false,
		IncludeArchived: doc.TurnFilter?.IncludeArchived ?? false,
		Columns: JSON.stringify(doc.Columns ?? []),
		SortKey: doc.SortKey ?? "lastPostDate",
		SortDescending: doc.SortDescending ?? true,
		CharacterIds:
			doc.CharacterIds && doc.CharacterIds.length > 0
				? JSON.stringify(doc.CharacterIds)
				: null,
		Tags:
			doc.Tags && doc.Tags.length > 0 ? JSON.stringify(doc.Tags) : null,
	};
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	console.log(
		`\n🚀 RPThreadTracker — Public Views Migration (${DRY_RUN ? "DRY RUN" : "LIVE"})\n`
	);

	validateEnv();

	// Fetch from CosmosDB
	console.log("📦 Fetching documents from CosmosDB...");
	const docs = await fetchAllPublicViews();
	console.log(`   Found ${docs.length} public view(s)\n`);

	if (docs.length === 0) {
		console.log("✅ Nothing to migrate.");
		return;
	}

	// Preview
	console.log("Documents to migrate:");
	docs.forEach((doc, i) => {
		console.log(
			`   [${i + 1}] ${doc.Name} (slug: ${doc.Slug}, userId: ${doc.UserId})`
		);
	});
	console.log();

	if (DRY_RUN) {
		console.log("🔍 Dry run — no writes performed.");
		console.log("\nMapped rows (preview):");
		docs.forEach((doc) => {
			console.log(JSON.stringify(mapToSqlRow(doc), null, 2));
		});
		return;
	}

	// Write to SQL Server
	const prisma = new PrismaClient();
	let inserted = 0;
	let errors = 0;

	try {
		for (const doc of docs) {
			const row = mapToSqlRow(doc);
			try {
				await prisma.publicViews.upsert({
					where: { Id: row.Id },
					create: row,
					update: row, // overwrite on re-run — safe since source data is frozen
				});
				console.log(`   ✅ Migrated: ${doc.Name} (${doc.id})`);
				inserted++;
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`   ❌ Failed: ${doc.Name} (${doc.id}) — ${message}`);
				errors++;
			}
		}
	} finally {
		await prisma.$disconnect();
	}

	console.log(`
── Summary ──────────────────────────────────
  Migrated : ${inserted}
  Errors   : ${errors}
  Total    : ${docs.length}
─────────────────────────────────────────────`);

	if (errors > 0) {
		console.error("\n⚠️  Some records failed. Review errors above.");
		process.exit(1);
	} else {
		console.log("\n✅ Migration complete.");
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});

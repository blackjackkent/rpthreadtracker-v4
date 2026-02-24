import { auth } from "@/lib/auth";
import { getAllThreadsForExport } from "@/lib/db/thread";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

const HEADER_FILL: ExcelJS.Fill = {
	type: "pattern",
	pattern: "solid",
	fgColor: { argb: "FFBDD7EE" },
};

const ARCHIVED_FILL: ExcelJS.Fill = {
	type: "pattern",
	pattern: "solid",
	fgColor: { argb: "FFD9D9D9" },
};

const ARCHIVED_FONT: Partial<ExcelJS.Font> = {
	color: { argb: "FF808080" },
};

const COLUMNS = [
	{ header: "Thread Title", key: "userTitle", width: 40 },
	{ header: "Post ID", key: "postId", width: 20 },
	{ header: "Partner", key: "partner", width: 20 },
	{ header: "Tags", key: "tags", width: 30 },
	{ header: "Archived", key: "isArchived", width: 12 },
	{ header: "Queued", key: "isQueued", width: 12 },
];

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const includeArchived = searchParams.get("includeArchived") === "true";
	const includeHiatused = searchParams.get("includeHiatused") === "true";

	const threads = await getAllThreadsForExport(
		session.user.id,
		includeArchived,
		includeHiatused
	);

	// Group threads by character
	const byCharacter = new Map<
		number,
		{ urlIdentifier: string; threads: typeof threads }
	>();

	for (const thread of threads) {
		const { CharacterId, UrlIdentifier } = thread.Characters;
		if (!byCharacter.has(CharacterId)) {
			byCharacter.set(CharacterId, {
				urlIdentifier: UrlIdentifier ?? `character-${CharacterId}`,
				threads: [],
			});
		}
		byCharacter.get(CharacterId)!.threads.push(thread);
	}

	const workbook = new ExcelJS.Workbook();
	workbook.creator = "RPThreadTracker";
	workbook.created = new Date();

	for (const { urlIdentifier, threads: charThreads } of byCharacter.values()) {
		// Sheet names max 31 chars and cannot contain certain special chars
		const sheetName = urlIdentifier.replace(/[\\/*?[\]:]/g, "").slice(0, 31);
		const sheet = workbook.addWorksheet(sheetName);

		sheet.columns = COLUMNS;

		// Style header row
		const headerRow = sheet.getRow(1);
		headerRow.eachCell((cell) => {
			cell.fill = HEADER_FILL;
			cell.font = { bold: true };
		});

		// Data rows
		for (const thread of charThreads) {
			const row = sheet.addRow({
				userTitle: thread.UserTitle ?? "",
				postId: thread.PostId ?? "",
				partner: thread.PartnerUrlIdentifier ?? "",
				tags: thread.ThreadTags.map((t) => t.TagText).join(", "),
				isArchived: thread.IsArchived ? "Yes" : "No",
				isQueued: thread.DateMarkedQueued ? "Yes" : "No",
			});

			if (thread.IsArchived) {
				row.eachCell((cell) => {
					cell.fill = ARCHIVED_FILL;
					cell.font = ARCHIVED_FONT;
				});
			}
		}
	}

	const buffer = await workbook.xlsx.writeBuffer();

	return new NextResponse(buffer, {
		headers: {
			"Content-Type":
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"Content-Disposition": 'attachment; filename="threads-export.xlsx"',
		},
	});
}

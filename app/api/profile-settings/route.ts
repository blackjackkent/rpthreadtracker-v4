import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/db/db";

// GET /api/profile-settings - Fetch user's profile settings
export async function GET() {
	// Require authentication
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;

	const session = authResult;

	try {
		// Try to find existing settings
		let settings = await prisma.profileSettings.findFirst({
			where: { UserId: session.user.id },
		});

		// If no settings exist, create default settings
		if (!settings) {
			settings = await prisma.profileSettings.create({
				data: {
					UserId: session.user.id,
					ShowDashboardThreadDistribution: true,
					UseInvertedTheme: false,
					AllowMarkQueued: true,
					ThreadTablePageSize: 10,
				},
			});
		}

		return NextResponse.json({
			showDashboardThreadDistribution: settings.ShowDashboardThreadDistribution,
			useInvertedTheme: settings.UseInvertedTheme,
			allowMarkQueued: settings.AllowMarkQueued,
			lastNewsReadDate: settings.LastNewsReadDate,
			threadTablePageSize: settings.ThreadTablePageSize,
		});
	} catch (error) {
		console.error("Error fetching profile settings:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile settings" },
			{ status: 500 }
		);
	}
}

// PATCH /api/profile-settings - Update specific profile settings
export async function PATCH(request: Request) {
	// Require authentication
	const authResult = await requireAuth();
	if (authResult instanceof NextResponse) return authResult;

	const session = authResult;

	try {
		const body = await request.json();

		// Find existing settings
		let settings = await prisma.profileSettings.findFirst({
			where: { UserId: session.user.id },
		});

		// If no settings exist, create them first
		if (!settings) {
			settings = await prisma.profileSettings.create({
				data: {
					UserId: session.user.id,
					ShowDashboardThreadDistribution: true,
					UseInvertedTheme: false,
					AllowMarkQueued: true,
					ThreadTablePageSize: 10,
				},
			});
		}

		// Build update data object with only provided fields
		const updateData: {
			ShowDashboardThreadDistribution?: boolean;
			UseInvertedTheme?: boolean;
			AllowMarkQueued?: boolean;
			LastNewsReadDate?: Date | null;
			ThreadTablePageSize?: number;
		} = {};

		if (body.showDashboardThreadDistribution !== undefined) {
			updateData.ShowDashboardThreadDistribution =
				body.showDashboardThreadDistribution;
		}
		if (body.useInvertedTheme !== undefined) {
			updateData.UseInvertedTheme = body.useInvertedTheme;
		}
		if (body.allowMarkQueued !== undefined) {
			updateData.AllowMarkQueued = body.allowMarkQueued;
		}
		if (body.lastNewsReadDate !== undefined) {
			updateData.LastNewsReadDate = body.lastNewsReadDate
				? new Date(body.lastNewsReadDate)
				: null;
		}
		if (body.threadTablePageSize !== undefined) {
			updateData.ThreadTablePageSize = body.threadTablePageSize;
		}

		// Update settings
		const updatedSettings = await prisma.profileSettings.update({
			where: { SettingsId: settings.SettingsId },
			data: updateData,
		});

		return NextResponse.json({
			showDashboardThreadDistribution:
				updatedSettings.ShowDashboardThreadDistribution,
			useInvertedTheme: updatedSettings.UseInvertedTheme,
			allowMarkQueued: updatedSettings.AllowMarkQueued,
			lastNewsReadDate: updatedSettings.LastNewsReadDate,
			threadTablePageSize: updatedSettings.ThreadTablePageSize,
		});
	} catch (error) {
		console.error("Error updating profile settings:", error);
		return NextResponse.json(
			{ error: "Failed to update profile settings" },
			{ status: 500 }
		);
	}
}

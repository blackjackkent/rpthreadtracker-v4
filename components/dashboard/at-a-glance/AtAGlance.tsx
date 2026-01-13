"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import {
	faList,
	faPencil,
	faCheck,
	faCalendar,
} from "@fortawesome/free-solid-svg-icons";
import { DashboardSummaryWidget } from "./DashboardSummaryWidget";
import { useProfileSettings } from "@/components/providers/ProfileSettingsProvider";

interface AtAGlanceProps {
	activeThreadsCount?: number;
	yourTurnCount?: number;
	theirTurnCount?: number;
	queuedCount?: number;
	isLoading?: boolean;
}

export const AtAGlance = ({
	activeThreadsCount = 0,
	yourTurnCount = 0,
	theirTurnCount = 0,
	queuedCount = 0,
	isLoading = false,
}: AtAGlanceProps) => {
	const { settings, updateSettings } = useProfileSettings();
	const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

	const handleToggleVisibility = async () => {
		if (!settings) return;

		setIsTogglingVisibility(true);
		try {
			await updateSettings({
				showDashboardThreadDistribution:
					!settings.showDashboardThreadDistribution,
			});
		} catch (error) {
			console.error("Failed to toggle dashboard visibility:", error);
		} finally {
			setIsTogglingVisibility(false);
		}
	};

	const showDistribution = settings?.showDashboardThreadDistribution ?? true;

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			{/* Header with accent and toggle button */}
			<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent flex items-center justify-between">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<FontAwesomeIcon icon={faSearch} className="w-4 h-4 text-primary" />
					<span>At a Glance</span>
				</h2>
				<button
					type="button"
					onClick={handleToggleVisibility}
					disabled={isTogglingVisibility}
					className="p-2 text-text-muted hover:text-text transition-colors disabled:opacity-50 cursor-pointer"
					title={showDistribution ? "Hide stats" : "Show stats"}
				>
					<FontAwesomeIcon
						icon={showDistribution ? faEyeSlash : faEye}
						className="w-4 h-4"
					/>
				</button>
			</div>

			{/* Stats Grid - Collapsible */}
			{showDistribution && (
				<div className="p-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<DashboardSummaryWidget
							count={activeThreadsCount}
							label="Active Threads"
							icon={faList}
							href="/threads/all"
							isLoading={isLoading}
						/>
						<DashboardSummaryWidget
							count={yourTurnCount}
							label="Your Turn"
							icon={faPencil}
							href="/threads/your-turn"
							isLoading={isLoading}
						/>
						<DashboardSummaryWidget
							count={theirTurnCount}
							label="Their Turn"
							icon={faCheck}
							href="/threads/their-turn"
							isLoading={isLoading}
						/>
						<DashboardSummaryWidget
							count={queuedCount}
							label="Queued"
							icon={faCalendar}
							href="/threads/queued"
							isLoading={isLoading}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

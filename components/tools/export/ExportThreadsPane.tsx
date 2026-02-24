"use client";

import { faFileExcel, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { toast } from "react-toastify";

export const ExportThreadsPane = () => {
	const [includeArchived, setIncludeArchived] = useState(false);
	const [includeHiatused, setIncludeHiatused] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const params = new URLSearchParams({
				includeArchived: String(includeArchived),
				includeHiatused: String(includeHiatused),
			});
			const response = await fetch(`/api/thread/export?${params}`);
			if (!response.ok) {
				throw new Error("Export failed");
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "threads-export.xlsx";
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			toast.error("Failed to export threads. Please try again.");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-border">
				<h2 className="text-lg font-semibold">Export Threads</h2>
				<p className="text-sm text-text-muted mt-1">
					Export your threads to an Excel file
				</p>
			</div>

			<div className="p-6 space-y-6">
				<div className="space-y-3">
					<p className="text-sm font-medium">Export Options</p>
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={includeArchived}
							onChange={(e) => setIncludeArchived(e.target.checked)}
							className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
						/>
						<span className="text-sm">Include archived threads</span>
					</label>
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={includeHiatused}
							onChange={(e) => setIncludeHiatused(e.target.checked)}
							className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
						/>
						<span className="text-sm">Include characters on hiatus</span>
					</label>
				</div>

				<div>
					<button
						onClick={handleExport}
						disabled={isExporting}
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
					>
						<FontAwesomeIcon
							icon={isExporting ? faSpinner : faFileExcel}
							className={isExporting ? "animate-spin" : ""}
						/>
						{isExporting ? "Exporting…" : "Export to Excel"}
					</button>
				</div>

				<p className="text-xs text-text-muted">
					Exports one sheet per character, with columns for thread title, post
					ID, partner, tags, archived status, and queued status.
				</p>
			</div>
		</div>
	);
};

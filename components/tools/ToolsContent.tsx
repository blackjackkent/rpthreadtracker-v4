"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faFileExport,
	faPuzzlePiece,
	faTags,
	faEye,
} from "@fortawesome/free-solid-svg-icons";
import { ExportThreadsPane } from "./export/ExportThreadsPane";
import { BrowserExtensionsPane } from "./extensions/BrowserExtensionsPane";
import { ManageTagsPane } from "./tags/ManageTagsPane";
import { ManagePublicViewsPane } from "./public-views/ManagePublicViewsPane";

type TabId = "export" | "extensions" | "tags" | "public-views";

interface Tab {
	id: TabId;
	label: string;
	icon: typeof faFileExport;
}

const TABS: Tab[] = [
	{
		id: "export",
		label: "Export Threads",
		icon: faFileExport,
	},
	{
		id: "extensions",
		label: "Browser Extensions",
		icon: faPuzzlePiece,
	},
	{
		id: "tags",
		label: "Manage Tags",
		icon: faTags,
	},
	{
		id: "public-views",
		label: "Manage Public Views",
		icon: faEye,
	},
];

export const ToolsContent = () => {
	const [activeTab, setActiveTab] = useState<TabId>("export");

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-semibold">Tools</h1>
				<p className="text-text-muted mt-1">
					Manage your threads, tags, and public views
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="border-b border-border">
				<nav className="flex gap-2 overflow-x-auto">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
								activeTab === tab.id
									? "border-primary text-primary"
									: "border-transparent text-text-muted hover:text-text hover:border-border"
							}`}
						>
							<FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
							<span>{tab.label}</span>
						</button>
					))}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="mt-6">
				{activeTab === "export" && <ExportThreadsPane />}
				{activeTab === "extensions" && <BrowserExtensionsPane />}
				{activeTab === "tags" && <ManageTagsPane />}
				{activeTab === "public-views" && <ManagePublicViewsPane />}
			</div>
		</div>
	);
};

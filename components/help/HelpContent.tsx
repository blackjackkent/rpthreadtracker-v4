"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faInfoCircle,
	faPlayCircle,
	faQuestionCircle,
	faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { AboutTrackerPane } from "./AboutTrackerPane";
import { SupportGuidesPane } from "./SupportGuidesPane";
import { FaqPane } from "./FaqPane";
import { ContactPane } from "./ContactPane";

type TabId = "about" | "guides" | "faq" | "contact";

interface Tab {
	id: TabId;
	label: string;
	icon: typeof faInfoCircle;
}

const TABS: Tab[] = [
	{ id: "about", label: "About RPThreadTracker", icon: faInfoCircle },
	{ id: "guides", label: "Support Guides", icon: faPlayCircle },
	{ id: "faq", label: "FAQ", icon: faQuestionCircle },
	{ id: "contact", label: "Contact", icon: faEnvelope },
];

export const HelpContent = () => {
	const [activeTab, setActiveTab] = useState<TabId>("about");

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-semibold">Help</h1>
				<p className="text-text-muted mt-1">
					Documentation, guides, and support resources
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
				{activeTab === "about" && <AboutTrackerPane />}
				{activeTab === "guides" && <SupportGuidesPane />}
				{activeTab === "faq" && <FaqPane />}
				{activeTab === "contact" && <ContactPane />}
			</div>
		</div>
	);
};

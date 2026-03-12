"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faKey,
	faUser,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ChangePasswordPane } from "./ChangePasswordPane";
import { UpdateAccountInfoPane } from "./UpdateAccountInfoPane";
import { DeleteAccountPane } from "./DeleteAccountPane";

type TabId = "password" | "account" | "delete";

interface Tab {
	id: TabId;
	label: string;
	icon: typeof faKey;
}

const TABS: Tab[] = [
	{ id: "password", label: "Change Password", icon: faKey },
	{ id: "account", label: "Account Info", icon: faUser },
	{ id: "delete", label: "Delete Account", icon: faTrash },
];

interface SettingsContentProps {
	user: {
		id: string;
		userName: string;
		email: string;
	};
}

export const SettingsContent = ({ user }: SettingsContentProps) => {
	const [activeTab, setActiveTab] = useState<TabId>("password");

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-semibold">Settings</h1>
				<p className="text-text-muted mt-1">
					Manage your account settings
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
			<div className="mt-6 max-w-lg">
				{activeTab === "password" && <ChangePasswordPane />}
				{activeTab === "account" && <UpdateAccountInfoPane user={user} />}
				{activeTab === "delete" && <DeleteAccountPane />}
			</div>
		</div>
	);
};

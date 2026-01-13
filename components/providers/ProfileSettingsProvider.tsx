"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";

interface ProfileSettings {
	showDashboardThreadDistribution: boolean;
	useInvertedTheme: boolean;
	allowMarkQueued: boolean;
	lastNewsReadDate: Date | null;
	threadTablePageSize: number;
}

interface ProfileSettingsContextValue {
	settings: ProfileSettings | null;
	isLoading: boolean;
	updatePageSize: (pageSize: number) => Promise<void>;
	updateSettings: (updates: Partial<ProfileSettings>) => Promise<void>;
}

const ProfileSettingsContext = createContext<
	ProfileSettingsContextValue | undefined
>(undefined);

interface ProfileSettingsProviderProps {
	children: ReactNode;
	userId: string;
}

export const ProfileSettingsProvider = ({
	children,
	userId,
}: ProfileSettingsProviderProps) => {
	const [settings, setSettings] = useState<ProfileSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch profile settings on mount
	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const response = await fetch("/api/profile-settings");
				if (response.ok) {
					const data = await response.json();
					setSettings(data);
				}
			} catch (error) {
				console.error("Failed to fetch profile settings:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, [userId]);

	const updatePageSize = async (pageSize: number) => {
		try {
			const response = await fetch("/api/profile-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ threadTablePageSize: pageSize }),
			});

			if (response.ok) {
				const updatedSettings = await response.json();
				setSettings(updatedSettings);
			}
		} catch (error) {
			console.error("Failed to update page size:", error);
			throw error;
		}
	};

	const updateSettings = async (updates: Partial<ProfileSettings>) => {
		try {
			const response = await fetch("/api/profile-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			});

			if (response.ok) {
				const updatedSettings = await response.json();
				setSettings(updatedSettings);
			}
		} catch (error) {
			console.error("Failed to update settings:", error);
			throw error;
		}
	};

	return (
		<ProfileSettingsContext.Provider
			value={{ settings, isLoading, updatePageSize, updateSettings }}
		>
			{children}
		</ProfileSettingsContext.Provider>
	);
};

export const useProfileSettings = () => {
	const context = useContext(ProfileSettingsContext);
	if (context === undefined) {
		throw new Error(
			"useProfileSettings must be used within a ProfileSettingsProvider"
		);
	}
	return context;
};

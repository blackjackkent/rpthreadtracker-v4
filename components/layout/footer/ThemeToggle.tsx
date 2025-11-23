"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Prevent hydration mismatch by only rendering theme-dependent content after mount
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	// Render a placeholder during SSR to avoid hydration mismatch
	if (!mounted) {
		return (
			<div>
				Switch to{" "}
				<button
					type="button"
					className="hover:text-primary transition-colors underline"
					disabled
				>
					theme
				</button>
			</div>
		);
	}

	return (
		<div>
			Switch to{" "}
			<button
				type="button"
				onClick={toggleTheme}
				className="hover:text-primary transition-colors underline"
			>
				{theme === "dark" ? "light theme" : "dark theme"}
			</button>
		</div>
	);
};

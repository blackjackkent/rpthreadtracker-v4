import type { Metadata } from "next";
import "./globals.css";
import "@/lib/fontawesome";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
	title: "RPThreadTracker",
	description: "RP and Collaborative Writing Management Tool",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

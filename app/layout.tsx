import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "@/lib/fontawesome";
import { Providers } from "@/components/Providers";
import { LayoutContent } from "@/components/layout/LayoutContent";

export const metadata: Metadata = {
	title: { default: "RPThreadTracker", template: "%s | RPThreadTracker" },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				{process.env.UMAMI_WEBSITE_ID && (
					<Script
						src={process.env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js"}
						data-website-id={process.env.UMAMI_WEBSITE_ID}
						strategy="afterInteractive"
					/>
				)}
				<Providers>
					<LayoutContent>{children}</LayoutContent>
				</Providers>
			</body>
		</html>
	);
}

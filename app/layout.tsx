import "./globals.css";
import "@/lib/fontawesome";
import { Providers } from "@/components/Providers";
import { LayoutContent } from "@/components/layout/LayoutContent";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<Providers>
					<LayoutContent>{children}</LayoutContent>
				</Providers>
			</body>
		</html>
	);
}

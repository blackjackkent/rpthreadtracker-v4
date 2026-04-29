import type { Metadata } from "next";
import { HelpContent } from "@/components/help/HelpContent";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
	return <HelpContent />;
}

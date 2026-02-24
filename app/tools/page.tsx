import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ToolsContent } from "@/components/tools/ToolsContent";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
	const session = await auth();

	if (!session) {
		redirect("/login");
	}

	return <ToolsContent />;
}

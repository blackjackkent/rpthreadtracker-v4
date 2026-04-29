import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };
import { getUserById } from "@/lib/db/user";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const user = await getUserById(session.user.id);
	if (!user) redirect("/login");

	return (
		<SettingsContent
			user={{
				id: user.Id,
				userName: user.UserName || "",
				email: user.Email || "",
			}}
		/>
	);
}

"use client";

import { ReactNode, useState } from "react";
import { User } from "next-auth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Header } from "./header/Header";
import { Sidebar } from "./sidebar/Sidebar";
import { Footer } from "./footer/Footer";
import { ThreadStatusProvider } from "@/components/providers/ThreadStatusProvider";
import { UpsertCharacterModal } from "@/components/characters/UpsertCharacterModal";
import { createCharacter } from "@/app/actions/character";

interface AuthenticatedLayoutProps {
	children: ReactNode;
	user: User;
}

export const AuthenticatedLayout = ({
	children,
	user,
}: AuthenticatedLayoutProps) => {
	const router = useRouter();
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleAddCharacter = async (data: {
		characterName?: string;
		urlIdentifier: string;
		platformId?: number;
	}) => {
		setIsLoading(true);
		try {
			await createCharacter(data);
			toast.success("Character created!");
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
			throw error; // Re-throw so modal can handle it
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ThreadStatusProvider userId={user.id}>
			<div className="app">
				<Header
					user={user}
					onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
					onAddCharacter={() => setIsAddCharacterModalOpen(true)}
				/>

				<div className="app-body">
					<Sidebar isOpen={isSidebarOpen} />

					<main className="main">
						<div className="container mx-auto p-4">{children}</div>
					</main>
				</div>

				<Footer />

				<UpsertCharacterModal
					key={isAddCharacterModalOpen ? "add-character" : "closed"}
					isOpen={isAddCharacterModalOpen}
					onClose={() => setIsAddCharacterModalOpen(false)}
					onSubmit={handleAddCharacter}
					isLoading={isLoading}
				/>
			</div>
		</ThreadStatusProvider>
	);
};

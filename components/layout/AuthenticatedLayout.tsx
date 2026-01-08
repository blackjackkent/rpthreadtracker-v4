"use client";

import { ReactNode, useState, useEffect } from "react";
import { User } from "next-auth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Header } from "./header/Header";
import { Sidebar } from "./sidebar/Sidebar";
import { Footer } from "./footer/Footer";
import {
	ThreadStatusProvider,
	useThreadStatus,
} from "@/components/providers/ThreadStatusProvider";
import { UpsertCharacterModal } from "@/components/characters/UpsertCharacterModal";
import { UpsertThreadModal } from "@/components/threads/UpsertThreadModal";
import { createCharacter } from "@/app/actions/character";
import { createThread } from "@/app/actions/thread";

interface AuthenticatedLayoutProps {
	children: ReactNode;
	user: User;
}

const LayoutContent = ({ children, user }: AuthenticatedLayoutProps) => {
	const router = useRouter();
	// Initialize sidebar state - will be set based on screen size in useEffect
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isAddCharacterModalOpen, setIsAddCharacterModalOpen] = useState(false);
	const [isAddThreadModalOpen, setIsAddThreadModalOpen] = useState(false);
	const [isCharacterLoading, setIsCharacterLoading] = useState(false);
	const [isThreadLoading, setIsThreadLoading] = useState(false);

	const { refreshSingleThread, refreshCharacters, characters } =
		useThreadStatus();

	// Set initial sidebar state based on screen size
	useEffect(() => {
		const checkScreenSize = () => {
			// lg breakpoint is 1024px in Tailwind
			const isLargeScreen = window.innerWidth >= 1024;
			setIsSidebarOpen(isLargeScreen);
		};

		// Set initial state
		checkScreenSize();

		// Update on resize
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	const handleAddCharacter = async (data: {
		characterName?: string;
		urlIdentifier: string;
		platformId?: number;
	}) => {
		setIsCharacterLoading(true);
		try {
			await createCharacter(data);
			await refreshCharacters(); // Refresh character list in context
			toast.success("Character created!");
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
			throw error;
		} finally {
			setIsCharacterLoading(false);
		}
	};

	const handleAddThread = async (data: {
		characterId: number;
		postId: string;
		userTitle?: string;
		partnerUrlIdentifier?: string;
		description?: string;
		tags?: string[];
	}) => {
		setIsThreadLoading(true);
		try {
			const result = await createThread(data);
			await refreshSingleThread(result.threadId);
			toast.success("Thread tracked successfully");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "An error occurred");
			throw error;
		} finally {
			setIsThreadLoading(false);
		}
	};

	return (
		<div className="app">
			<Header
				user={user}
				onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
				onAddCharacter={() => setIsAddCharacterModalOpen(true)}
				onAddThread={() => setIsAddThreadModalOpen(true)}
			/>

			<div className="app-body">
				<Sidebar isOpen={isSidebarOpen} />

				<main className="main">
					<div className="container mx-auto p-4">{children}</div>
				</main>
			</div>

			<Footer />

			<UpsertCharacterModal
				key={isAddCharacterModalOpen ? "add-character" : "character-closed"}
				isOpen={isAddCharacterModalOpen}
				onClose={() => setIsAddCharacterModalOpen(false)}
				onSubmit={handleAddCharacter}
				isLoading={isCharacterLoading}
			/>

			<UpsertThreadModal
				key={isAddThreadModalOpen ? "add-thread" : "thread-closed"}
				isOpen={isAddThreadModalOpen}
				onClose={() => setIsAddThreadModalOpen(false)}
				onSubmit={handleAddThread}
				characters={characters}
				isLoading={isThreadLoading}
			/>
		</div>
	);
};

export const AuthenticatedLayout = ({
	children,
	user,
}: AuthenticatedLayoutProps) => {
	return (
		<ThreadStatusProvider userId={user.id}>
			<LayoutContent user={user}>{children}</LayoutContent>
		</ThreadStatusProvider>
	);
};

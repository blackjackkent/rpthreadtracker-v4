"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { User } from "next-auth";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

type ProfileMenuProps = {
	user: User;
};

export const ProfileMenu = ({ user }: ProfileMenuProps) => {
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	return (
		<div className="relative">
			<button
				onClick={() => setIsProfileOpen(!isProfileOpen)}
				className="p-1.5 hover:bg-primary-dark rounded transition-colors cursor-pointer"
				aria-label="User menu"
			>
				<FontAwesomeIcon icon={faUser} className="w-4 h-4" />
			</button>
			{isProfileOpen && (
				<div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded shadow-lg">
					<div className="px-4 py-3 border-b border-border">
						<p className="text-sm text-text-muted text-center">Logged in as:</p>
						<p className="font-semibold text-center">
							{user.name || user.email}
						</p>
					</div>
					<Link
						href="/settings"
						onClick={() => setIsProfileOpen(false)}
						className="block px-4 py-2 hover:bg-background transition-colors"
					>
						Account Settings
					</Link>
					<Link
						href="/tools"
						onClick={() => setIsProfileOpen(false)}
						className="block px-4 py-2 hover:bg-background transition-colors"
					>
						Tracker Tools
					</Link>
					<Link
						href="/help"
						onClick={() => setIsProfileOpen(false)}
						className="block px-4 py-2 hover:bg-background transition-colors"
					>
						Help
					</Link>
					<button
						onClick={() => signOut({ callbackUrl: "/login" })}
						className="w-full text-left px-4 py-2 hover:bg-background transition-colors border-t border-border cursor-pointer"
					>
						Logout
					</button>
				</div>
			)}
		</div>
	);
};

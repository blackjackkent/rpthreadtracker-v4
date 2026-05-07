import { User } from "next-auth";
import { Logo } from "./Logo";
import { AddMenu } from "./AddMenu";
import { ProfileMenu } from "./ProfileMenu";
import { RefreshButton } from "./RefreshButton";
import { RefreshProgressBar } from "./RefreshProgressBar";
import { NewsButton } from "./NewsButton";

interface HeaderProps {
	user: User;
	onSidebarToggle: () => void;
	onAddCharacter: () => void;
	onAddThread: () => void;
	onNewsToggle: () => void;
	unreadNewsCount: number;
}

export const Header = ({
	user,
	onSidebarToggle,
	onAddCharacter,
	onAddThread,
	onNewsToggle,
	unreadNewsCount,
}: HeaderProps) => {
	return (
		<header className="bg-primary text-white border-b border-primary-dark sticky top-0 z-50">
			<div className="h-12 flex items-center px-3 justify-between">
				{/* Left side - Logo and sidebar toggle */}
				<Logo onSidebarToggle={onSidebarToggle} />

				{/* Right side - Add menu, refresh button, news, and profile dropdown */}
				<div className="flex items-center gap-1.5">
					{/* Refresh Tumblr Data Button */}
					<RefreshButton />
					{/* News Button */}
					<NewsButton unreadCount={unreadNewsCount} onClick={onNewsToggle} />
					{/* Add Menu Dropdown */}
					<AddMenu onAddCharacter={onAddCharacter} onAddThread={onAddThread} />
					{/* Profile Dropdown */}
					<ProfileMenu user={user} />
				</div>
			</div>
			<RefreshProgressBar />
		</header>
	);
};

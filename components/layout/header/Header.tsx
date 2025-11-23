import { User } from "next-auth";
import { Logo } from "./Logo";
import { AddMenu } from "./AddMenu";
import { ProfileMenu } from "./ProfileMenu";

interface HeaderProps {
	user: User;
	onSidebarToggle: () => void;
}

export const Header = ({ user, onSidebarToggle }: HeaderProps) => {
	return (
		<header className="bg-primary text-white border-b border-primary-dark sticky top-0 z-50">
			<div className="h-12 flex items-center px-3 justify-between">
				{/* Left side - Logo and sidebar toggle */}
				<Logo onSidebarToggle={onSidebarToggle} />

				{/* Right side - Add menu and profile dropdown */}
				<div className="flex items-center gap-1.5">
					{/* Add Menu Dropdown */}
					<AddMenu />

					{/* Profile Dropdown */}
					<ProfileMenu user={user} />
				</div>
			</div>
		</header>
	);
};

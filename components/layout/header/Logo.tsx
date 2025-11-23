import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

type LogoProps = {
	onSidebarToggle: () => void;
};

export const Logo = ({ onSidebarToggle }: LogoProps) => {
	return (
		<div className="flex items-center gap-2">
			<button
				onClick={onSidebarToggle}
				className="p-1.5 hover:bg-primary-dark rounded transition-colors"
				aria-label="Toggle sidebar"
			>
				<FontAwesomeIcon icon={faBars} className="w-4 h-4" />
			</button>
			<Link
				href="/dashboard"
				className="text-base font-semibold hover:text-primary-light transition-colors"
			>
				RPTHREADTRACKER
			</Link>
		</div>
	);
};

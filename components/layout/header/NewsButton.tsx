"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons";

interface NewsButtonProps {
	unreadCount: number;
	onClick: () => void;
}

export const NewsButton = ({ unreadCount, onClick }: NewsButtonProps) => {
	return (
		<button
			onClick={onClick}
			className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors cursor-pointer"
			aria-label={`News${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
			title="News"
		>
			<FontAwesomeIcon icon={faNewspaper} className="w-4 h-4" />
			{unreadCount > 0 && (
				<span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
					{unreadCount > 9 ? "9+" : unreadCount}
				</span>
			)}
		</button>
	);
};

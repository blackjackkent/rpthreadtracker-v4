"use client";
import { ICON_MAP } from "@/lib/types/constants";
import { NavItem } from "@/lib/types/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarMenuLinkProps = {
	item: NavItem;
	isOpen: boolean;
};

export const SidebarMenuLink = ({ item, isOpen }: SidebarMenuLinkProps) => {
	const pathname = usePathname();
	const isActive =
		pathname === item.url || pathname?.startsWith(item.url + "/");
	return (
		<li>
			<Link
				href={item.url || "#"}
				className={`flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-sm ${
					isActive
						? "bg-primary text-white"
						: "hover:bg-sidebar-hover text-sidebar-text-muted"
				} ${!isOpen && "md:justify-center"}`}
				title={!isOpen ? item.name : undefined}
			>
				{item.icon && (
					<FontAwesomeIcon
						icon={ICON_MAP[item.icon as keyof typeof ICON_MAP]}
						className="w-3.5 h-3.5 shrink-0"
					/>
				)}
				<span className={`${!isOpen && "md:hidden"}`}>{item.name}</span>
			</Link>
		</li>
	);
};

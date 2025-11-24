import { NavItem } from "@/types/app";

type SidebarMenuTitleProps = {
	item: NavItem;
	isOpen: boolean;
};

export const SidebarMenuTitle = ({ item, isOpen }: SidebarMenuTitleProps) => {
	return (
		<li
			className={`text-sidebar-text-muted text-[10px] font-semibold uppercase mt-3 mb-1.5 ${
				!isOpen && "md:hidden"
			}`}
		>
			{item.name}
		</li>
	);
};

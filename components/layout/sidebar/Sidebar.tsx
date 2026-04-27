import { SidebarMenuTitle } from "./SidebarMenuTitle";
import { SidebarMenuLink } from "./SidebarMenuLink";
import { NAV_ITEMS } from "@/lib/constants";

interface SidebarProps {
	isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
	return (
		<aside
			aria-label="Main navigation"
			className={`bg-sidebar-light border-r border-sidebar-border transition-all duration-300 overflow-y-auto ${
				isOpen ? "w-48" : "w-0 md:w-14"
			}`}
		>
			<nav className="p-3">
				<ul className="space-y-1">
					{NAV_ITEMS.map((item, index) => {
						if (item.title) {
							return (
								<SidebarMenuTitle
									key={`title-${index}`}
									item={item}
									isOpen={isOpen}
								/>
							);
						}

						return (
							<SidebarMenuLink key={item.name} item={item} isOpen={isOpen} />
						);
					})}
				</ul>
			</nav>
		</aside>
	);
};

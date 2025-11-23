import {
	faBox,
	faCalendar,
	faCheck,
	faCircleInfo,
	faGauge,
	faGear,
	faList,
	faPencil,
	faUsers,
	faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { NavItem } from "./types";

export const ICON_MAP = {
	speedometer: faGauge,
	list: faList,
	pencil: faPencil,
	check: faCheck,
	drawer: faBox,
	calendar: faCalendar,
	people: faUsers,
	wrench: faWrench,
	settings: faGear,
	info: faCircleInfo,
};

export const NAV_ITEMS: NavItem[] = [
	{
		name: "Dashboard",
		url: "/dashboard",
		icon: "speedometer",
	},
	{
		title: true,
		name: "Threads",
	},
	{
		name: "All Threads",
		url: "/threads/all",
		icon: "list",
	},
	{
		name: "Your Turn",
		url: "/threads/your-turn",
		icon: "pencil",
	},
	{
		name: "Their Turn",
		url: "/threads/their-turn",
		icon: "check",
	},
	{
		name: "Archived",
		url: "/threads/archived",
		icon: "drawer",
	},
	{
		name: "Queued",
		url: "/threads/queued",
		icon: "calendar",
	},
	{
		title: true,
		name: "Manage",
	},
	{
		name: "Characters",
		url: "/manage-characters",
		icon: "people",
	},
	{
		name: "Tools",
		url: "/tools",
		icon: "wrench",
	},
	{
		name: "Settings",
		url: "/settings",
		icon: "settings",
	},
	{
		name: "Help",
		url: "/help",
		icon: "info",
	},
];

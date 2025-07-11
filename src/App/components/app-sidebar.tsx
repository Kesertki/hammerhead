import {
	BotMessageSquare,
	Database,
	Server,
	Settings,
	SquareTerminal
} from 'lucide-react';
import { SearchForm } from '@/App/components/search-form.tsx';
import { WorkspaceSwitcher } from '@/App/components/WorkspaceSwitcher.tsx';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '@/components/ui/sidebar';
import { NavUser } from './nav-user';

const data = {
	user: {
		name: 'denys',
		email: 'denys@example.com',
		avatar: '/avatars/denys.jpeg'
	}
};

// Menu items.
const items = [
	{
		title: 'Assistant',
		url: '/',
		icon: BotMessageSquare
	},
	// {
	// 	title: 'Inbox',
	// 	url: '/inbox',
	// 	icon: Inbox
	// },
	// {
	// 	title: 'Calendar',
	// 	url: '/calendar',
	// 	icon: Calendar
	// },
	// {
	// 	title: 'Search',
	// 	url: '/search',
	// 	icon: Search
	// },
	{
		title: 'MCP Servers',
		url: '/mcp-servers',
		icon: Server
	},
	{
		title: 'Knowledge Base (RAG)',
		url: '/knowledge-base',
		icon: Database
	},
	{
		title: 'System Prompt',
		url: '/system-prompt',
		icon: SquareTerminal
	},
	{
		title: 'Settings',
		url: '/settings',
		icon: Settings
	}
];

export function AppSidebar() {
	return (
		<Sidebar variant="inset">
			<SidebarHeader>
				<WorkspaceSwitcher />
				<SearchForm />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}

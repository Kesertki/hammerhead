import { Bot, BotMessageSquare, Computer, Database, SquareTerminal } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavUser } from './nav-user';

const data = {
    user: {
        name: 'denys',
        email: 'denys@example.com',
        avatar: '/avatars/denys.jpeg',
    },
};

// Menu items.
const items = [
    {
        title: 'Assistant',
        url: '/',
        icon: BotMessageSquare,
    },
    // {
    // 	title: 'MCP Servers',
    // 	url: '/mcp-servers',
    // 	icon: Server
    // },
    {
        title: 'Knowledge Base',
        url: '/knowledge-base',
        icon: Database,
    },
    {
        title: 'System Prompt',
        url: '/system-prompt',
        icon: SquareTerminal,
    },
    // {
    // 	title: 'Voice',
    // 	url: '/voice',
    // 	icon: Mic
    // },
    {
        title: 'Assistants',
        url: '/assistants',
        icon: Bot,
    },
    {
        title: 'Models',
        url: '/models',
        icon: Computer,
    },
];

export function AppSidebar() {
    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcher />
                {/* <SearchForm /> */}
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
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

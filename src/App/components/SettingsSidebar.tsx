import { ArrowLeft, Database, Palette, Server, Settings as SettingsIcon, Volume2, Zap, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { NavUser } from './NavUser';

const data = {
    user: {
        name: 'denys',
        email: 'denys@example.com',
        avatar: '/avatars/denys.jpeg',
    },
};

// Settings menu items.
const settingsItems = [
    {
        title: 'General',
        url: '/settings/general',
        icon: SettingsIcon,
    },
    {
        title: 'Appearance',
        url: '/settings/appearance',
        icon: Palette,
    },
    {
        title: 'Knowledge Base',
        url: '/settings/knowledge-base',
        icon: Database,
    },
    {
        title: 'MCP Servers',
        url: '/settings/mcp',
        icon: Server,
    },
    {
        title: 'System Prompt',
        url: '/settings/system-prompt',
        icon: FileText,
    },
    {
        title: 'Voice',
        url: '/settings/voice',
        icon: Volume2,
    },
    {
        title: 'Advanced',
        url: '/settings/advanced',
        icon: Zap,
    },
];

export function SettingsSidebar() {
    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {settingsItems.map((item) => (
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

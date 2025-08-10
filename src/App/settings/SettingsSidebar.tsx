import { ArrowLeft, Server, Settings as SettingsIcon, Volume2, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getPreviousRoute } from '@/utils/navigationHistory';

// Settings menu items.
const settingsItems = [
    {
        title: 'General',
        url: '/settings/general',
        icon: SettingsIcon,
    },
    {
        title: 'Voice',
        url: '/settings/voice',
        icon: Volume2,
    },
    {
        title: 'System Prompt',
        url: '/settings/system-prompt',
        icon: FileText,
    },
    // {
    //     title: 'Appearance',
    //     url: '/settings/appearance',
    //     icon: Palette,
    // },
    // {
    //     title: 'Knowledge Base',
    //     url: '/settings/knowledge-base',
    //     icon: Database,
    // },
    {
        title: 'MCP Servers',
        url: '/settings/mcp',
        icon: Server,
    },
    // {
    //     title: 'Advanced',
    //     url: '/settings/advanced',
    //     icon: Zap,
    // },
];

export function SettingsSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine the back navigation path - check location state first, then navigation history
    const getBackPath = () => {
        const state = location.state as { from?: string } | null;
        if (state?.from && state.from.startsWith('/chats/')) {
            return state.from;
        }

        // Fallback to navigation history for menu-based navigation
        const previousRoute = getPreviousRoute();
        if (previousRoute.startsWith('/chats/')) {
            return previousRoute;
        }

        return '/';
    };

    const handleBackNavigation = () => {
        const backPath = getBackPath();
        console.log('SettingsSidebar: Navigating back to:', backPath);
        navigate(backPath);
    };

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <button
                        onClick={handleBackNavigation}
                        className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {getBackPath().startsWith('/chats/') ? 'Chat' : 'Home'}
                    </button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {settingsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
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
        </Sidebar>
    );
}

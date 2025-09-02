import { ArrowLeft, Server, Settings as SettingsIcon, Volume2, FileText, Container, Palette } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

export function SettingsSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Settings menu items.
    const settingsItems = [
        {
            title: t('nav.settings.general'),
            url: '/settings/general',
            icon: SettingsIcon,
        },
        {
            title: t('nav.settings.appearance'),
            url: '/settings/appearance',
            icon: Palette,
        },
        {
            title: t('nav.settings.models'),
            url: '/settings/models',
            icon: Container,
        },
        {
            title: t('nav.settings.voice'),
            url: '/settings/voice',
            icon: Volume2,
        },
        {
            title: t('nav.settings.system_prompt'),
            url: '/settings/system-prompt',
            icon: FileText,
        },

        // {
        //     title: 'Knowledge Base',
        //     url: '/settings/knowledge-base',
        //     icon: Database,
        // },
        {
            title: t('nav.settings.mcp'),
            url: '/settings/mcp',
            icon: Server,
        },
        // {
        //     title: 'Advanced',
        //     url: '/settings/advanced',
        //     icon: Zap,
        // },
    ];

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
                        {getBackPath().startsWith('/chats/') ? t('back_to_chat') : t('back_to_home')}
                    </button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t('settings')}</SidebarGroupLabel>
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

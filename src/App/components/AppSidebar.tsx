import { BotMessageSquare, Computer } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

// Menu items.
const items = [
    {
        title: 'Assistant',
        url: '/',
        icon: BotMessageSquare,
    },
    // {
    //     title: 'Agents',
    //     url: '/agents',
    //     icon: Bot,
    // },
    {
        title: 'Models',
        url: '/models',
        icon: Computer,
    },
];

export function AppSidebar() {
    return (
        <Sidebar variant="inset">
            {/* <SidebarHeader>
                <SearchForm />
            </SidebarHeader> */}
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
        </Sidebar>
    );
}

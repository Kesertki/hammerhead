import { BotMessageSquare, CirclePlus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useChatStore, initializeChatStore } from '@/stores/chatStore.ts';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Initialize store only once using useEffect instead of on every render
    useEffect(() => {
        initializeChatStore();
    }, []);

    const chats = useChatStore((state) => state.chats);
    const createNewChat = useChatStore((state) => state.createNewChat);
    const deleteChat = useChatStore((state) => state.deleteChat);

    // Extract current chatId from URL path
    const currentChatId = location.pathname.startsWith('/chats/') ? location.pathname.split('/chats/')[1] : null;

    const handleNewChat = async () => {
        await createNewChat();
        navigate('/');
    };

    const handleChatClick = async (chatId: string) => {
        navigate(`/chats/${chatId}`);
    };

    const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (confirm('Are you sure you want to delete this chat?')) {
            await deleteChat(chatId);
        }
    };

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <Button variant="ghost" size="sm" onClick={handleNewChat} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                        <CirclePlus className="w-4 h-4" />
                        {t('new_chat')}
                    </div>
                </Button>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t('chats')}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {chats.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton asChild isActive={currentChatId === chat.id} className="group">
                                        <div
                                            className="flex items-center justify-between w-full cursor-pointer"
                                            onClick={() => handleChatClick(chat.id)}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <BotMessageSquare className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate" title={chat.title}>
                                                    {chat.title}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive/20 transition-opacity"
                                                onClick={(e) => handleDeleteChat(chat.id, e)}
                                            >
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {chats.length === 0 && (
                                <SidebarMenuItem>
                                    <div className="px-2 py-2 text-sm text-muted-foreground">
                                        No chats yet. Start a conversation!
                                    </div>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

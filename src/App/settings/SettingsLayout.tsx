import { House } from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { McpActions, type McpState } from '@/App/components/McpActions';
import { SettingsSidebar } from '@/App/settings/SettingsSidebar';
import { SystemPromptActions, type SystemPromptState } from '@/App/components/SystemPromptActions';
import { Button } from '@/components/ui/button.tsx';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { eventBus } from '@/utils/eventBus.ts';
import { getPreviousRoute } from '@/utils/navigationHistory';
import { useTranslation } from 'react-i18next';

interface SettingsLayoutProps {
    children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [mcpState, setMcpState] = useState<McpState>({ hasUnsavedChanges: false, validationErrors: 0 });
    const [systemPromptState, setSystemPromptState] = useState<SystemPromptState>({
        activePromptId: '',
        prompts: [],
        canDelete: false,
    });

    const isMcpRoute = location.pathname === '/settings/mcp';
    const isSystemPromptRoute = location.pathname === '/settings/system-prompt';

    // Determine the back navigation path
    // Check if we came from a specific chat via location state, or fallback to navigation history
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
        console.log('SettingsLayout: Navigating back to:', backPath);
        navigate(backPath);
    };

    useEffect(() => {
        // Listen for MCP state updates
        const unsubscribeMcp = eventBus.on<McpState>('mcp:stateUpdate', (state) => {
            setMcpState(state);
        });

        // Listen for SystemPrompt state updates
        const unsubscribeSystemPrompt = eventBus.on<SystemPromptState>('systemPrompt:stateUpdate', (state) => {
            setSystemPromptState(state);
        });

        return () => {
            unsubscribeMcp();
            unsubscribeSystemPrompt();
        };
    }, []);

    const handleMcpAction = (action: string) => {
        eventBus.emit('mcp:action', action);
    };

    const handleSystemPromptAction = (action: string) => {
        eventBus.emit('systemPrompt:action', action);
    };

    const handleSystemPromptChange = (promptId: string) => {
        eventBus.emit('systemPrompt:promptChange', promptId);
    };
    return (
        <SidebarProvider>
            <SettingsSidebar />
            <SidebarInset className="flex flex-col overflow-hidden h-[calc(100vh-20px)]">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarTrigger className="-ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('toggle_sidebar')}</p>
                            </TooltipContent>
                        </Tooltip>
                        <h1 className="text-lg font-semibold">{t('settings')}</h1>
                    </div>

                    {/* MCP Actions when on MCP route */}
                    {isMcpRoute && <McpActions mcpState={mcpState} onAction={handleMcpAction} />}

                    {/* SystemPrompt Actions when on SystemPrompt route */}
                    {isSystemPromptRoute && (
                        <SystemPromptActions
                            systemPromptState={systemPromptState}
                            onAction={handleSystemPromptAction}
                            onPromptChange={handleSystemPromptChange}
                        />
                    )}

                    <div className="ml-auto">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBackNavigation}>
                                    <House className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{getBackPath().startsWith('/chats/') ? t('back_to_chat') : t('back_to_home')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </header>
                <div className="flex-1 h-full overflow-hidden flex flex-col">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}

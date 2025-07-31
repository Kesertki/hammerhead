import { ArrowDown, ArrowUp, MoreHorizontal } from 'lucide-react';
import { useCallback, ComponentType } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useExternalState } from '@/hooks/useExternalState.ts';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';
import { llmState } from '@/state/llmState.ts';

interface ActionGroup {
    label: string;
    icon: ComponentType<any>;
    action?: string; // Optional action for specific items
    onClick?: () => void; // Optional click handler
    disabled?: boolean;
}

export function NavActions() {
    const state = useExternalState(llmState);
    const hasModel = state.model != null && state.model.name != null;

    const exportChat = useCallback(async () => {
        const result = await electronLlmRpc.exportChatSession();

        if (result) {
            toast.success('Chat exported successfully!');
        } else {
            toast.error('Failed to export chat.');
        }
    }, []);

    const importChat = useCallback(async () => {
        const result = await electronLlmRpc.importChatSession();
        if (result) {
            toast.success('Chat imported successfully!');
        } else {
            toast.error('Failed to import chat.');
        }
    }, []);

    const data: Array<ActionGroup[]> = [
        // [
        //     {
        //         label: 'Customize Page',
        //         icon: Settings2,
        //     },
        //     {
        //         label: 'Turn into wiki',
        //         icon: FileText,
        //     },
        // ],
        // [
        //     {
        //         label: 'Copy Link',
        //         icon: Link,
        //     },
        //     {
        //         label: 'Duplicate',
        //         icon: Copy,
        //     },
        //     {
        //         label: 'Move to',
        //         icon: CornerUpRight,
        //     },
        //     {
        //         label: 'Move to Trash',
        //         icon: Trash2,
        //     },
        // ],
        // [
        //     {
        //         label: 'Undo',
        //         icon: CornerUpLeft,
        //     },
        //     {
        //         label: 'View analytics',
        //         icon: LineChart,
        //     },
        //     {
        //         label: 'Version History',
        //         icon: GalleryVerticalEnd,
        //     },
        //     {
        //         label: 'Show delete pages',
        //         icon: Trash,
        //     },
        //     {
        //         label: 'Notifications',
        //         icon: Bell,
        //     },
        // ],
        [
            {
                label: 'Import',
                action: 'import',
                icon: ArrowUp,
                disabled: !hasModel,
                onClick: importChat,
            },
            {
                label: 'Export',
                action: 'export',
                icon: ArrowDown,
                disabled: !hasModel,
                onClick: exportChat,
            },
        ],
    ];

    return (
        <div className="flex items-center gap-2 text-sm">
            {/* <div className="hidden font-medium text-muted-foreground md:inline-block">Edit Oct 08</div> */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="data-[state=open]:bg-accent cursor-pointer">
                        <MoreHorizontal />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 overflow-hidden rounded-lg p-0" align="end">
                    <Sidebar collapsible="none" className="bg-transparent">
                        <SidebarContent>
                            {data.map((group, index) => (
                                <SidebarGroup key={index} className="border-b last:border-none">
                                    <SidebarGroupContent className="gap-0">
                                        <SidebarMenu>
                                            {group.map((item, index) => (
                                                <SidebarMenuItem key={index}>
                                                    <SidebarMenuButton
                                                        disabled={item.disabled}
                                                        onClick={() => item.onClick && item.onClick()}
                                                    >
                                                        <item.icon /> <span>{item.label}</span>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            ))}
                        </SidebarContent>
                    </Sidebar>
                </PopoverContent>
            </Popover>
        </div>
    );
}

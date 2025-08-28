import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Settings, CheckCircle, XCircle } from 'lucide-react';

interface McpConsentRequest {
    toolName: string;
    args: any;
    requestId: string;
}

export function McpConsentDialog() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<McpConsentRequest | null>(null);

    useEffect(() => {
        const handleConsentRequest = (data: McpConsentRequest) => {
            setCurrentRequest(data);
            setIsOpen(true);
        };

        // Listen for consent requests from the main process
        window.electronAPI.onShowMcpConsentDialog(handleConsentRequest);

        return () => {
            // Note: In a real implementation, you might want to properly remove the listener
            // This depends on how your electronAPI is implemented
        };
    }, []);

    const handleApprove = () => {
        if (currentRequest) {
            window.electronAPI.respondMcpToolConsent({
                requestId: currentRequest.requestId,
                approved: true,
            });
        }
        setIsOpen(false);
        setCurrentRequest(null);
    };

    const handleDeny = () => {
        if (currentRequest) {
            window.electronAPI.respondMcpToolConsent({
                requestId: currentRequest.requestId,
                approved: false,
            });
        }
        setIsOpen(false);
        setCurrentRequest(null);
    };

    const formatArgs = (args: any): string => {
        if (!args || typeof args !== 'object') {
            return String(args || '');
        }

        try {
            return JSON.stringify(args, null, 2);
        } catch {
            return String(args);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <DialogTitle>{t('mcp.consent.title', 'Tool Execution Request')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t(
                            'mcp.consent.description',
                            'A tool wants to execute an action. Please review and approve or deny this request.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                {currentRequest && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="font-medium">{t('mcp.consent.toolName', 'Tool Name')}:</span>
                                <Badge variant="outline" className="font-mono">
                                    {currentRequest.toolName}
                                </Badge>
                            </div>
                        </div>

                        {currentRequest.args && Object.keys(currentRequest.args).length > 0 && (
                            <div className="space-y-2">
                                <span className="font-medium">{t('mcp.consent.parameters', 'Parameters')}:</span>
                                <div className="bg-muted rounded-md p-3 max-h-40 overflow-y-auto">
                                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {formatArgs(currentRequest.args)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <p className="font-medium mb-1">
                                        {t('mcp.consent.warning.title', 'Security Warning')}
                                    </p>
                                    <p>
                                        {t(
                                            'mcp.consent.warning.message',
                                            'This tool may perform actions that could affect your system or data. Only approve if you trust the source and understand what the tool will do.'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleDeny} className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        {t('mcp.consent.deny', 'Deny')}
                    </Button>
                    <Button onClick={handleApprove} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {t('mcp.consent.approve', 'Approve')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

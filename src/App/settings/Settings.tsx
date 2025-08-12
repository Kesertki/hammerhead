import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import McpServersConfig from './McpServersConfig';
import SystemPrompt from './SystemPrompt';
import { VoiceSettings } from './VoiceSettings';
import { ModelCards } from '../pages/ModelCards';
import { GeneralSettingsPage } from './GeneralSettings';

const AppearanceSettings = () => {
    return (
        <div>
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Appearance</h2>
            <p>Configure your theme and display preferences.</p>
            {/* Add appearance settings here */}
        </div>
    );
};

const AdvancedSettings = () => {
    return (
        <div>
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">Advanced Settings</h2>
            <p>Advanced configuration options.</p>
            {/* Add advanced settings here */}
        </div>
    );
};

export default function Settings() {
    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden h-full">
                <Routes>
                    <Route path="/" element={<Navigate to="/settings/general" replace />} />
                    <Route
                        path="/general"
                        element={
                            <ScrollArea className="h-full">
                                <GeneralSettingsPage />
                            </ScrollArea>
                        }
                    />
                    <Route
                        path="/appearance"
                        element={
                            <ScrollArea className="h-full">
                                <AppearanceSettings />
                            </ScrollArea>
                        }
                    />
                    <Route
                        path="/models"
                        element={
                            <ScrollArea className="h-full">
                                <ModelCards />
                            </ScrollArea>
                        }
                    />
                    <Route
                        path="/voice"
                        element={
                            <ScrollArea className="h-full">
                                <VoiceSettings />
                            </ScrollArea>
                        }
                    />
                    <Route
                        path="/mcp"
                        element={
                            <div className="h-full">
                                <McpServersConfig />
                            </div>
                        }
                    />
                    <Route
                        path="/system-prompt"
                        element={
                            <div className="h-full">
                                <SystemPrompt />
                            </div>
                        }
                    />
                    <Route
                        path="/advanced"
                        element={
                            <ScrollArea className="h-full">
                                <AdvancedSettings />
                            </ScrollArea>
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

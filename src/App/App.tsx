import { useEffect } from 'react';
import { Route, HashRouter as Router, Routes, useNavigate } from 'react-router-dom';
import McpServersConfig from '@/App/pages/McpServersConfig.tsx';
import { Chat } from './Chat.tsx';
import Layout from './components/Layout.tsx';
import SettingsLayout from './components/SettingsLayout.tsx';
import { Settings } from './pages/Settings.tsx';

import './App.css';
import { ModelSelector } from './components/ModelSelector.tsx';
import { Logs } from './pages/Logs.tsx';

// const PlaceholderPage = ({ title }: { title: string }) => {
//     return (
//         <div className="p-4">
//             <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">{title}</h1>
//             <p>This is a placeholder page.</p>
//         </div>
//     );
// };

function NavigationHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        // Set up the electron navigation listener
        if (window.electronAPI?.onNavigateToRoute) {
            window.electronAPI.onNavigateToRoute((route: string) => {
                navigate(route);
            });
        }
    }, [navigate]);

    return null;
}

export function App() {
    return (
        <Router>
            <NavigationHandler />
            <Routes>
                {/* Settings route with custom layout */}
                <Route
                    path="/settings/*"
                    element={
                        <SettingsLayout>
                            <Settings />
                        </SettingsLayout>
                    }
                />

                {/* All other routes with main Layout */}
                <Route
                    path="/*"
                    element={
                        <Layout>
                            <Routes>
                                <Route path="/" element={<Chat />} />
                                <Route path="/mcp-servers" element={<McpServersConfig />} />
                                {/* <Route path="/agents" element={<PlaceholderPage title="Agents" />} /> */}
                                <Route
                                    path="/models"
                                    element={
                                        <div className="p-4">
                                            <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-8">
                                                Models
                                            </h1>
                                            <ModelSelector />
                                        </div>
                                    }
                                />
                                <Route path="/logs" element={<Logs />} />
                            </Routes>
                        </Layout>
                    }
                />
            </Routes>
        </Router>
    );
}

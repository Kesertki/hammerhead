import { useEffect } from 'react';
import { Route, HashRouter as Router, Routes, useNavigate } from 'react-router-dom';
import { Chat } from './Chat.tsx';
import Layout from './components/Layout.tsx';
import SettingsLayout from './settings/SettingsLayout.tsx';
import Settings from './settings/Settings.tsx';
import { Logs } from './pages/Logs.tsx';
import { Models } from './pages/Models.tsx';

import './App.css';

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
                                <Route path="/models" element={<Models />} />
                                <Route path="/logs" element={<Logs />} />
                            </Routes>
                        </Layout>
                    }
                />
            </Routes>
        </Router>
    );
}

import { HardDriveUpload } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { electronLlmRpc } from '@/rpc/llmRpc.ts';

import './Welcome.css';

export function Welcome() {
    const openSelectModelFileDialog = useCallback(async () => {
        await electronLlmRpc.selectModelFileAndLoad(true);
    }, []);

    return (
        <div className="welcome-container">
            <h1 className="welcome">
                Welcome to Hammerhead<sup className="alpha">(alpha)</sup>
            </h1>
            <div className="hint">
                <p className="hint-text">
                    <Button variant="link" size="sm" className="cursor-pointer" onClick={openSelectModelFileDialog}>
                        <HardDriveUpload className="inline-icon mr-1" />
                        Choose a model file
                    </Button>{' '}
                    to start chatting
                </p>
            </div>
            <img src="/header.webp" alt="Hammerhead Logo" />
        </div>
    );
}

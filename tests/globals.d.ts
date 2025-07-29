export {};

declare global {
    interface Window {
        ipcRenderer: {
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
            removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
        };
    }
}

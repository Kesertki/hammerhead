import { createBirpc } from 'birpc';

function serializeWithBinarySupport(value: unknown): string {
    return JSON.stringify(value, (key, val) => {
        if (val instanceof ArrayBuffer) {
            return {
                __type: 'ArrayBuffer',
                data: Array.from(new Uint8Array(val)),
            };
        }
        if (val instanceof Uint8Array) {
            return {
                __type: 'Uint8Array',
                data: Array.from(val),
            };
        }
        return val;
    });
}

function deserializeWithBinarySupport(value: string): unknown {
    return JSON.parse(value, (key, val) => {
        if (val && typeof val === 'object' && val.__type === 'ArrayBuffer') {
            return new Uint8Array(val.data).buffer;
        }
        if (val && typeof val === 'object' && val.__type === 'Uint8Array') {
            return new Uint8Array(val.data);
        }
        return val;
    });
}

export function createRendererSideBirpc<
    const RendererFunction = Record<string, never>,
    const ElectronFunctions extends object = Record<string, never>,
>(toRendererEventName: string, fromRendererEventName: string, electronFunctions: ElectronFunctions) {
    return createBirpc<RendererFunction, ElectronFunctions>(electronFunctions, {
        post: (data) => window.ipcRenderer.send(fromRendererEventName, data),
        on: (onData) =>
            window.ipcRenderer.on(toRendererEventName, (event, data) => {
                onData(data);
            }),
        serialize: serializeWithBinarySupport,
        deserialize: deserializeWithBinarySupport,
    });
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { registerLlmRpc } from './rpc/llmRpc.ts';
import { getMcpConfig, setMcpConfig } from './settings';
import {
	SystemPromptConfig,
	getSystemPrompts,
	setSystemPrompts
} from './settings/prompts.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── index.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
	? path.join(process.env.APP_ROOT, 'public')
	: RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
	win = new BrowserWindow({
		icon: path.join(
			process.env.VITE_PUBLIC,
			process.platform === 'darwin'
				? 'icon.png'
				: process.platform === 'win32'
					? 'icon.ico'
					: 'icon.png'
		),
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
			contextIsolation: true,
			enableRemoteModule: false,
			nodeIntegration: false
		},
		width: 1000,
		height: 700
	});

	registerLlmRpc(win);

	// open external links in the default browser
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('file://')) return { action: 'allow' };

		void shell.openExternal(url);
		return { action: 'deny' };
	});

	// Test active push message to Renderer-process.
	win.webContents.on('did-finish-load', () => {
		win?.webContents.send('main-process-message', new Date().toLocaleString());
	});

	if (VITE_DEV_SERVER_URL) void win.loadURL(VITE_DEV_SERVER_URL);
	else void win.loadFile(path.join(RENDERER_DIST, 'index.html'));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
		win = null;
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle('get-system-prompts', async () => {
	return await getSystemPrompts();
});

ipcMain.handle(
	'set-system-prompts',
	async (_event, prompts: SystemPromptConfig) => {
		await setSystemPrompts(prompts);
	}
);

ipcMain.handle('open-external', async (_event, url: string) => {
	await shell.openExternal(url);
});

ipcMain.handle('get-mcp-config', async () => {
	return await getMcpConfig();
});

ipcMain.handle('set-mcp-config', async (_event, config: any) => {
	await setMcpConfig(config);
});

app.whenReady().then(createWindow);

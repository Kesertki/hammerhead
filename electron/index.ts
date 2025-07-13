import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import type { McpConfig } from '../src/types.ts';
import { registerLlmRpc } from './rpc/llmRpc.ts';
import { getMcpConfig, initializeLogger, setMcpConfig } from './settings';
import {
	getSystemPrompts,
	SystemPromptConfig,
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

function createMenu() {
	const isMac = process.platform === 'darwin';

	const template: Electron.MenuItemConstructorOptions[] = [
		// App menu (macOS only)
		...(isMac
			? [
					{
						label: app.getName(),
						submenu: [
							{ role: 'about' as const },
							{ type: 'separator' as const },
							{ role: 'services' as const },
							{ type: 'separator' as const },
							{ role: 'hide' as const },
							{ role: 'hideOthers' as const },
							{ role: 'unhide' as const },
							{ type: 'separator' as const },
							{ role: 'quit' as const }
						]
					}
				]
			: []),
		// File menu
		{
			label: 'File',
			submenu: [
				isMac ? { role: 'close' as const } : { role: 'quit' as const }
			]
		},
		// Edit menu
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' as const },
				{ role: 'redo' as const },
				{ type: 'separator' as const },
				{ role: 'cut' as const },
				{ role: 'copy' as const },
				{ role: 'paste' as const },
				...(isMac
					? [
							{ role: 'pasteAndMatchStyle' as const },
							{ role: 'delete' as const },
							{ role: 'selectAll' as const },
							{ type: 'separator' as const },
							{
								label: 'Speech',
								submenu: [
									{ role: 'startSpeaking' as const },
									{ role: 'stopSpeaking' as const }
								]
							}
						]
					: [
							{ role: 'delete' as const },
							{ type: 'separator' as const },
							{ role: 'selectAll' as const }
						])
			]
		},
		// View menu
		{
			label: 'View',
			submenu: [
				{ role: 'reload' as const },
				{ role: 'forceReload' as const },
				{ role: 'toggleDevTools' as const },
				{ type: 'separator' as const },
				{ role: 'resetZoom' as const },
				{ role: 'zoomIn' as const },
				{ role: 'zoomOut' as const },
				{ type: 'separator' as const },
				{ role: 'togglefullscreen' as const },
				{ type: 'separator' as const },
				{
					label: 'Settings',
					click: () => {
						win?.webContents.send('navigate-to-route', '/settings');
					}
				},
				{
					label: 'Logs',
					click: () => {
						win?.webContents.send('navigate-to-route', '/logs');
					}
				}
			]
		},
		// Window menu
		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' as const },
				{ role: 'close' as const },
				...(isMac
					? [
							{ type: 'separator' as const },
							{ role: 'front' as const },
							{ type: 'separator' as const },
							{ role: 'window' as const }
						]
					: [])
			]
		},
		// Help menu
		{
			role: 'help' as const,
			submenu: [
				{
					label: 'Learn More',
					click: async () => {
						await shell.openExternal('https://electronjs.org');
					}
				}
			]
		}
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

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
			nodeIntegration: false
		},
		width: 1000,
		height: 700
	});

	// Create and set the menu
	createMenu();

	registerLlmRpc(win);

	// open external links in the default browser
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('file://')) return { action: 'allow' };

		void shell.openExternal(url);
		return { action: 'deny' };
	});

	// Test active push message to Renderer-process.
	win.webContents.on('did-finish-load', () => {
		win?.webContents.send(
			'main-process-message',
			new Date().toLocaleString()
		);
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

ipcMain.handle('set-mcp-config', async (_event, config: McpConfig) => {
	await setMcpConfig(config);
});

// Log-related IPC handlers
ipcMain.handle('get-logs', async (_event, limit?: number) => {
	const { getLogs } = await import('./settings/logger.ts');
	return await getLogs(limit);
});

ipcMain.handle('clear-logs', async () => {
	const { clearLogs } = await import('./settings/logger.ts');
	await clearLogs();
});

ipcMain.handle('get-log-file-path', async () => {
	const { getLogFilePath } = await import('./settings/logger.ts');
	return getLogFilePath();
});

app.whenReady().then(async () => {
	// Initialize logger before anything else
	await initializeLogger();
	console.log('Hammerhead application starting...');

	createWindow();
});

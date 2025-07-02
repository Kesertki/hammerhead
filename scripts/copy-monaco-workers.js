import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Copy Monaco Editor files to public directory for offline use
const monacoNodeModules = join(__dirname, '../node_modules/monaco-editor/min');
const publicMonacoDir = join(__dirname, '../public/monaco-editor');

console.log('Setting up Monaco Editor for offline use...');

try {
	// Remove existing directory if it exists
	if (existsSync(publicMonacoDir)) {
		execSync(`rm -rf "${publicMonacoDir}"`);
	}

	// Create the directory structure
	mkdirSync(publicMonacoDir, { recursive: true });

	// Copy the entire vs directory from monaco-editor
	const vsSource = join(monacoNodeModules, 'vs');
	const vsDestination = join(publicMonacoDir, 'vs');

	if (existsSync(vsSource)) {
		execSync(`cp -r "${vsSource}" "${vsDestination}"`);
		console.log('✓ Copied Monaco Editor vs directory');
	} else {
		throw new Error(`Monaco Editor vs directory not found at: ${vsSource}`);
	}

	console.log('Monaco Editor offline setup completed successfully!');
	console.log(`Files copied to: ${publicMonacoDir}`);
} catch (error) {
	console.error('Error setting up Monaco Editor for offline use:', error);
	process.exit(1);
}

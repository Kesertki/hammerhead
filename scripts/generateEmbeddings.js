import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { ChromaClient } from 'chromadb';
import { glob } from 'glob';
import { getLlama } from 'node-llama-cpp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadSettings() {
	const settingsPath = path.join(__dirname, 'ingest.json');
	if (fs.existsSync(settingsPath)) {
		const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
		return JSON.parse(settingsContent);
	}
	throw new Error('Ingest settings file not found');
}

const settings = await loadSettings();

async function readMarkdownFiles() {
	const results = [];
	const scriptDir = __dirname;

	// Process each source defined in the settings
	for (const source of settings.sources) {
		// Resolve the root path relative to the script directory
		const root = path.resolve(scriptDir, source.root);

		console.log(`Processing source with root: ${root}`);

		// For each pattern in the source
		for (const pattern of source.patterns) {
			// Use proper glob syntax without joining paths - glob handles the pattern directly
			const fullPattern = `${root}/${pattern}`;
			console.log(`Searching for files matching pattern: ${fullPattern}`);

			// Use glob to find matching files
			const files = await glob(fullPattern, {
				ignore: source.ignore ? source.ignore.map((i) => `${root}/${i}`) : [],
				nodir: true
			});

			if (files.length === 0) {
				console.warn(`No files found for pattern: ${fullPattern}`);
				continue;
			}

			console.log(`Found ${files.length} files for pattern: ${fullPattern}`);

			// Read content of each file
			for (const file of files) {
				try {
					const content = fs.readFileSync(file, 'utf-8');
					results.push({
						file: path.basename(file),
						path: file,
						content
					});
				} catch (error) {
					console.error(`Error reading file ${file}: ${error.message}`);
				}
			}
		}
	}

	console.log(`Total files processed: ${results.length}`);
	return results;
}

async function generateEmbeddings(model, files) {
	try {
		// Create an embedding context from the model
		const embeddingContext = await model.createEmbeddingContext();
		console.log('Embedding context created successfully');

		// Array to store embeddings for all files
		const allEmbeddings = [];

		// Process each file
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			try {
				// Generate embedding for the content
				// For larger files, we'll use the first 1024 characters which should fit in context
				const textToEmbed = file.content.slice(0, 1024);
				const embedding = await embeddingContext.getEmbeddingFor(textToEmbed);

				console.log(
					`Successfully embedded file ${i + 1}/${files.length}: ${file.file}`
				);
				allEmbeddings.push(embedding);
			} catch (error) {
				console.error(`Error embedding file ${file.file}: ${error.message}`);
				// Add a placeholder embedding to maintain alignment with files array
				allEmbeddings.push(null);
			}
		}

		// Filter out null embeddings and corresponding files
		const validResults = files
			.map((file, index) => ({
				file,
				embedding: allEmbeddings[index]
			}))
			.filter((item) => item.embedding !== null);

		console.log(
			`Successfully embedded ${validResults.length} out of ${files.length} files`
		);

		return validResults;
	} catch (error) {
		console.error('Error creating embedding context:', error);
		throw error;
	}
}

async function storeEmbeddingsInChroma(chromaClient, embeddings, texts, files) {
	try {
		// Get or create collection
		const collection = await chromaClient.getOrCreateCollection({
			name: 'markdown_embeddings'
		});

		// Generate unique IDs using path-based hashing
		const ids = files.map((file) => {
			// Use the full path to create a unique ID
			const fullPath = file.path;
			// Create a hash of the path to make it url-safe while keeping it unique
			const pathHash = Buffer.from(fullPath)
				.toString('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');

			return pathHash;
		});

		// Extract vectors from the LlamaEmbedding objects
		const formattedEmbeddings = embeddings.map((embedding) => {
			if (embedding && typeof embedding === 'object') {
				if (Array.isArray(embedding.vector)) {
					return embedding.vector;
				} else if (Array.isArray(embedding.values)) {
					return embedding.values;
				}
			} else if (Array.isArray(embedding)) {
				return embedding;
			}

			console.log('Embedding structure:', Object.keys(embedding));
			throw new Error('Invalid embedding format');
		});

		// Debug info
		console.log(`IDs length: ${ids.length}`);
		console.log(`Embeddings length: ${formattedEmbeddings.length}`);
		console.log(`Texts length: ${texts.length}`);
		console.log(`Files length: ${files.length}`);

		// Add the embeddings with enhanced metadata
		await collection.add({
			ids,
			embeddings: formattedEmbeddings,
			documents: texts,
			metadatas: files.map((file) => ({
				filename: file.file,
				fullPath: file.path
			}))
		});

		console.log('Successfully stored embeddings in ChromaDB');
	} catch (error) {
		console.error('ChromaDB error:', error.message);
		throw error;
	}
}

async function main() {
	const llama = await getLlama();
	const model = await llama.loadModel({
		modelPath: path.join(__dirname, '../models', 'bge-small-en-v1.5-q8_0.gguf'),
		embeddingOnly: true, // Set this if it's an embedding-only model
		verbose: true // For more detailed output
	});
	// const chromaClient = new ChromaClient();
	const chromaClient = new ChromaClient({
		path: 'http://localhost:8000' // Explicitly specify the server URL
	});

	try {
		await chromaClient.heartbeat();
		console.log('ChromaDB server is running');
	} catch (error) {
		console.error('ChromaDB server is not running. Please start it first.');
		console.error('Run: npx chromadb start --path=./chromadb_data');
		return;
	}

	const markdownFiles = await readMarkdownFiles();
	if (markdownFiles.length === 0) {
		console.error('No markdown files found to process.');
		return;
	}

	console.log(`Found ${markdownFiles.length} markdown files to process.`);

	const results = await generateEmbeddings(model, markdownFiles);

	// Extract relevant data for ChromaDB
	const validFiles = results.map((result) => result.file);
	const embeddings = results.map((result) => result.embedding);
	const texts = validFiles.map((file) => file.content);

	await storeEmbeddingsInChroma(chromaClient, embeddings, texts, validFiles);
	console.log('Embeddings generated and stored successfully.');
}

main().catch(console.error);

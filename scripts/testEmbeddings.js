import { fileURLToPath } from 'node:url';
import path from 'path';
import { ChromaClient } from 'chromadb';
import { getLlama } from 'node-llama-cpp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testEmbeddings() {
	// Initialize ChromaDB client with the correct URL
	const chromaClient = new ChromaClient({
		path: 'http://localhost:8000'
	});

	try {
		// Check if ChromaDB is running
		await chromaClient.heartbeat();
		console.log('ChromaDB server is running');

		// Initialize LLama
		const llama = await getLlama();
		const model = await llama.loadModel({
			modelPath: path.join(
				__dirname,
				'../models',
				'bge-small-en-v1.5-q8_0.gguf'
			),
			embeddingOnly: true,
			verbose: true
		});

		// Test queries
		const testQueries = [
			'What is React?',
			'How do I install npm packages?',
			'Explain TypeScript interfaces',
			'Explain the use of adf-button in Angular',
			'What is adf-button component?'
		];

		for (const query of testQueries) {
			console.log(`\n===== Testing query: "${query}" =====`);

			// Generate embedding for the query
			const embeddingContext = await model.createEmbeddingContext();
			const queryEmbedding = await embeddingContext.getEmbeddingFor(query);

			// Extract the vector from the embedding object
			const queryVector =
				queryEmbedding.vector || queryEmbedding.values || queryEmbedding;

			// Get the collection
			const collection = await chromaClient.getCollection({
				name: 'markdown_embeddings'
			});

			// Query the collection
			const results = await collection.query({
				queryEmbeddings: [queryVector],
				nResults: 5
			});

			if (results.distances && results.distances[0]) {
				console.log('All similarity scores:');
				results.distances[0].forEach((distance, idx) => {
					console.log(`Document ${results.ids[0][idx]}: ${distance}`);
				});
			}

			// Display results
			console.log('\nRelevant documents:');
			if (results.documents && results.documents[0]) {
				let hasResults = false;
				const relevanceThreshold = 35; // Higher number = less similar (adjust based on your model)

				results.documents[0].forEach((doc, i) => {
					// Only show results with good relevance scores (SMALLER is better)
					if (
						results.distances &&
						results.distances[0] &&
						results.distances[0][i] < relevanceThreshold
					) {
						hasResults = true;
						console.log(`\n--- Result ${i + 1} ---`);
						console.log(`Document ID: ${results.ids[0][i]}`);
						console.log(`Content preview: ${doc.substring(0, 150)}...`);

						if (results.metadatas && results.metadatas[0]) {
							console.log(
								`Metadata: ${JSON.stringify(results.metadatas[0][i])}`
							);
						}

						console.log(`Similarity score: ${results.distances[0][i]}`);
					}
				});

				if (!hasResults) {
					console.log('No relevant documents found for this query');
				}
			}
		}
	} catch (error) {
		console.error('Error testing embeddings:', error);
	} finally {
		console.log('\nTest complete');
	}
}

// Run the test
testEmbeddings().catch(console.error);

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChromaClient } from 'chromadb';
import { getLlama } from 'node-llama-cpp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EMBEDDING_MODEL = 'hf_CompendiumLabs_bge-small-en-v1.5.Q8_0.gguf';

export const chromaClient = new ChromaClient({
	// Configuration options for the Chroma client
	// For example, if Chroma supports a client-server model:
	// host: 'localhost',
	// port: 50051,
	path: 'http://localhost:8000'
});

export async function checkChromaConnection(): Promise<boolean> {
	try {
		await chromaClient.heartbeat();
		console.log('Chroma connection successful');
		return true;
	} catch (error) {
		console.error('Failed to connect to Chroma:', error);
		return false;
	}
}

export const isChromaConnected = await checkChromaConnection();

// Add proper types to the function parameters
export async function generateQueryEmbeddings(
	// model: LlamaModel,
	query: string
): Promise<readonly number[]> {
	const llama = await getLlama();
	const model = await llama.loadModel({
		modelPath: join(__dirname, '../models', EMBEDDING_MODEL)
	});

	// Generate embedding for the query
	const embeddingContext = await model.createEmbeddingContext();
	const queryEmbedding = await embeddingContext.getEmbeddingFor(query);

	// Extract the vector from the embedding object
	const queryVector = (queryEmbedding.vector ??
		(queryEmbedding as any).values ??
		queryEmbedding) as readonly number[];

	return queryVector;
}

export async function retrieveRelevantInformation(
	queryVector: any
): Promise<string[]> {
	// Get the collection
	const collection = await chromaClient.getCollection({
		name: 'markdown_embeddings'
	});

	// Query the collection
	const results = await collection.query({
		queryEmbeddings: [queryVector],
		nResults: 5 // Request more than needed
	});

	// Apply relevance threshold filtering
	const relevanceThreshold = 35;
	const filteredDocuments: string[] = [];

	if (
		results.documents &&
		results.documents[0] &&
		results.distances &&
		results.distances[0]
	) {
		results.documents[0].forEach((doc, i) => {
			if (
				doc &&
				results.distances?.[0]?.[i] !== undefined &&
				results.distances[0][i] < relevanceThreshold
			) {
				filteredDocuments.push(doc);
			}
		});
	}

	return filteredDocuments;
}

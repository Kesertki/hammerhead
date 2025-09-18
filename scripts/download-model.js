#!/usr/bin/env node

import { pipeline } from '@xenova/transformers';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function downloadModel() {
    console.log('📦 Downloading distilbart-cnn-6-6 model for chat title summarization...');
    
    try {
        // This will download and cache the model in node_modules/.cache
        const summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
            revision: 'main',
            quantized: true, // Use quantized version for smaller size
        });
        
        console.log('✅ Model downloaded and cached successfully!');
        console.log('📁 Model cached in: node_modules/.cache/');
        
        // Test the model with a simple example
        console.log('🧪 Testing model with sample text...');
        const testText = 'This is a test conversation about setting up a chat application with automatic title generation using AI models.';
        const summary = await summarizer(testText, { 
            max_length: 20,
            min_length: 5,
        });
        
        console.log('📝 Test summary:', summary[0].summary_text);
        console.log('🎉 Model is ready for use!');
        
    } catch (error) {
        console.error('❌ Error downloading model:', error);
        process.exit(1);
    }
}

downloadModel().catch(console.error);

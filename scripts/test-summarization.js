#!/usr/bin/env node

// Test script to validate the summarization service in isolation

import { summarizationService } from '../electron/services/summarizationService.js';

async function testSummarizationService() {
    console.log('🧪 Testing Summarization Service...');
    
    // Test 1: Service status
    console.log('\n1. Testing service status...');
    const status = summarizationService.getStatus();
    console.log('   Status:', status);
    
    // Test 2: Simple text summarization
    console.log('\n2. Testing text summarization...');
    const testText = 'I want to create a new React application with TypeScript support and set up a proper development environment with hot reloading and testing capabilities.';
    const summary = await summarizationService.summarizeForTitle(testText);
    console.log('   Input:', testText);
    console.log('   Generated title:', summary);
    
    // Test 3: Chat history title generation
    console.log('\n3. Testing chat history title generation...');
    const testMessages = [
        { type: 'system', text: 'You are a helpful assistant.' },
        { type: 'user', text: 'Can you help me understand how machine learning algorithms work, specifically neural networks and their applications in natural language processing?' },
        { type: 'model', response: [{ type: 'text', text: 'Of course! I\'d be happy to explain neural networks...' }] }
    ];
    
    const chatTitle = await summarizationService.generateChatTitle(testMessages);
    console.log('   Chat messages:', testMessages.length);
    console.log('   Generated chat title:', chatTitle);
    
    // Test 4: Short message handling
    console.log('\n4. Testing short message handling...');
    const shortMessage = 'Hello';
    const shortTitle = await summarizationService.summarizeForTitle(shortMessage);
    console.log('   Input:', shortMessage);
    console.log('   Generated title:', shortTitle);
    
    console.log('\n✅ Summarization service test completed!');
}

testSummarizationService().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});

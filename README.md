<h1 align="center">Hammerhead</h1>

<p align="center">
  <img src="./public/logo.webp" alt="Hammerhead" width="300" />
</p>

Hammerhead is a web-based desktop application that allows developers to interact with a large language model (LLM) through a chat interface.

It supports multiple languages and provides a user-friendly experience for querying and receiving responses from the LLM.

Good for testing and experimenting with LLMs, Hammerhead is designed to be extensible, allowing developers to add custom components and features.

> **⚠️ Development Status**: Hammerhead is in active development and features may break or change between releases.

> **🚀 Perfect Base for Custom Apps**: This project serves as an excellent foundation for building custom chat applications with LLMs.

> **🤝 Contributions Welcome**: We welcome contributions, bug reports, and feedback! Feel free to open issues or submit pull requests.

## Features

- 🤖 **Multi-LLM Support**: Chat with various large language models locally
- 🌐 **Multi-language Interface**: Support for multiple languages
- 🔌 **Extensible Architecture**: Easy to add custom components and features
- 📚 **RAG Integration**: Retrieval-Augmented Generation with vector database support
- 🔗 **MCP Protocol**: Model Context Protocol server integration
- 💬 **User-friendly Chat Interface**: Intuitive design for seamless interactions
- 🖥️ **Cross-platform Desktop App**: Built with Electron for Windows, macOS, and Linux

## Prerequisites

Before getting started, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** (required for Chroma vector database)
- At least **8GB RAM** (recommended for running larger models)

## Get started

Install node modules and download the model files:

```bash
npm install
```

Start the project:

```bash
npm start
```

## Models

The application supports GGUF format models. Suggested models are available in the `./models` directory.

### Recommended Models

Download these models from Hugging Face:

- **hf:bartowski/Qwen_Qwen3-8B-GGUF:Q6_K** - Balanced performance and quality
- **hf:bartowski/deepseek-ai_DeepSeek-R1-0528-Qwen3-8B-GGUF:Q6_K_L** - Enhanced reasoning capabilities

### Adding Custom Models

1. Download GGUF format models from Hugging Face or other sources
2. Place them in the `./models` directory
3. Configure the model path in the application settings

## MCP (Model Context Protocol)

Recommended servers:

- [DuckDuckGo](https://hub.docker.com/mcp/server/duckduckgo/overview)

## RAG (Retrieval-Augmented Generation)

To enable RAG functionality, you need to set up a vector database and configure the application to use it. Follow these steps:

1. **Run the Chroma vector database**:
   - You can use the provided `npm run chroma` command to run the database locally.
   - Make sure you have Docker installed and running.

2. **Configure the ingestion of documents**:
   - Use the `npm run ingest` command to ingest documents into the vector database.
   - This command will read files from the `./data` directory and store them in the database.

The application will automatically connect to the Chroma vector database and use it for RAG functionality.

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure

- `electron/` - Electron main process and related services
- `src/` - React frontend application
- `models/` - LLM model files (GGUF format)
- `data/` - Document storage for RAG functionality

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:

- Open an issue on GitHub
- Check the [documentation](./docs/) for detailed guides
- Join our community discussions

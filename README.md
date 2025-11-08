# Welcome to A-Coder.

<div align="center">
	<img
		src="./a-coder-transparent-512.png"
	 	alt="A-Coder Logo"
		width="300"
	 	height="300"
	/>
</div>

A-Coder is an open-source AI-powered code editor, forked from Void.

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. A-Coder sends messages directly to providers without retaining your data.

This repo contains the full sourcecode for A-Coder. If you're new, welcome!

- 🧭 Original Void: [voideditor.com](https://voideditor.com)

- 📖 [Development Guide](./DEVELOPMENT_GUIDE.md)
- 🛠️ [Latest Models Tool Calling Analysis](./LATEST_MODELS_TOOL_CALLING_ANALYSIS.md)
- ⚠️ [Ollama Cloud Tool Calling Bug](./OLLAMA_CLOUD_TOOL_CALLING_BUG.md)


## Recent Fixes

### ✅ Ollama Cloud Tool Calling (FIXED)
**Issue:** Ollama Cloud models were returning `500 unmarshal` errors when using native tool calling.

**Root Cause:** Our tool schemas were missing `type` fields, causing llama.cpp's JSON schema parser to fail.

**Fix:** Updated `sendLLMMessage.impl.ts` to include `type: 'string'` in all tool parameter schemas.

**Status:** ✅ Fixed! All Ollama Cloud models now use native OpenAI-style tool calling.

**Details:** See [OLLAMA_CLOUD_TOOL_CALLING_BUG.md](./OLLAMA_CLOUD_TOOL_CALLING_BUG.md)


## Development

To get started developing A-Coder, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for complete instructions on:
- Running in development mode
- Building for production
- Creating DMG installers


## Reference

A-Coder is a fork of [Void](https://github.com/voideditor/void), which itself is a fork of [VS Code](https://github.com/microsoft/vscode). For a guide to the codebase, see [VOID_CODEBASE_GUIDE.md](./VOID_CODEBASE_GUIDE.md).

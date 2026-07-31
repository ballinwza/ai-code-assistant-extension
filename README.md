# 🤖 GitHub Code Assistant (VS Code Extension)

A powerful, AI-driven VS Code extension powered by **FastAPI**, **Google Gemini**, and **Pinecone RAG (Retrieval-Augmented Generation)**. It helps you explore, understand, review, and query your codebase directly from your editor sidebar.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VSCode](https://img.shields.io/badge/VS%20Code-^1.80.0-007ACC.svg)

---

## ✨ Features

- **💬 Interactive Sidebar Chat:** Chat with an AI assistant that understands your entire repository context in real time.
- **🔍 RAG-Powered Code Search:** Utilizes Pinecone vector embeddings to accurately retrieve relevant files, functions, and logic across your codebase.
- **📎 Smart Selection Context:** Automatically captures selected code snippets from your active editor without losing context when switching focus to the chat input.
- **💡 Context Menu Integration:** Right-click any highlighted code block and select `💬 Ask AI about selected code` to jump straight into conversation.
- **📝 Automated Code Review:** Request AI reviews for performance, security vulnerabilities, and code quality on demand.
- **🎨 Native VS Code Theme Integration:** Built using React & Tailwind CSS with dynamic VS Code CSS variables for seamless Dark/Light theme switching.
- ** Markdown & Syntax Highlighting:** Clear, beautifully formatted responses with syntax-highlighted code blocks.

---

## 🏗️ Architecture Overview

The extension operates as a modern client-server system:

```text
┌───────────────────────────────────────────────────────────┐
│                      VS Code Window                       │
│                                                           │
│  ┌──────────────────┐  ┌───────────────────────────────┐  │
│  │ Sidebar Chat     │  │ Main Code Editor              │  │
│  │ (React Webview)  │  │                               │  │
│  └────────┬─────────┘  └──────────────┬────────────────┘  │
│           │                           │                   │
│           └─────────────┬─────────────┘                   │
│                         ▼                                 │
│            VS Code Extension Host (Node)                  │
└─────────────────────────┬─────────────────────────────────┘
                          │ (HTTP / REST API)
                          ▼
            ┌───────────────────────────┐
            │ FastAPI Backend (Python)  │
            └─────────────┬─────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  Google Gemini API              Pinecone Vector DB
(LLM & Embeddings)             (RAG Context Index)
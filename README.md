# 💼 JobMatcher AI

AI-powered job matching platform that helps users discover career opportunities aligned with their skills, preferences, and resume — all powered by semantic search and vector embeddings.

---

## 🚀 Overview

JobMatcher AI enables users to:

- 📄 Upload their **resume (PDF/DOCX)**
- 🎯 Set preferences like **location**, **employment type**, **job title**, and **salary**
- 🤖 Receive **ranked job recommendations** based on AI embeddings and semantic similarity
- 🧠 View **match scores**, smart **tag suggestions**, and detailed job metadata
- 🧭 Navigate through results with **pagination** and intuitive filters

---

## 🧠 Tech Stack

### **Frontend (React)**

- React hooks and Fetch API
- Inline custom styling
- Resume upload, dynamic filters, and pagination

### **Backend (FastAPI - Python)**

- `embed_and_upload.py`: Resume processing + embedding
- `matching.py`: Semantic search + filtering logic
- Embedding via **OpenAI API**
- Vector search powered by **Pinecone** (or optionally **FAISS**)

---

## ⚙️ Setup & Run

### 🔧 Requirements

- Node.js + npm (for frontend)
- Python 3.8+ (for backend)
- OpenAI API Key
- Pinecone API Key and Index Name

---

### 📦 Backend Setup

```bash
# Install dependencies
pip install fastapi uvicorn openai numpy pandas pinecone-client python-dotenv

# Set environment variables (or create a .env file)
export OPENAI_API_KEY=your_openai_key
export PINECONE_API_KEY=your_pinecone_key
export PINECONE_INDEX_NAME=your_index_name

# Run FastAPI server
uvicorn api.matching:app --reload


### 📦 Frontend Setup

```bash
# Navigate to frontend directory
cd job-matching-frontend

# Install dependencies and start app
npm install
npm start
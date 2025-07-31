# 💼 JobMatcher AI

AI-powered job matching platform that helps users discover career opportunities aligned with their skills, preferences, and resume — all powered by semantic search and vector embeddings.

---

## 🚀 Overview

JobMatcher AI enables users to:

- 📄 Upload their **resume (PDF/DOCX)**.
- 🎯 Set preferences like **location**, **employment type**, **job title**, and **salary**.
- 🤖 Receive **ranked job recommendations** based on AI embeddings and semantic similarity.
- 🧠 See **match scores**, smart **tag suggestions**, and job metadata.
- 🧭 Navigate through results with **pagination** and intuitive filters.

---

## 🧠 Tech Stack

**Frontend (React):**

- React hooks and fetch API
- Inline custom styling
- Resume upload, dynamic filters, pagination

**Backend (FastAPI - Python):**

- `embed_and_upload.py`: Resume processing + embedding
- `matching.py`: Semantic search + filtering logic
- Embedding via **OpenAI API**
- Vector DB (e.g., **Pinecone**, **FAISS**) for nearest neighbor search

---

## 📁 Project Structure


# Job Matching Backend (Pinecone + OpenAI)

## Setup Instructions

1. Create and activate virtual environment:

    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate

2. Install dependencies:

    pip install -r requirements.txt

3. Rename `.env.example` to `.env` and add your API keys.

4. Run the embedding script:

    python utils/embed_and_upload.py

5. Start the API:

    uvicorn api.matching:app --reload
# job-matcher

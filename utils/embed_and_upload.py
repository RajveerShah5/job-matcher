import os
import json
import openai
import pinecone
from dotenv import load_dotenv
from tqdm import tqdm
from uuid import uuid4

# Load API keys from .env
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
pinecone.init(api_key=os.getenv("PINECONE_API_KEY"), environment=os.getenv("PINECONE_ENVIRONMENT"))

index_name = os.getenv("PINECONE_INDEX_NAME")
index = pinecone.Index(index_name)

def embed_text(text: str) -> list:
    """Generate OpenAI embedding for given text."""
    response = openai.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def generate_jobs(n=10000):
    """Generate synthetic job data for testing."""
    jobs = []
    for i in range(n):
        job = {
            "id": str(uuid4()),
            "title": f"Software Engineer {i}",
            "description": f"Build scalable systems using Python, React, and AWS. Opportunity #{i}.",
            "location": "Remote" if i % 2 == 0 else "San Francisco",
            "salary": 80000 + (i % 20) * 2500,
            "level": "Junior" if i % 2 == 0 else "Senior",
            "apply_url": f"https://example.com/jobs/{i}"
        }
        jobs.append(job)
    return jobs

def main():
    jobs = generate_jobs()
    batch_size = 100

    print(f"Uploading {len(jobs)} jobs to Pinecone in batches of {batch_size}...")
    
    for i in tqdm(range(0, len(jobs), batch_size)):
        batch = jobs[i:i+batch_size]
        ids = [job["id"] for job in batch]
        texts = [f"{job['title']}. {job['description']}" for job in batch]
        embeddings = [embed_text(text) for text in texts]
        metadata = [
            {
                "title": job["title"],
                "description": job["description"],
                "location": job["location"],
                "salary": job["salary"],
                "level": job["level"],
                "apply_url": job["apply_url"]
            }
            for job in batch
        ]

        # Upsert into Pinecone
        index.upsert(vectors=[
            (ids[j], embeddings[j], metadata[j]) for j in range(len(batch))
        ])

    print("✅ Upload complete.")

if __name__ == "__main__":
    main()

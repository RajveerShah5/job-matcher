import os
import random
from time import sleep
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

# Create index if it doesn't exist
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region=os.getenv("PINECONE_ENVIRONMENT")
        )
    )

# Wait for index to be ready
while pc.describe_index(index_name).status['ready'] is not True:
    print("Waiting for index to be ready...")
    sleep(1)

index = pc.Index(index_name)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# === FAKE JOB DATA GENERATION ===
def generate_fake_jobs(n=10000):
    titles = ["Software Engineer", "Data Scientist", "Product Manager", "UX Designer", "DevOps Engineer"]
    levels = ["Junior", "Mid", "Senior", "Lead"]
    locations = ["New York", "San Francisco", "Remote", "Austin", "London"]
    salaries = [60000, 80000, 100000, 120000, 150000]

    jobs = []
    for i in range(n):
        title = f"{random.choice(levels)} {random.choice(titles)}"
        location = random.choice(locations)
        salary = random.choice(salaries)
        description = f"{title} role based in {location}. Salary around ${salary}. Looking for someone with experience in Python, APIs, and ML."

        jobs.append({
            "id": f"job-{i}",
            "text": description,
            "metadata": {
                "title": title,
                "location": location,
                "salary": salary
            }
        })

    return jobs

# === EMBEDDING AND UPSERT ===
def embed_jobs(jobs, batch_size=100):
    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]
        texts = [job["text"] for job in batch]

        # Call OpenAI embedding API
        response = openai_client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )

        vectors = []
        for j, embedding in enumerate(response.data):
            vectors.append({
                "id": batch[j]["id"],
                "values": embedding.embedding,
                "metadata": batch[j]["metadata"]
            })

        # Upload to Pinecone
        index.upsert(vectors=vectors)
        print(f"Uploaded batch {i // batch_size + 1}")

# Run everything
if __name__ == "__main__":
    print("Generating jobs...")
    jobs = generate_fake_jobs(10000)
    print("Embedding and uploading...")
    embed_jobs(jobs)
    print("Done.")

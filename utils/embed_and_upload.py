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
    import random

    titles = [
        "Software Engineer", "Data Scientist", "Product Manager", "UX Designer", "DevOps Engineer",
        "Frontend Developer", "Backend Developer", "AI Researcher", "Cloud Architect", "Cybersecurity Analyst",
        "Marketing Manager", "Sales Executive", "Operations Analyst", "Graphic Designer", "Financial Analyst",
        "HR Specialist", "Technical Writer", "Support Engineer", "Recruiter", "Business Analyst"
    ]

    levels = ["Intern", "Junior", "Mid", "Senior", "Lead", "Principal", "Director", "VP"]

    us_states = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
        "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
        "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana",
        "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
        "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
        "Wisconsin", "Wyoming"
    ]

    location_types = ["Remote", "In-person", "Hybrid"]

    employment_types = [
        "Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship"
    ]

    sectors = [
        "Computer Software", "Information Technology & Services", "Government Relations", "Financial Services",
        "Defense & Space", "Hospital & Health Care", "Staffing & Recruiting", "Management Consulting",
        "Computer & Network Security", "Marketing & Advertising", "Education", "Real Estate", "Automotive",
        "Manufacturing", "Retail", "Entertainment"
    ]

    salaries = list(range(30000, 200001, 5000))  # $30k to $200k in $5k increments

    jobs = []
    for i in range(n):
        level = random.choice(levels)
        title = random.choice(titles)
        full_title = f"{level} {title}"
        state = random.choice(us_states)
        location_type = random.choice(location_types)
        employment_type = random.choice(employment_types)
        sector = random.choice(sectors)
        salary = random.choice(salaries)
        location = state if location_type != "Remote" else "Remote"

        description = (
            f"{full_title} opening in {location}. This is a {location_type} {employment_type} role "
            f"in the {sector} sector. Expected salary: ${salary}."
        )

        jobs.append({
            "id": f"job-{i}",
            "text": description,
            "metadata": {
                "title": full_title,
                "location": location,
                "salary": salary,
                "us_state": state,
                "location_type": location_type,
                "employment_type": employment_type,
                "sector": sector
            }
        })

    return jobs


# === EMBEDDING AND UPSERT ===
def embed_jobs(jobs, batch_size=100):
    # 🚨 Clear existing data before uploading
    print("Clearing existing index data...")
    index.delete(delete_all=True)
    print("Old job data cleared.\n")

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

if __name__ == "__main__":
    print("Generating jobs...")
    jobs = generate_fake_jobs(10000)
    print(f"Number of jobs generated: {len(jobs)}")
    print("Embedding and uploading...")
    embed_jobs(jobs)
    print("Done.")

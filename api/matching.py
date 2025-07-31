import os
import io
import pdfplumber
import docx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pinecone import Pinecone
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Load OpenAI key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("Missing OPENAI_API_KEY in environment")
openai_client = OpenAI(api_key=openai_api_key)

# Load Pinecone API credentials
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_index_name = os.getenv("PINECONE_INDEX_NAME")
if not pinecone_api_key or not pinecone_index_name:
    raise RuntimeError("Missing Pinecone configuration in environment")

pc = Pinecone(api_key=pinecone_api_key)
index = pc.Index(pinecone_index_name)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter: dict = {}

class MatchResult(BaseModel):
    id: str
    score: float
    title: str
    location: str
    salary: int
    us_state: Optional[str] = ""
    location_type: Optional[str] = ""
    employment_type: Optional[str] = ""
    tags: Optional[List[str]] = []

class PaginatedMatchResults(BaseModel):
    total: int
    results: List[MatchResult]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join([page.extract_text() or "" for page in pdf.pages])

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def normalize_filter(f: dict) -> dict:
    fixed: dict = {}
    for k, v in f.items():
        fixed[k] = v if isinstance(v, dict) else {"$eq": v}
    return fixed

def detect_resume_seniority(text: str) -> str:
    lowered = text.lower()
    junior_terms = ["student", "intern", "undergrad", "bachelor", "sophomore", "junior"]
    if any(term in lowered for term in junior_terms):
        return "junior"
    return "senior"

def get_tags_from_title(title: str) -> List[str]:
    title_lower = title.lower()
    tags_map = {
        "software engineer": ["React", "Node.js", "JavaScript", "Python", "AWS"],
        "data scientist": ["Python", "Machine Learning", "SQL", "TensorFlow", "Pandas"],
        "product manager": ["Strategy", "Analytics", "Agile", "Roadmapping", "Stakeholder Management"],
        "ux designer": ["Figma", "Design Systems", "User Research", "Prototyping", "Wireframing"],
        "devops engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Infrastructure"],
    }
    for key, tags in tags_map.items():
        if key in title_lower:
            return tags[:3]
    return ["Technology", "Innovation", "Growth"]

@app.post("/match", response_model=PaginatedMatchResults)
def match_jobs(
    req: MatchRequest,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
) -> PaginatedMatchResults:

    # Embed the query
    response = openai_client.embeddings.create(
        input=req.query,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    # Query Pinecone
    search_result = index.query(
        vector=query_vector,
        top_k=req.top_k,
        include_metadata=True,
        filter=normalize_filter(req.filter) if req.filter else None,
    )

    all_results = [
        MatchResult(
            id=match.id,
            score=match.score,
            title=match.metadata.get("title", ""),
            location=match.metadata.get("location", ""),
            salary=match.metadata.get("salary", 0),
            us_state=match.metadata.get("us_state", ""),
            location_type=match.metadata.get("location_type", ""),
            employment_type=match.metadata.get("employment_type", ""),
            tags=match.metadata.get(
                "tags",
                get_tags_from_title(match.metadata.get("title", ""))
            )
        )
        for match in search_result.matches
    ]

    total = len(all_results)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = all_results[start:end]

    return PaginatedMatchResults(total=total, results=paginated)

@app.post("/upload-match", response_model=PaginatedMatchResults)
async def match_jobs_with_file(
    resume: Optional[UploadFile] = File(None),
    query: Optional[str] = Form(""),
    salary: int = Form(...),
    location_type: Optional[str] = Form(None),
    employment_type: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    us_state: Optional[str] = Form(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
) -> PaginatedMatchResults:
    # Read resume or fallback to query text
    if resume:
        file_bytes = await resume.read()
        if resume.filename.lower().endswith(".pdf"):
            query_text = extract_text_from_pdf(file_bytes)
        elif resume.filename.lower().endswith(".docx"):
            query_text = extract_text_from_docx(file_bytes)
        else:
            return PaginatedMatchResults(total=0, results=[])
    else:
        query_text = query

    if not query_text.strip():
        return PaginatedMatchResults(total=0, results=[])

    resume_seniority = detect_resume_seniority(query_text)
    enrichment = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": (
                "Given a resume or job description, extract important keywords and rewrite it to "
                "highlight relevant skills, job titles, and tools for semantic search."
            )},
            {"role": "user", "content": query_text}
        ]
    )
    enriched_text = enrichment.choices[0].message.content

    response = openai_client.embeddings.create(
        input=enriched_text,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    # Build backend filter only with parameters that are relevant
    filter_: dict = {"salary": {"$gte": salary}}
    if location_type:
        filter_["location_type"] = {"$eq": location_type}
    if employment_type:
        filter_["employment_type"] = {"$eq": employment_type}
    if title:
        filter_["title"] = {"$eq": title}
    if us_state:
        filter_["us_state"] = {"$eq": us_state.title()}

    search_result = index.query(
        vector=query_vector,
        top_k=100,
        include_metadata=True,
        filter=filter_
    )

    if not search_result.matches:
        return PaginatedMatchResults(total=0, results=[])

    senior_keywords = ["senior", "lead", "principal", "director", "vp", "head"]
    junior_keywords = ["intern", "junior", "entry", "trainee", "graduate"]
    results: List[tuple] = []

    for match in search_result.matches:
        metadata = match.metadata
        title_lower = metadata.get("title", "").lower()
        if resume_seniority == "junior" and any(k in title_lower for k in senior_keywords):
            adjusted_score = match.score - 0.2
        elif resume_seniority == "junior" and any(k in title_lower for k in junior_keywords):
            adjusted_score = match.score + 0.1
        else:
            adjusted_score = match.score
        results.append((
            adjusted_score,
            MatchResult(
                id=match.id,
                score=adjusted_score,
                title=metadata.get("title", ""),
                location=metadata.get("location", ""),
                salary=metadata.get("salary", 0),
                us_state=metadata.get("us_state", ""),
                location_type=metadata.get("location_type", ""),
                employment_type=metadata.get("employment_type", ""),
                tags=metadata.get(
                    "tags",
                    get_tags_from_title(metadata.get("title", ""))
                )
            )
        ))

    results.sort(key=lambda x: x[0], reverse=True)
    all_results = [r for _, r in results]
    total = len(all_results)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = all_results[start:end]

    return PaginatedMatchResults(total=total, results=paginated)

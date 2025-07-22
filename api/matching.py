from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Job matcher is running!"}

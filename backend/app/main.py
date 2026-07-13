from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import build, challenges, rag

app = FastAPI(title="EngineerVerse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(challenges.router, prefix="/api")
app.include_router(build.router, prefix="/api")
app.include_router(rag.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}

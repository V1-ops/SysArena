from fastapi import FastAPI

app = FastAPI(title="EngineerVerse API")


@app.get("/health")
def health():
    return {"status": "ok"}

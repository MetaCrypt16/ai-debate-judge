import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

# 1. Load Environment Variables safely
# (Ensures .env is found even if running from a different folder)
current_dir = Path(__file__).resolve().parent
load_dotenv(current_dir / ".env")

# Import Routes
# Try/Except block helps catch import errors early
try:
    from app.routes.judge import router as judge_router
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("   (Make sure you are running this from the 'backend' directory)")
    raise e

# 2. Create FastAPI App
app = FastAPI(
    title="AI Debate Judge API",
    description="RAG-based debate judgment system using Gemini + Pinecone",
    version="1.0.0"
)

# 3. Enable CORS
# This is crucial for your Frontend to talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include Routes
app.include_router(judge_router, prefix="/api", tags=["judge"])

# 5. Health Check
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "AI Debate Judge API",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "AI Debate Judge API is running",
        "docs_url": "http://localhost:8000/docs"
    }

if __name__ == "__main__":
    # Helper to parse boolean from string env var
    debug_mode = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=debug_mode
    )
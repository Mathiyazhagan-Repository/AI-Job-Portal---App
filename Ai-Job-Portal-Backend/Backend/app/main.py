from __future__ import annotations
# hi
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .resume_parser import router as resume_router
from .looking_for import router as looking_for_router
from .auth import router as auth_router
from .jobs import router as jobs_router
from .interviews import router as interviews_router
from .profile import router as profile_router
from .applications import router as applications_router
from .recruiter import router as recruiter_router
from .team import router as team_router
from .companies import router as companies_router
from .notifications import router as notifications_router
from .analytics import router as analytics_router
from .admin import router as admin_router

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

APP_NAME = os.getenv("APP_NAME", "AI Job Portal API")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    debug=DEBUG,
    description="Backend API for the AI Job Portal",
)

app.include_router(resume_router)
app.include_router(looking_for_router)
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(interviews_router)
app.include_router(profile_router)
app.include_router(applications_router)
app.include_router(recruiter_router)
app.include_router(team_router)
app.include_router(companies_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, Any]:
    return {
        "app": APP_NAME,
        "version": APP_VERSION,
        "status": "running",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@app.get("/health")
def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": APP_NAME,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)

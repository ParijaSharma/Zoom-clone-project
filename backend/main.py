from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.meetings import router as meetings_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Zoom Clone API"
)


# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# Meeting routes
app.include_router(meetings_router)


@app.get("/")
def root():

    return {
        "message": "Zoom Clone API running"
    }


@app.get("/api/health")
def health():

    return {
        "status": "ok"
    }
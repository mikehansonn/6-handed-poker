from typing import Dict
from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from game import TexasHoldem
from api import game
import logging

# Run application with
# uvicorn main:app --reload
# runs on http://localhost:8000

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000", 
    "https://aicehigh.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging stuff
# Use the following in api calls for more info
# logger.info(f"Creating new game with ID: {game_id}")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# How to include API routes from other files 
app.include_router(game.router, tags=["games"])
# app.include_router(user.router, tags=["users"])

@app.get("/")
async def root():
    return {"message": "Active"}

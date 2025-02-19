from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import uuid4
import logging
from game import TexasHoldem #Action, GameStage
from bots import LooseLaurenBot

logger = logging.getLogger(__name__)
router = APIRouter()

# dictionary of gameIDs to game objects
active_games = {}

# example base model
class CreateGameRequest(BaseModel):
    player_names: List[str]
    bot_ids: List[Optional[str]] = [None, "Bot1", "Bot2", "Bot3", "Bot4", "Bot5"]


@router.post("/games/create")
async def create_game(request: CreateGameRequest):
    game_id = str(uuid4())
    logger.info(f"Creating new game with ID: {game_id}")
    
    # Configure player names
    player_names = request.player_names

    bot_factory = {
        "looselauren": LooseLaurenBot,
        "tighttimmy": LooseLaurenBot,   # Replace with TightTimmyBot() if available
        "aggroamy": LooseLaurenBot,
        "calmcarl": LooseLaurenBot,
    }
    
    # Create bot controllers
    controllers = []
    for bot_id in request.bot_ids:
        if bot_id is None:
            controllers.append(None)
        else:
            controllers.append(bot_factory[bot_id]())
    
    try:
        # Create new game instance
        game = TexasHoldem(
            player_names=player_names,
            player_controllers=controllers
        )
        
        active_games[game_id] = game

        # Initialize the game hand to set attributes like min_raise
        # game.start_new_hand()
        
        return {
            "game_id": game_id,
            "state": game.get_create_game_json()
        }
    except Exception as e:
        logger.error(f"Failed to create game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create game")
    

@router.delete("/games/delete/{game_id}")
async def end_game(game_id: str):
    logger.info(f"Ending game: {game_id}")

    if game_id in active_games:
        del active_games[game_id]

    return {"status": "success"}
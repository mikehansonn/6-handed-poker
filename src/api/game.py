from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import uuid4
import logging
from game import TexasHoldem, Action, GameStage
from bots import LooseLaurenBot

logger = logging.getLogger(__name__)

router = APIRouter()

# dictionary of gameIDs to game objects
active_games = {}

# example base model
class CreateGameRequest(BaseModel):
    human_name: str
    bot_names: List[str] = ["Bot1", "Bot2", "Bot3", "Bot4", "Bot5"]


@router.post("/games/create")
async def create_game(request: CreateGameRequest):
    game_id = str(uuid4())
    logger.info(f"Creating new game with ID: {game_id}")
    
    # Configure player names
    player_names = [request.bot_names[0], request.human_name] + request.bot_names[1:]
    
    # Create bot controllers
    controllers = [
        LooseLaurenBot(),  # Bot 1
        None,              # Human player
        LooseLaurenBot(),  # Bot 2
        LooseLaurenBot(),  # Bot 3
        LooseLaurenBot(),  # Bot 4
        LooseLaurenBot()   # Bot 5
    ]
    
    try:
        # Create new game instance
        game = TexasHoldem(
            player_names=player_names,
            player_controllers=controllers
        )
        
        active_games[game_id] = game
        
        # maybe keep this? idk
        # might just be better to allow the front end to call for new hands to start
        game.start_new_hand()
        logger.info(f"Game {game_id} successfully created")
        
        return {
            "game_id": game_id,
            "state": game.get_game_state_json()
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
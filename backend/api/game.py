from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import uuid4
import logging
from game import TexasHoldem, Action, GameStage
from bots import LooseLaurenBot
from enum import Enum

logger = logging.getLogger(__name__)
router = APIRouter()

# dictionary of gameIDs to game objects
active_games = {}

# example base model
class CreateGameRequest(BaseModel):
    player_names: List[str]
    bot_ids: List[Optional[str]] = [None, "Bot1", "Bot2", "Bot3", "Bot4", "Bot5"]

class GameAction(str, Enum):
    START_HAND = "start_hand"
    PLAYER_ACTION = "player_action"

class PlayerActionRequest(BaseModel):
    action: str
    amount: Optional[int] = None

class GameProgressRequest(BaseModel):
    game_id: str
    action_type: GameAction
    player_action: Optional[PlayerActionRequest] = None

@router.post("/games/progress")
async def progress_game(request: GameProgressRequest):
    """
    Progress the game state based on the action type:
    - START_HAND: Begins a new hand
    - PLAYER_ACTION: Processes a player's action during their turn
    """
    game_id = request.game_id
    
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
        
    game = active_games[game_id]
    
    try:
        if request.action_type == GameAction.START_HAND:
            # start a new hand
            game.start_new_hand()
            
            game.current_stage = GameStage.PREFLOP
            
            return {
                "status": "success",
                "game_state": game.get_game_state_json()
            }
            
        elif request.action_type == GameAction.PLAYER_ACTION:
            # handle player action
            if not request.player_action:
                raise HTTPException(status_code=400, detail="Player action required")
                
            current_player = game.players[game.current_player_idx]
            
            try:
                action = Action(request.player_action.action)
                amount = request.player_action.amount
                
                if action not in game.get_available_actions():
                    raise HTTPException(status_code=400, detail="Invalid action")
                
                # Process the action and check if betting round is complete
                betting_complete = game.process_action(action, amount)
                
                # If betting round is complete, advance to next stage if possible
                if betting_complete:
                    if len(game.get_non_folded_players()) == 1:
                        # Hand is over - one player remains
                        return {
                            "status": "hand_complete",
                            "game_state": game.get_game_state_json()
                        }
                    
                    # Advance the game stage if needed
                    if game.current_stage == GameStage.PREFLOP:
                        game.deal_flop()
                        game.reset_street_bets()
                    elif game.current_stage == GameStage.FLOP:
                        game.deal_turn()
                        game.reset_street_bets()
                    elif game.current_stage == GameStage.TURN:
                        game.deal_river()
                        game.reset_street_bets()
                    elif game.current_stage == GameStage.RIVER:
                        # Hand is complete - go to showdown
                        return {
                            "status": "hand_complete",
                            "game_state": game.get_game_state_json()
                        }
                
                return {
                    "status": "success",
                    "game_state": game.get_game_state_json()
                }
                
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
                
    except Exception as e:
        logger.error(f"Error progressing game: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to progress game")


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
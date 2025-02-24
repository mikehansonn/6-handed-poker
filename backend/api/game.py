from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import uuid4
import logging
from game import TexasHoldem, Action, GameStage, HandEvaluator
from bots import LooseLaurenBot, OptimizedPokerBot
from enum import Enum

logger = logging.getLogger(__name__)
router = APIRouter()

# dictionary of gameIDs to game objects
active_games = {}

# example base model
class CreateGameRequest(BaseModel):
    player_names: List[str]
    bot_ids: List[Optional[str]] = [None, "Bot1", "Bot2", "Bot3", "Bot4", "Bot5"]


class PlayerActionRequest(BaseModel):
    game_id: str
    action: str
    amount: Optional[int] = None

class StartHandRequest(BaseModel):
    game_id: str

@router.post("/games/start-hand")
async def start_hand(request: StartHandRequest):
    """
    Start a new hand for the specified game
    """
    game_id = request.game_id
    
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
        
    game = active_games[game_id]
    
    try:
        game.start_new_hand()
        
        return {
            "status": "success",
            "game_state": game.get_game_state_json()
        }
        
    except Exception as e:
        logger.error(f"Error starting hand: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start hand")

@router.post("/games/player-action")
async def process_player_action(request: PlayerActionRequest):
    game_id = request.game_id
    
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
        
    game = active_games[game_id]
    
    try:
        # Validate action
        action = Action(request.action)
        if action not in game.get_available_actions():
            raise HTTPException(status_code=400, detail="Invalid action")
            
        # Process the action
        betting_complete = game.process_action(action, request.amount)
        
        # Check if hand is over
        non_folded_players = game.get_non_folded_players()
        if len(non_folded_players) == 1:
            # Single player remaining - award pots
            winner = non_folded_players[0]
            for pot in game.pots:
                winner.chips += pot.amount
                pot.amount = 0
            return {
                "status": "hand_complete",
                "game_state": game.get_game_state_json()
            }
            
        # If betting round is complete, advance game stage
        if betting_complete:
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
                # Showdown required - evaluate hands and distribute pots
                active_players = game.get_non_folded_players()
                
                for pot in game.pots:
                    eligible_players = [p if game.players.index(p) in pot.eligible_players else None 
                                     for p in game.players]
                    winner_shares, _ = HandEvaluator.determine_winners(eligible_players, game.community_cards)
                    
                    for player_idx, share in winner_shares.items():
                        winner = game.players[player_idx]
                        amount = int(pot.amount * share)
                        winner.chips += amount
                    pot.amount = 0
                    
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
        logger.error(f"Error processing player action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process player action")

@router.post("/games/bot-action")
async def process_bot_action(request: StartHandRequest):
    game_id = request.game_id
    
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
        
    game = active_games[game_id]
    
    try:
        # Verify current player is a bot
        current_player_idx = game.current_player_idx
        bot_controller = game.player_controllers[current_player_idx]
        
        if bot_controller is None:
            raise HTTPException(
                status_code=400, 
                detail="Current player is not a bot"
            )
            
        # Get bot's decision
        game_state = game.get_game_state_json()
        decision = bot_controller.get_decision(game_state)
        # Parse and validate bot action
        action_str = decision.get("action", "fold")
        amount = decision.get("amount", 0)
        
        try:
            action = Action(action_str)
        except ValueError:
            action = Action.FOLD
            amount = 0
            
        if action not in game.get_available_actions():
            action = Action.FOLD
            amount = 0
            
        # Process the action
        betting_complete = game.process_action(action, amount)
        
        # Check if hand is over
        non_folded_players = game.get_non_folded_players()
        if len(non_folded_players) == 1:
            # Single player remaining - award pots
            winner = non_folded_players[0]
            for pot in game.pots:
                winner.chips += pot.amount
                pot.amount = 0
            return {
                "status": "hand_complete",
                "game_state": game.get_game_state_json()
            }
            
        # If betting round is complete, advance game stage
        if betting_complete:
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
                # Showdown required - evaluate hands and distribute pots
                active_players = game.get_non_folded_players()
                
                for pot in game.pots:
                    eligible_players = [p if game.players.index(p) in pot.eligible_players else None 
                                     for p in game.players]
                    winner_shares, _ = HandEvaluator.determine_winners(eligible_players, game.community_cards)
                    
                    for player_idx, share in winner_shares.items():
                        winner = game.players[player_idx]
                        amount = int(pot.amount * share)
                        winner.chips += amount
                    pot.amount = 0
                    
                return {
                    "status": "hand_complete",
                    "game_state": game.get_game_state_json()
                }
                
        return {
            "status": "success",
            "game_state": game.get_game_state_json()
        }
        
    except Exception as e:
        logger.error(f"Error processing bot action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process bot action")


@router.post("/games/create")
async def create_game(request: CreateGameRequest):
    game_id = str(uuid4())
    logger.info(f"Creating new game with ID: {game_id}")
    
    # Configure player names
    player_names = request.player_names

    bot_factory = {
        "looselauren": lambda: OptimizedPokerBot(personality="loose"),
        "tighttimmy": lambda: OptimizedPokerBot(personality="tight"),
        "aggroamy": lambda: OptimizedPokerBot(personality="aggressive"),
        "calmcarl": lambda: OptimizedPokerBot(personality="conservative")
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
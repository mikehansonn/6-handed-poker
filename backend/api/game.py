from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import uuid4
import logging
from game import TexasHoldem, Action, GameStage, HandEvaluator
from bots import OptimizedPokerBot, AIPokerCoach
from enum import Enum
import time

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

class CoachQuestionRequest(BaseModel):
    game_id: str
    question: str

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
                game.current_stage = GameStage.SHOWDOWN
                active_players = game.get_non_folded_players()
                
                for pot in game.pots:
                    eligible_players = [p if game.players.index(p) in pot.eligible_players else None 
                                     for p in game.players]
                    winner_shares, _ = HandEvaluator.determine_winners(eligible_players, game.community_cards)
                    print(winner_shares)
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

    time.sleep(2) 
    
    try:
        print("1")
        # Verify current player is a bot
        current_player_idx = game.current_player_idx
        bot_controller = game.player_controllers[current_player_idx]
        
        if bot_controller is None:
            raise HTTPException(
                status_code=400, 
                detail="Current player is not a bot"
            )
        
        print("2")
        # Get bot's decision
        game_state = game.get_bot_state_json()
        decision = bot_controller.get_decision(game_state, game.get_min_raise())
    
        print("3")
        # Parse and validate bot action
        action_str = decision.get("action", "fold")
        amount = decision.get("amount", 0)
        table_comment = decision.get("table_comment", "")
        
        print("4")
        try:
            action = Action(action_str)
        except ValueError:
            action = Action.FOLD
            amount = 0
            
        print("5")
        if action not in game.get_available_actions():
            action = Action.FOLD
            amount = 0
            
        print("6")
        # Process the action
        betting_complete = game.process_action(action, amount)
        
        print("7")
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

        print("8") 
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
                print("9")
                active_players = game.get_non_folded_players()
                
                print("10")
                for pot in game.pots:
                    print("11")
                    eligible_players = [p if game.players.index(p) in pot.eligible_players else None 
                                     for p in game.players]
                    winner_shares, _ = HandEvaluator.determine_winners(eligible_players, game.community_cards)
                    print(winner_shares)
                    for player_idx, share in winner_shares.items():
                        winner = game.players[player_idx]
                        amount = int(pot.amount * share)
                        winner.chips += amount
                    pot.amount = 0
                    print("12")
                    
                return {
                    "status": "hand_complete",
                    "game_state": game.get_game_state_json()
                }
                
        return {
            "status": "success",
            "game_state": game.get_game_state_json(),
            "table_comment": table_comment,
            "comment_index": current_player_idx
        }
        
    except Exception as e:
        logger.error(f"Error processing bot action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process bot action")
    


# ========== NEW COACH RECOMMENDATION ENDPOINT ==========
@router.post("/games/coach-recommendation")
async def get_coach_recommendation(request: StartHandRequest):
    """
    Uses AIPokerCoach to provide text-based advice for the current game state
    """
    game_id = request.game_id

    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")

    game = active_games[game_id]

    try:
        # Use the full game state for coaching
        game_state = game.get_game_state_json()

        coach = AIPokerCoach()
        advice_text = coach.get_advice(game_state)

        return {"advice": advice_text}

    except Exception as e:
        logger.error(f"Error in coach recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve coach recommendation")


# ========== NEW COACH RECOMMENDATION ENDPOINT ==========
@router.post("/games/coach-question")
async def coach_answer_question(request: CoachQuestionRequest):
    """
    Uses AIPokerCoach to provide text-based advice for the current game state
    """
    game_id = request.game_id

    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")

    game = active_games[game_id]

    try:
        # Use the full game state for coaching
        game_state = game.get_game_state_json()

        coach = AIPokerCoach()
        advice_text = coach.ask_coach(request.question, game_state)

        return {"advice": advice_text}

    except Exception as e:
        logger.error(f"Error in coach recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve coach recommendation")


@router.post("/games/create")
async def create_game(request: CreateGameRequest):
    game_id = str(uuid4())
    logger.info(f"Creating new game with ID: {game_id}")
    
    # Configure player names
    player_names = request.player_names

    bot_factory = {
        "looselauren": lambda: OptimizedPokerBot(personality="loose"),
        "tighttimmy": lambda: OptimizedPokerBot(personality="tight"),
        "balancedbenny": lambda: OptimizedPokerBot(personality="balanced"),
        "hyperhenry": lambda: OptimizedPokerBot(personality="hyper_aggressive"),
        "passivepete": lambda: OptimizedPokerBot(personality="passive"),
        "trickytravis": lambda: OptimizedPokerBot(personality="trap_player"),
        "mathmindy": lambda: OptimizedPokerBot(personality="math_based"),
        "exploitingeve": lambda: OptimizedPokerBot(personality="exploitative"),
        "wildcardwally": lambda: OptimizedPokerBot(personality="wildcard"),
        "maniacmitch": lambda: OptimizedPokerBot(personality="maniac"), 
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
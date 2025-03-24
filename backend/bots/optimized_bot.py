import os
import json
import random
from dotenv import load_dotenv
from openai import OpenAI

class OptimizedPokerBot:
    def __init__(self, personality="loose"):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.personality = personality
        
        # Personality traits (unchanged)
        self.traits = {
            "loose": {
                "style": "aggressive",
                "range": "wide",
                "bluff_frequency": "high",
                "adaptability": "moderate"
            },
            "tight": {
                "style": "conservative",
                "range": "narrow",
                "bluff_frequency": "low",
                "adaptability": "high"
            },
            "balanced": {
                "style": "adaptive",
                "range": "moderate",
                "bluff_frequency": "medium",
                "adaptability": "high"
            },
            "hyper_aggressive": {
                "style": "reckless",
                "range": "very wide",
                "bluff_frequency": "very high",
                "adaptability": "low"
            },
            "passive": {
                "style": "cautious",
                "range": "moderate",
                "bluff_frequency": "very low",
                "adaptability": "medium"
            },
            "trap_player": {
                "style": "deceptive",
                "range": "narrow",
                "bluff_frequency": "low",
                "adaptability": "moderate"
            },
            "math_based": {
                "style": "calculative",
                "range": "GTO optimal",
                "bluff_frequency": "situational",
                "adaptability": "high"
            },
            "exploitative": {
                "style": "opportunistic",
                "range": "dynamic",
                "bluff_frequency": "adaptive",
                "adaptability": "high"
            },
            "wildcard": {
                "style": "unpredictable",
                "range": "randomized",
                "bluff_frequency": "random",
                "adaptability": "low"
            },
            "maniac": {
                "style": "fearless",
                "range": "ultra-wide",
                "bluff_frequency": "extreme",
                "adaptability": "low"
            }
        }

        # Preflop charts (unchanged)
        self.preflop_charts = {
            "loose": {
                "raise": "AA-22,AKs-A2s,KQs-K2s,QJs-Q2s,JTs+,AKo-ATo,KQo",
                "call": "A9o-A2o,KJo-K2o,QJo-Q2o,JTo-J2o",
                "fold": "Remaining hands"
            },
            "tight": {
                "raise": "AA-TT,AKs-ATs,KQs-KJs,QJs,AKo-AQo",
                "call": "99-22,A9s-A2s,KTs-K2s,QTs-Q2s",
                "fold": "Remaining hands"
            },
            "balanced": {
                "raise": "AA-66,AKs-A9s,KQs-KTs,QJs-QTs,JTs+,AKo-ATo,KQo,KJo",
                "call": "55-22,A8s-A2s,K9s-K2s,Q9s-Q2s,J9s-J2s,T9s-T2s",
                "fold": "Remaining hands"
            },
            "hyper_aggressive": {
                "raise": "AA-22,AKs-A2s,KQs-K2s,QJs-Q2s,JTs-J2s,T9s-T2s,98s-92s,87s-82s,76s-72s,65s-62s,54s-52s,43s-42s,32s,AKo-32o",
                "call": "None",
                "fold": "None"
            },
            "passive": {
                "raise": "AA-JJ,AKs,AKo",
                "call": "TT-22,AQs-A2s,KQs-KTs,QJs-QTs,JTs,J9s,T9s,98s,87s",
                "fold": "Remaining hands"
            },
            "trap_player": {
                "raise": "AA-KK,AKs,AKo",
                "call": "QQ-99,AQs-AJs,KQs-KJs,QJs-QTs,JTs",
                "fold": "Remaining hands"
            },
            "math_based": {
                "raise": "AA-66,AKs-A9s,KQs-KTs,QJs-QTs,JTs+,AKo-ATo,KQo,KJo",
                "call": "55-22,A8s-A2s,K9s-K2s,Q9s-Q2s,J9s-J2s,T9s-T2s",
                "fold": "Remaining hands"
            },
            "exploitative": {
                "raise": "AA-77,AKs-AJs,KQs-KJs,QJs,JTs,AKo-ATo,KQo",
                "call": "66-22,A9s-A2s,KTs-K7s,QTs-Q8s,J9s-J8s,T9s-T8s",
                "fold": "Depends on opponent tendencies"
            },
            "wildcard": {
                "raise": "Randomized",
                "call": "Randomized",
                "fold": "Randomized"
            },
            "maniac": {
                "raise": "AA-22,AKs-A2s,KQs-K2s,QJs-Q2s,JTs-J2s,T9s-T2s,98s-92s,87s-82s,76s-72s,65s-62s,54s-52s,43s-42s,32s,AKo-32o",
                "call": "None",
                "fold": "None"
            }
        }

        # Generic stack-based guidelines (applies to all personalities)
        self.general_situations = {
            "Deep Stack (100+ BB)": {
                "Play Style": "Tends to see more flops with wider opening range",
                "Position Importance": "Very high - can outmaneuver opponents postflop",
                "Key Hands": ["Suited connectors", "Broadways", "Mid-to-high pairs", "Suited Aces"]
            },
            "Mid Stack (50 BB)": {
                "Play Style": "Moderately loose but more cautious with large bets",
                "Position Importance": "Still crucial, especially for cheaper flops and steals",
                "Key Hands": ["Broadways", "Suited connectors", "Mid-pocket pairs", "Suited Aces"]
            },
            "Short Stack (20 BB)": {
                "Play Style": "Aggressive jam/fold style for value or strong draws",
                "Position Importance": "High - uses position to maintain fold equity",
                "Key Hands": ["Strong broadways", "Mid/high pairs", "Suited Aces", "Combo draws"]
            },
            "Micro Stack (10 BB)": {
                "Play Style": "Mostly shove-or-fold with premium or semi-premium holdings",
                "Position Importance": "Less relevant but can still pressure from late position",
                "Key Hands": ["Premium pairs", "Big suited Aces", "Strong connectors/broadways"]
            }
        }

    def _determine_stack_situation(self, stack_size: int, big_blind: int) -> str:
        """
        Returns which of the self.general_situations categories 
        applies based on the player's chip stack in BB units.
        """
        bb_count = stack_size // big_blind
        if bb_count >= 100:
            return "Deep Stack (100+ BB)"
        elif bb_count >= 50:
            return "Mid Stack (50 BB)"
        elif bb_count >= 20:
            return "Short Stack (20 BB)"
        else:
            return "Micro Stack (10 BB)"


    def _format_game_state(self, game_state) -> str:
        """Transforms raw game state into a structured, readable summary."""
        try:
            stage = game_state["game_stage"].capitalize()
            pot_size = game_state["total_pot"]
            current_bet = game_state["current_bet"]
            min_raise = game_state["min_raise"]
            small_blind = game_state["small_blind"]
            big_blind = game_state["big_blind"]

            # Format community cards
            community_cards = ", ".join(game_state["community_cards"]) if game_state["community_cards"] else "None"

            # Build string info for all players (excluding pocket cards)
            players_info = []
            for p in game_state["players"]:
                player_status = "All-in" if p["is_all_in"] else p["status"].capitalize()
                players_info.append(
                    f"{p['name']} ({p['position']}) - Chips: {p['chips']} - {player_status}"
                )

            # Identify current player details
            current_player = game_state["players"][game_state["current_player_idx"]]
            current_player_name = current_player["name"]
            available_actions = ", ".join(current_player["available_actions"]) if "available_actions" in current_player else "None"
            call_amount = current_player.get("call_amount", 0)

            # Only show the current player's pocket cards
            current_player_cards = ", ".join(current_player.get("pocket_cards", [])) or "None"

            formatted_summary = (
                f"Game Stage: {stage}\n"
                f"Pot: ${pot_size}, Current Bet: ${current_bet}, Min Raise: {min_raise}\n"
                f"Small Blind: ${small_blind}, Big Blind: {big_blind}\n"
                f"Community Cards: {community_cards}\n"
                f"Players:\n" + "\n".join(players_info) + "\n"
                f"Current Player: {current_player_name} - Available Actions: {available_actions}\n"
                f"Call Amount: ${call_amount}\n"
                f"Current Player's Pocket Cards: {current_player_cards}\n"
            )

            return formatted_summary

        except Exception as e:
            print(f"formatting game state went wrong ERROR: {e}")
            return "None"



    def _generate_decision(self, game_state, game_min_raise) -> dict:
        """
        Generates an action based on the current game state,
        factoring in personality, stack situation, and 
        slight adjustments to avoid over-revealing the hand.
        """
        formatted_state = self._format_game_state(game_state)

        # Identify current player's stack info
        current_player = game_state["players"][game_state["current_player_idx"]]
        current_stack = current_player["chips"]
        big_blind = game_state["big_blind"]
        current_bet = game_state["current_bet"]

        # Determine stack situation
        situation_key = self._determine_stack_situation(current_stack, big_blind)
        situation_info = self.general_situations[situation_key]

        # Base bet size logic
        min_bet = big_blind
        max_bet = game_state["total_pot"] // 2
        base_bet_sizes = [min_bet, int(min_bet * 1.5), min_bet * 2, min_bet * 3, max_bet]

        # Adjust bet/fold frequencies based on personality
        if self.personality in ["tight", "passive"]:
            base_bet_sizes = [min_bet, int(min_bet * 1.5)]
            if random.random() < 0.20 and current_bet > 0:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "I think I'll wait for a better spot."
                }
        elif self.personality in ["loose", "exploitative"]:
            base_bet_sizes = [min_bet, min_bet * 2, min_bet * 3]
            if random.random() < 0.10 and current_bet > 0:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "Not worth chasing right now."
                }
        elif self.personality in ["hyper_aggressive", "maniac"]:
            base_bet_sizes = [min_bet * 2, min_bet * 3, max_bet]
            if random.random() < 0.05 and current_bet > 0:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "I'll back off just this once."
                }
        else:
            # Default personalities (balanced, trap_player, math_based, wildcard)
            if random.random() < 0.10 and current_bet > 0:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "Maybe I'll sit this out."
                }

        # Randomly pick one of the suggested bet sizes (AI doesn't have to use it)
        chosen_bet = random.choice(base_bet_sizes)

        # Updated system message: incorporate chosen_bet and mention it's optional
        system_msg = (
            f"You are a {self.personality} poker bot.\n"
            f"Stack Situation: {situation_key}\n"
            f"Play Style: {situation_info['Play Style']}\n"
            f"Position Importance: {situation_info['Position Importance']}\n"
            f"Key Hands: {', '.join(situation_info['Key Hands'])}\n\n"
            f"Style: {self.traits[self.personality]['style']}.\n"
            f"Range: {self.traits[self.personality]['range']}.\n"
            f"Bluff Frequency: {self.traits[self.personality]['bluff_frequency']}.\n"
            f"Adaptability: {self.traits[self.personality]['adaptability']}.\n"
            "You have these suggested bet sizes to work with: "
            f"{base_bet_sizes}. A random choice here is "
            f"{chosen_bet}. You do NOT always have to raise or bet—"
            "folding or calling is fine if the situation warrants.\n"
            "You may make table comments to confuse opponents, but do NOT reveal your hand.\n"
            "Play slightly outside the stack-based guidelines if your personality suggests.\n"
            "Make a balanced poker decision considering:\n"
            "- Position (early, middle, late)\n"
            "- Stack size\n"
            "- Preflop hand strength\n"
            "- Opponent actions\n"
            "Respond with exactly a single-line JSON object:\n"
            "{\n"
            "  \"action\": \"check\"|\"call\"|\"fold\"|\"raise\"|\"bet\",\n"
            "  \"amount\": integer >= 0,\n"
            "  \"table_comment\": \"<short text, DO NOT REVEAL YOUR HAND>\",\n"
            "}"
        )

        prompt = (
            f"Game State:\n{formatted_state}\n\n"
            "Based on this situation, return a JSON object with action, amount, and table_comment."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50
            )
            result = response.choices[0].message.content.strip()
            print(result)
            parsed_response = json.loads(result)

            # Validate required keys
            if all(k in parsed_response for k in ("action", "amount", "table_comment")):
                if parsed_response["action"] == "raise" and parsed_response["amount"] < game_min_raise:
                    parsed_response["amount"] = game_min_raise
                
                return parsed_response
            else:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "Sticking to a safer play this time."
                }
        except Exception as e:
            # Fallback if there's an error parsing or with the API
            return {"action": "fold", "amount": 0, "table_comment": f"Error occurred: {str(e)}"}


    def get_decision(self, game_state, game_min_raise) -> dict:
        """Public method to fetch the bot's final decision object."""
        return self._generate_decision(game_state, game_min_raise)

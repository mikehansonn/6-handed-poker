import os
import json
import random
from dotenv import load_dotenv
from openai import OpenAI

class AIPokerCoach:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # A slightly wider preflop range
        self.basic_preflop_range = {
            "raise": "AA, KK, QQ, JJ, TT, 99, AKs, AKo, AQs, AJs",
            "call":  "88, 77, KQs, KJs, QJs, AJo, KQo, QJo, 98s",
            "fold":  "All other hands"
        }

        # Basic stack-based guidelines (similar to the Optimized Bot's approach)
        self.general_situations = {
            "Deep Stack (100+ BB)": {
                "Play Style": "See more flops with a wider range",
                "Position Importance": "Very high — can outmaneuver opponents postflop",
                "Key Hands": ["Suited connectors", "Broadways", "Mid-to-high pairs", "Suited Aces"]
            },
            "Mid Stack (50 BB)": {
                "Play Style": "Moderately loose but cautious with larger bets",
                "Position Importance": "Crucial for cheaper flops and steals",
                "Key Hands": ["Broadways", "Suited connectors", "Mid-pocket pairs", "Suited Aces"]
            },
            "Short Stack (20 BB)": {
                "Play Style": "Aggressive jam/fold style with strong draws or made hands",
                "Position Importance": "High — rely on fold equity and position advantage",
                "Key Hands": ["Strong broadways", "Mid/high pairs", "Suited Aces", "Combo draws"]
            },
            "Micro Stack (10 BB)": {
                "Play Style": "Primarily shove-or-fold with premium holdings",
                "Position Importance": "Less relevant but big advantage in late position",
                "Key Hands": ["Premium pairs", "Big suited Aces", "Strong connectors/broadways"]
            }
        }

    def _determine_stack_situation(self, stack_size: int, big_blind: int) -> str:
        """
        Determines which stack situation the player is in based on chip count in BB.
        """
        bb_count = stack_size // big_blind if big_blind > 0 else 0
        if bb_count >= 100:
            return "Deep Stack (100+ BB)"
        elif bb_count >= 50:
            return "Mid Stack (50 BB)"
        elif bb_count >= 20:
            return "Short Stack (20 BB)"
        else:
            return "Micro Stack (10 BB)"

    def _format_game_state(self, game_state) -> str:
        """
        Transforms the raw game state into a structured, readable summary string.
        """
        try:
            stage = game_state.get("game_stage", "").capitalize()
            pot_size = game_state.get("total_pot", 0)
            current_bet = game_state.get("current_bet", 0)
            min_raise = game_state.get("min_raise", 0)
            small_blind = game_state.get("small_blind", 0)
            big_blind = game_state.get("big_blind", 0)

            community_cards = ", ".join(game_state.get("community_cards", [])) or "None"

            players_info = []
            for p in game_state.get("players", []):
                player_status = "All-in" if p.get("is_all_in", False) else p.get("status", "").capitalize()
                players_info.append(
                    f"{p.get('name', 'Unknown')} ({p.get('position', 'Unknown')}) "
                    f"- Chips: {p.get('chips', 0)} - {player_status}"
                )

            current_player_idx = game_state.get("current_player_idx", 0)
            current_player = (
                game_state["players"][current_player_idx]
                if current_player_idx < len(game_state.get("players", []))
                else {}
            )
            current_player_name = current_player.get("name", "Unknown")
            available_actions = ", ".join(current_player.get("available_actions", [])) or "None"
            call_amount = current_player.get("call_amount", 0)

            formatted_summary = (
                f"Game Stage: {stage}\n"
                f"Pot: ${pot_size}, Current Bet: ${current_bet}, Min Raise: ${min_raise}\n"
                f"Small Blind: ${small_blind}, Big Blind: ${big_blind}\n"
                f"Community Cards: {community_cards}\n"
                f"Players:\n" + "\n".join(players_info) + "\n"
                f"Current Player: {current_player_name} - Available Actions: {available_actions}\n"
                f"Call Amount: ${call_amount}\n"
            )
            return formatted_summary

        except Exception as e:
            print(f"Error formatting game state: {e}")
            return "None"

    def get_advice(self, game_state) -> str:
        """
        Calls OpenAI with the relevant information from the game state
        and the basic guidelines, then returns text-based coaching advice 
        (not an automated action).
        """
        # Format the current game situation
        formatted_state = self._format_game_state(game_state)

        # Identify current player's stack info
        current_player_idx = game_state.get("current_player_idx", 0)
        player_data = game_state.get("players", [{}])[current_player_idx]
        stack_size = player_data.get("chips", 0)
        big_blind = game_state.get("big_blind", 0)

        # The user's hole cards (if this is a human, they won't be hidden)
        hole_cards = player_data.get("pocket_cards", ["", ""])
        hole_cards_str = ", ".join(hole_cards)

        # Determine stack situation
        situation_key = self._determine_stack_situation(stack_size, big_blind)
        situation_info = self.general_situations[situation_key]

        # Build the system message with the relevant details
        system_msg = (
            "You are an AI Poker Coach. You do NOT take actions yourself; you provide ONE short paragraph of advice.\n"
            "Below are basic preflop strategy and stack guidelines. You also know the user's hole cards.\n\n"
            f"Basic Preflop Range:\n"
            f"  Raise: {self.basic_preflop_range['raise']}\n"
            f"  Call:  {self.basic_preflop_range['call']}\n"
            f"  Fold:  {self.basic_preflop_range['fold']}\n\n"
            f"Stack Situation: {situation_key}\n"
            f"Play Style: {situation_info['Play Style']}\n"
            f"Position Importance: {situation_info['Position Importance']}\n"
            f"Key Hands: {', '.join(situation_info['Key Hands'])}\n\n"
            f"Current Hole Cards: {hole_cards_str}\n\n"
            "Return exactly one short paragraph referencing these hole cards and the overall situation.\n"
            "Do not reveal hidden opponent cards. Keep your response concise, no bullet points."
        )

        # The user prompt includes the full game state for reference
        user_prompt = (
            f"Here is the current game state:\n\n{formatted_state}\n\n"
            "Please offer a concise single-paragraph strategy recommendation."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=150
            )
            coaching_text = response.choices[0].message.content.strip()

            return coaching_text

        except Exception as e:
            return f"Error occurred while fetching advice from AI: {str(e)}"

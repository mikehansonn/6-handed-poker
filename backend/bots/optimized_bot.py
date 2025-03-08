import os
import json
from dotenv import load_dotenv
from openai import OpenAI

class OptimizedPokerBot:
    def __init__(self, personality="loose"):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.personality = personality
        
        # Simplified personality traits
        self.traits = {
            "loose": {
                "style": "aggressive",
                "range": "wide",
                "bluff_frequency": "high"
            },
            "tight": {
                "style": "conservative",
                "range": "narrow",
                "bluff_frequency": "low"
            },
            "balanced": {
                "style": "adaptive",
                "range": "moderate",
                "bluff_frequency": "medium"
            },
            "hyper_aggressive": {
                "style": "reckless",
                "range": "very wide",
                "bluff_frequency": "very high"
            },
            "passive": {
                "style": "cautious",
                "range": "moderate",
                "bluff_frequency": "very low"
            },
            "trap_player": {
                "style": "deceptive",
                "range": "narrow",
                "bluff_frequency": "low"
            },
            "math_based": {
                "style": "calculative",
                "range": "GTO optimal",
                "bluff_frequency": "situational"
            },
            "exploitative": {
                "style": "opportunistic",
                "range": "dynamic",
                "bluff_frequency": "adaptive"
            },
            "wildcard": {
                "style": "unpredictable",
                "range": "randomized",
                "bluff_frequency": "random"
            },
            "maniac": {
                "style": "fearless",
                "range": "ultra-wide",
                "bluff_frequency": "extreme"
            }
        }

        # Simplified preflop ranges using compact notation
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
                "call": "55-22,A8s-A2s,K9s-K2s,Q9s-Q2s,J9s-J2s, T9s-T2s",
                "fold": "Remaining hands"
            },
            "hyper_aggressive": {
                "raise": "AA-22,AKs-A2s,KQs-K2s,QJs-Q2s,JTs-J2s,T9s-T2s,98s-92s,87s-82s,76s-72s,65s-62s,54s-52s,43s-42s,32s,AKo-32o",
                "call": "None",
                "fold": "None"
            },
            "passive": {
                "raise": "AA-JJ,AKs,AKo",
                "call": "TT-22,AQs-A2s,KQs-KTs,QJs-QTs,JTs,J9s, T9s,98s,87s",
                "fold": "Remaining hands"
            },
            "trap_player": {
                "raise": "AA-KK,AKs,AKo",
                "call": "QQ-99,AQs-AJs,KQs-KJs,QJs-QTs,JTs",
                "fold": "Remaining hands"
            },
            "math_based": {
                "raise": "AA-66,AKs-A9s,KQs-KTs,QJs-QTs,JTs+,AKo-ATo,KQo,KJo",
                "call": "55-22,A8s-A2s,K9s-K2s,Q9s-Q2s,J9s-J2s, T9s-T2s",
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


    def _format_game_state(self, game_state) -> str:
        """ 
        Transforms raw game state into a structured, readable summary. 
        """
        try: 
            stage = game_state["game_stage"].capitalize()
            pot_size = game_state["total_pot"]
            current_bet = game_state["current_bet"]
            min_raise = game_state["min_raise"]
            small_blind = game_state["small_blind"]
            big_blind = game_state["big_blind"]

            # Format community cards
            community_cards = ", ".join(game_state["community_cards"]) if game_state["community_cards"] else "None"

            # Format players
            players_info = []
            for p in game_state["players"]:
                player_status = "All-in" if p["is_all_in"] else p["status"].capitalize()
                players_info.append(
                    f"{p['name']} ({p['position']}) - Chips: {p['chips']} - {player_status}"
                )

            # Identify current player and their available actions
            current_player = game_state["players"][game_state["current_player_idx"]]
            current_player_name = current_player["name"]
            available_actions = ", ".join(current_player["available_actions"]) if "available_actions" in current_player else "None"
            call_amount = current_player.get("call_amount", 0)

            # Format final summary
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
            print(f"formatting game state went wrong ERROR: {e}")
            return "None"

    def _generate_decision(self, game_state) -> dict:

        formatted_state = self._format_game_state(game_state)
        
        system_msg = (
            f"You are a {self.personality} poker bot. "
            f"Style: {self.traits[self.personality]['style']}, "
            f"Range: {self.traits[self.personality]['range']}, "
            f"Bluff Frequency: {self.traits[self.personality]['bluff_frequency']}. "
            f"Preflop ranges: {self.preflop_charts[self.personality]}. "
            "The user will provide a game state. You must respond with EXACTLY a single-line JSON object:\n"
            "{\n"
            "  \"action\": \"check\"|\"call\"|\"fold\"|\"raise\"|\"bet\",\n"
            "  \"amount\": integer >= 0,\n"
            "  \"table_comment\": \"<short text not revealing your hand while talking like a poker player>\"\n"
            "}\n"
            "No additional text or explanation. Do NOT output code fences. Just the JSON object."
            "The available_actions key holds the currently avaible actions at the current gamestate"
        )

        prompt = (
            f"Game State:\n{formatted_state}\n\n"
            "Given this situation, return a single-line JSON object with the keys "
            "action, amount, and table_comment."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Use the most efficient model
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50
            )
            print(response)
            # Parse the simple response format
            result = response.choices[0].message.content.strip()
            parsed_response = json.loads(result)

            # Validate that we have the needed keys
            if all(k in parsed_response for k in ("action", "amount", "table_comment")):
                return parsed_response
            else:
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "Error: Missing required keys in response."
                }

        except Exception as e:
            print(e)
            return {"action": "fold", "amount": 0, "table_comment": "Error occurred"}

    def get_decision(self, game_state) -> dict:
        return self._generate_decision(game_state)
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
            }
        }

    def _generate_decision(self, game_state) -> dict:
        
        system_msg = (
            f"You are a {self.personality} poker bot. "
            f"Style: {self.traits[self.personality]['style']}, "
            f"Range: {self.traits[self.personality]['range']}, "
            f"Bluff: {self.traits[self.personality]['bluff_frequency']}. "
            f"Preflop ranges: {self.preflop_charts[self.personality]}. "
            "Respond with action,amount,comment format."
        )

        prompt = (
            f"Game State:\n{game_state}\n\n"
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
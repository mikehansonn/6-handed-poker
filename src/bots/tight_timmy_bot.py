import os
import json
from dotenv import load_dotenv
from openai import OpenAI

class GameState:
    """
    Represents the current game state.
    In a real app, this might include more details like:
      - Positions
      - Bets
      - Stack sizes
      - Cards
      - etc.
    """
    def __init__(self, description: str):
        self.description = description


class TightPokerBot:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Tighter preflop ranges (for reference)
        self.preflop_ranges = {
            100: {  # 100BB Deep
                "UTG": {
                    "Raise First In": ["AA", "KK", "QQ", "JJ", "AKs", "AQs"],
                    "Call 3-Bet": ["JJ", "TT", "AKo"],
                    "Fold": ["AJs", "ATs", "KQo", "Any weaker hands"]
                },
                "BTN": {
                    "Raise First In": ["AA", "KK", "QQ", "JJ", "AKs", "AQs", "TT", "AKo"],
                    "Call 3-Bet": ["JJ", "TT", "AQo"],
                    "Fold": ["AJo", "KQo", "Any weaker hands"]
                }
            },
            50: {  # 50BB Stack
                "UTG": {
                    "Raise First In": ["AA", "KK", "QQ", "JJ", "AKs", "AQs"],
                    "Call 3-Bet": ["JJ", "TT", "AQo"],
                    "Fold": ["AJs", "ATs", "KQo", "Weaker hands"]
                },
                "BTN": {
                    "Raise First In": ["AA", "KK", "QQ", "JJ", "AKs", "AQs", "TT", "AKo"],
                    "Call 3-Bet": ["AQo", "JJ", "TT"],
                    "Fold": ["AJo", "KQo", "Weaker hands"]
                }
            },
            20: {  # Short Stack (20BB)
                "UTG": {
                    "All-In": ["AA", "KK", "QQ", "JJ", "AKs", "AKo"],
                    "Raise First In": ["AQs", "TT"],
                    "Fold": ["AJ", "AT", "KQ", "Weaker hands"]
                },
                "BTN": {
                    "All-In": ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs", "TT"],
                    "Raise First In": ["AQo", "99"],
                    "Fold": ["AJ", "KQ", "Weaker hands"]
                }
            },
            10: {  # Shove or Fold (10BB)
                "UTG": {
                    "All-In": ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs", "TT"],
                    "Fold": ["AJs", "KQs", "Weaker hands"]
                },
                "BTN": {
                    "All-In": ["AA", "KK", "QQ", "JJ", "AKs", "AKo", "AQs", "TT", "99"],
                    "Fold": ["AJo", "KQo", "Weaker hands"]
                }
            }
        }

        # Tighter general situations (for reference)
        self.general_situations = {
            "Deep Stack (100+ BB)": {
                "Play Style": "Tight and cautious, avoid marginal spots, fewer speculative hands",
                "Position Importance": "High - still open wider in late position, but remain cautious",
                "Key Hands": ["Premium Pocket Pairs", "Big Suited Aces", "AK/AQ combinations"]
            },
            "Mid Stack (50 BB)": {
                "Play Style": "Even tighter, focus on strong value hands and safe 3-bets",
                "Position Importance": "Important, but tighter overall due to decreased SPR",
                "Key Hands": ["Strong Broadways", "Big Pocket Pairs", "AK/AQ"]
            },
            "Short Stack (20 BB)": {
                "Play Style": "Push/Fold with strong ranges, minimal risk taking",
                "Position Importance": "High - more folds in early position, slightly looser in late",
                "Key Hands": ["High Pocket Pairs", "AK", "AQ", "occasional strong suited combos"]
            },
            "Micro Stack (10 BB)": {
                "Play Style": "Primarily shove or fold with top-tier holdings",
                "Position Importance": "Slightly less relevant because stack is so short",
                "Key Hands": ["Premium Pairs", "AK", "Occasionally AQ/TT+"]
            }
        }

    def _generate_chatGPT_response(self, prompt: str) -> dict:
        """
        Sends the provided prompt to the OpenAI API with a 'tight but worried' personality.
        The response must be valid JSON with exactly these keys:
            {
                "action": "check"|"call"|"fold"|"raise",
                "amount": int,  # 0 if not calling or raising
                "table_comment": str  # short, doesn't reveal the hand
            }
        If parsing fails, returns a fallback dict.
        """
        try:
            # Build a strict system prompt
            system_msg = (
                "You are a tight and slightly worried poker bot. "
                "You have these preflop ranges:\n\n"
                f"{self.preflop_ranges}\n\n"
                "And these general situations:\n\n"
                f"{self.general_situations}\n\n"
                "The user will provide a game state. You must respond with EXACTLY a single-line JSON object containing:\n"
                "{\n"
                "  \"action\": \"check\"|\"call\"|\"fold\"|\"raise\",\n"
                "  \"amount\": 0 or more (int),\n"
                "  \"table_comment\": \"<short text not revealing your hand>\"\n"
                "}\n"
                "No additional text or explanation. Do NOT output code fences. Just the JSON object."
            )

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # or whichever model you'd like
                messages=[
                    {
                        "role": "system",
                        "content": system_msg
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150
            )

            # Raw text from ChatGPT
            raw_response = response.choices[0].message.content.strip()

            # Attempt to parse as JSON
            parsed_response = json.loads(raw_response)
            # Verify the required keys are present
            if all(k in parsed_response for k in ("action", "amount", "table_comment")):
                return parsed_response
            else:
                # If keys are missing, return an error fallback
                return {
                    "action": "fold",
                    "amount": 0,
                    "table_comment": "Error: Missing required keys in response."
                }

        except Exception as e:
            # If we fail to parse, return a fallback with the error message
            return {
                "action": "fold",
                "amount": 0,
                "table_comment": f"Error occurred: {str(e)}"
            }

    def get_decision(self, game_state: GameState) -> dict:
        """
        Builds a prompt from the game state. We pass that prompt to ChatGPT
        and return the final dictionary (action, amount, table_comment).
        """
        prompt = (
            f"Game State:\n{game_state.description}\n\n"
            "Given this situation, return a single-line JSON object with the keys "
            "action, amount, and table_comment."
        )
        return self._generate_chatGPT_response(prompt)


# --- Example usage / test --- #
if __name__ == "__main__":
    bot = TightPokerBot()
    # Example GameState
    example_state = GameState(
        "We are UTG with 100BB. Blinds are 1/2. We hold pocket Kh 7h. No action yet."
    )
    decision = bot.get_decision(example_state)

    # decision is now a Python dictionary you can manipulate
    print("Decision from bot:", decision)
    print("\nParsed output:")
    print("action:", decision.get("action"))
    print("amount:", decision.get("amount"))
    print("table_comment:", decision.get("table_comment"))

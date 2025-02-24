import os
import json
from dotenv import load_dotenv
from openai import OpenAI
# from game_state import GameState


class LooseLaurenBot:
    """
    Loose Lauren: Plays wide ranges, often entering pots with marginal hands.
    More thorough coverage of 100BB, 50BB, 20BB, and 10BB stack depths.
    """

    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # A short bio or personality descriptor
        self.bot_bio = {
            "name": "Loose Lauren",
            "description": (
                "Loose Lauren loves action and rarely misses a chance to see a flop. "
                "She’s sociable, unpredictable, and not afraid to push a marginal hand if the mood strikes."
            )
        }


        # "Loose" preflop ranges for 100BB, 50BB, 20BB, 10BB       
        self.preflop_ranges = {
            100: {
                "UTG": {
                    "Raise First In": ["AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs","ATs","KQs","KJs","QJs","JTs","AJo","AQo"],
                    "Call 3-Bet": ["JJ","TT","99","88","AQo","KQs","QJs","JTs"],
                    "Fold": ["A2o-A9o","KJo-KTo","Weak suited connectors","Any trash hands"]
                },
                "BTN": {
                    "Raise First In": ["AA","KK","QQ","JJ","TT","99","88","77","AKs","AQs","AJs","ATs","KQs","KJs","QJs","JTs","T9s","98s","87s","76s","AQo","AJo","KQo"],
                    "Call 3-Bet": ["JJ","TT","99","88","AQo","AJo","KQo","T9s","98s"],
                    "Fold": ["Super-weak offsuit hands like 72o, 82o","Lower suited connectors below 65s"]
                }
            },
            50: {
                "UTG": {
                    "Raise First In": ["AA","KK","QQ","JJ","TT","AKs","AQs","AJs","KQs"],
                    "Call 3-Bet": ["JJ","TT","AQo","AJs"],
                    "Fold": ["Lower pocket pairs (99 and below sometimes folded if 3-bet)","Weaker suited aces","Any random offsuit hands"]
                },
                "BTN": {
                    "Raise First In": ["AA","KK","QQ","JJ","TT","99","AKs","AQs","AJs","ATs","KQs","QJs","JTs"],
                    "Call 3-Bet": ["AQo","AJ","KQo","TT","99"],
                    "Fold": ["Any weaker holdings, especially offsuit combos"]
                }
            },
            20: {
                "UTG": {
                    "All-In": ["AA","KK","QQ","JJ","TT","AKs","AKo","AQs","AJs"],
                    "Raise First In": ["KQs","AJ","KJs","QJs"],
                    "Fold": ["Weaker pocket pairs","Offsuit connectors","Marginal suited connectors"]
                },
                "BTN": {
                    "All-In": ["AA","KK","QQ","JJ","TT","AKs","AQs","AKo","99","88","AJs","KQs"],
                    "Raise First In": ["AJo","KQo","QJs","JTs"],
                    "Fold": ["Weaker unsuited combos","Small suited connectors like 65s, 54s"]
                }
            },
            10: {
                "UTG": {
                    "All-In": ["AA","KK","QQ","JJ","TT","AKs","AKo","AQs"],
                    "Fold": ["Everything else (even smaller pairs if especially cautious)"]
                },
                "BTN": {
                    "All-In": ["AA","KK","QQ","JJ","TT","AKs","AKo","AQs","99","88"],
                    "Fold": ["Any lower pairs or unsuited connectors"]
                }
            }
        }

        # General situations for 100BB, 50BB, 20BB, 10BB
        self.general_situations = {
            "Deep Stack (100+ BB)": {
                "Play Style": "Very loose and aggressive, loves to see flops, wide opening range",
                "Position Importance": "Extremely high - thrives on position to outplay opponents postflop",
                "Key Hands": ["Any suited connectors, broadways, mid-to-high pairs, suited aces"]
            },
            "Mid Stack (50 BB)": {
                "Play Style": "Still loose, but a bit more cautious with all-in decisions",
                "Position Importance": "Crucial, but will still see flops with a wide range if the price is right",
                "Key Hands": ["Broadways, suited connectors, mid-pocket pairs, strong suited aces"]
            },
            "Short Stack (20 BB)": {
                "Play Style": "Loose jam/fold style, not afraid to push draws and broadways",
                "Position Importance": "High - tries to leverage fold equity from late position",
                "Key Hands": ["Strong broadways, mid/high pairs, suited aces, big combos"]
            },
            "Micro Stack (10 BB)": {
                "Play Style": "Mostly shove or fold with top-tier holdings, but can still get frisky with connectors",
                "Position Importance": "Less relevant at 10BB, but will occasionally gamble from later positions",
                "Key Hands": ["Premium pairs, big suited aces, occasionally decent suited connectors/broadways"]
            }
        }

    def _generate_chatGPT_response(self, prompt: str) -> dict:
        """
        Sends the prompt to OpenAI. We expect ChatGPT to return a single-line JSON with:
            {
              "action": "check"|"call"|"fold"|"raise"|"bet",
              "amount": int,  # how many BB if raising/beting, 0 otherwise
              "table_comment": str  # short text not revealing the hand
            }
        """
        try:
            system_msg = (
                f"You are {self.bot_bio['name']}, a loose and sociable poker bot.\n\n"
                "Here are your detailed preflop ranges:\n\n"
                f"{self.preflop_ranges}\n\n"
                "Here are your general situations:\n\n"
                f"{self.general_situations}\n\n"
                "The user will provide a game state. You must respond with EXACTLY a single-line JSON object:\n"
                "{\n"
                "  \"action\": \"check\"|\"call\"|\"fold\"|\"raise\"|\"bet\",\n"
                "  \"amount\": integer >= 0,\n"
                "  \"table_comment\": \"<short text not revealing your hand>\"\n"
                "}\n"
                "No additional text or explanation. Do NOT output code fences. Just the JSON object."
                "The available_actions key holds the currently avaible actions at the current gamestate"
            )

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # or whichever model you prefer
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )

            raw_response = response.choices[0].message.content.strip()
            parsed_response = json.loads(raw_response)

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
            # Fallback if something goes wrong (e.g., parse error)
            return {
                "action": "fold",
                "amount": 0,
                "table_comment": f"Error occurred: {str(e)}"
            }
        

    def get_decision(self, game_state) -> dict:
        """
        Build a user prompt from the game state and get ChatGPT's response as a dict.
        """

        prompt = (
            f"Game State:\n{game_state}\n\n"
            "Given this situation, return a single-line JSON object with the keys "
            "action, amount, and table_comment."
        )
        return self._generate_chatGPT_response(prompt)




if __name__ == "__main__":
    bot = LooseLaurenBot()
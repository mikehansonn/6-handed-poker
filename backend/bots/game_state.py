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

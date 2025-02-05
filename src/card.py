from suit import Suit

class Card:
    def __init__(self, value, suit):
        self.value = value
        self.suit = suit
    
    def __str__(self):
        face_cards = {11: 'J', 12: 'Q', 13: 'K', 14: 'A'}
        card_value = face_cards.get(self.value, str(self.value))
        return f"{card_value}{self.suit.value}"
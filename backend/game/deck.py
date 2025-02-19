from .suit import Suit
from .card import Card
import random

class Deck:
    def __init__(self):
        self.cards = []
        self._create_deck()
    
    def _create_deck(self):
        for suit in Suit:
            for value in range(2, 15):
                self.cards.append(Card(value, suit))
        self.shuffle()
    
    def reset(self):
        self.cards = []
        self._create_deck()

    def shuffle(self):
        random.shuffle(self.cards)
    
    def deal(self):
        if len(self.cards) > 0:
            return self.cards.pop()
        return None
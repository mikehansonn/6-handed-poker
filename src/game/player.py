from .status import Status

class Player:
    def __init__(self, name, chips):
        self.name = name
        self.chips = chips
        self.pocket = []
        self.hand = []
        self.is_active = Status.ACTIVE
    
    def add_pocket_card(self, card):
        self.pocket.append(card)

    def add_5_card(self, card):
        self.hand.append(card)
    
    def clear_pocket(self):
        self.pocket = []

    def clear_hand(self):
        self.hand = []

from enum import Enum
from typing import List, Optional
from player import Player
from deck import Deck

class GameStage(Enum):
    PREFLOP = "preflop"
    FLOP = "flop"
    TURN = "turn"
    RIVER = "river"
    SHOWDOWN = "showdown"

class Action(Enum):
    FOLD = "fold"
    CHECK = "check"
    CALL = "call"
    BET = "bet"
    RAISE = "raise"

class TexasHoldem:
    def __init__(self, player_names: List[str], starting_chips: int = 1000):
        if len(player_names) != 6:
            raise ValueError("Texas Hold'em requires exactly 6 players")
        
        self.deck = Deck()
        self.players = [Player(name, starting_chips) for name in player_names]
        self.community_cards = []
        self.current_stage = GameStage.PREFLOP
        self.button_position = 0  # Dealer button position
        self.current_player_idx = 0
        self.pot = 0
        self.current_bet = 0
        self.small_blind = 10
        self.big_blind = 20
        
    def reset_hand(self):
        self.deck.reset()
        self.community_cards = []
        self.current_stage = GameStage.PREFLOP
        self.pot = 0
        self.current_bet = 0
        
        # Clear all player hands
        for player in self.players:
            player.clear_pocket()
            player.clear_hand()
            player.is_active = True
            
    def move_button(self):
        self.button_position = (self.button_position + 1) % 6
        
    def deal_hole_cards(self):
        # Deal first card to each player
        for i in range(6):
            player_idx = (self.button_position + i + 1) % 6
            card = self.deck.deal()
            if card:
                self.players[player_idx].add_pocket_card(card)
                
        # Deal second card to each player
        for i in range(6):
            player_idx = (self.button_position + i + 1) % 6
            card = self.deck.deal()
            if card:
                self.players[player_idx].add_pocket_card(card)
    
    def deal_flop(self):
        if self.current_stage != GameStage.PREFLOP:
            raise ValueError("Cannot deal flop - incorrect game stage")
            
        # Burn a card
        self.deck.deal()
        
        # Deal three cards
        for _ in range(3):
            card = self.deck.deal()
            if card:
                self.community_cards.append(card)
                
        self.current_stage = GameStage.FLOP
        
    def deal_turn(self):
        if self.current_stage != GameStage.FLOP:
            raise ValueError("Cannot deal turn - incorrect game stage")
            
        # Burn a card
        self.deck.deal()
        
        # Deal turn card
        card = self.deck.deal()
        if card:
            self.community_cards.append(card)
            
        self.current_stage = GameStage.TURN
        
    def deal_river(self):
        if self.current_stage != GameStage.TURN:
            raise ValueError("Cannot deal river - incorrect game stage")
            
        # Burn a card
        self.deck.deal()
        
        # Deal river card
        card = self.deck.deal()
        if card:
            self.community_cards.append(card)
            
        self.current_stage = GameStage.RIVER
        
    def get_active_players(self) -> List[Player]:
        """Return a list of players still active in the hand"""
        return [player for player in self.players if player.is_active]
        
    def get_player_position(self, player_idx: int) -> str:
        positions = {
            0: "Button",
            1: "Small Blind",
            2: "Big Blind",
            3: "UTG",
            4: "UTG+1",
            5: "Cutoff"
        }
        relative_position = (player_idx - self.button_position) % 6
        return positions[relative_position]
        
    def start_new_hand(self):
        """Initialize and start a new hand"""
        self.reset_hand()
        self.move_button()
        self.deal_hole_cards()
        
        # Post blinds
        sb_pos = (self.button_position + 1) % 6
        bb_pos = (self.button_position + 2) % 6
        
        # Small blind
        self.players[sb_pos].chips -= self.small_blind
        self.pot += self.small_blind
        
        # Big blind
        self.players[bb_pos].chips -= self.big_blind
        self.pot += self.big_blind
        self.current_bet = self.big_blind
        
        self.current_player_idx = (self.button_position + 3) % 6
        self.last_bettor_idx = None
        self.min_raise = self.big_blind
        self.street_contributions = {i: 0 for i in range(6)}
        
        self.street_contributions[sb_pos] = self.small_blind
        self.street_contributions[bb_pos] = self.big_blind
        
    def get_available_actions(self) -> List[Action]:
        """Return list of available actions for current player"""
        actions = [Action.FOLD]
        player = self.players[self.current_player_idx]
        
        if self.current_bet == 0:
            actions.append(Action.CHECK)
            actions.append(Action.BET)
        else:
            call_amount = self.current_bet - getattr(player, 'current_bet', 0)
            if call_amount < player.chips:
                actions.append(Action.CALL)
                actions.append(Action.RAISE)
                
        return actions

    def process_action(self, action: Action, amount: Optional[int] = None) -> bool:
        """Process a player action and return True if betting round is complete"""
        player = self.players[self.current_player_idx]
        
        if action == Action.FOLD:
            player.is_active = False
            
        elif action == Action.CHECK:
            if self.current_bet != 0:
                raise ValueError("Cannot check when there's a bet")
            self.street_contributions[self.current_player_idx] = 0
                
        elif action == Action.CALL:
            current_contribution = self.street_contributions[self.current_player_idx]
            call_amount = self.current_bet - current_contribution
            
            if call_amount > player.chips:
                call_amount = player.chips
            
            player.chips -= call_amount
            self.pot += call_amount
            self.street_contributions[self.current_player_idx] += call_amount
            
        elif action in (Action.BET, Action.RAISE):
            if not amount:
                raise ValueError(f"Amount required for {action.value}")
            if action == Action.BET and self.current_bet != 0:
                raise ValueError("Cannot bet when there's already a bet")
            if action == Action.RAISE and self.current_bet == 0:
                raise ValueError("Cannot raise when there's no bet")
                
            min_amount = self.current_bet + self.min_raise if action == Action.RAISE else self.big_blind
            if amount < min_amount:
                raise ValueError(f"Minimum {action.value} is {min_amount}")
                
            current_contribution = self.street_contributions[self.current_player_idx]
            total_needed = amount - current_contribution
            
            if total_needed > player.chips:
                raise ValueError("Not enough chips")
                
            player.chips -= total_needed
            self.pot += total_needed
            self.current_bet = amount
            self.street_contributions[self.current_player_idx] = amount
            self.last_bettor_idx = self.current_player_idx
            self.min_raise = amount - self.current_bet
            
        self.move_to_next_player()
        
        return self.is_betting_round_complete()
        
    def move_to_next_player(self):
        """Move to the next active player"""
        original_idx = self.current_player_idx
        while True:
            self.current_player_idx = (self.current_player_idx + 1) % 6
            if self.players[self.current_player_idx].is_active:
                break
            if self.current_player_idx == original_idx:
                break
                
    def is_betting_round_complete(self) -> bool:
        active_players = self.get_active_players()
        
        if len(active_players) == 1:
            return True

        first_to_act = None
        if self.current_stage != GameStage.PREFLOP:
            idx = (self.button_position + 1) % 6
            while first_to_act is None:
                if self.players[idx].is_active:
                    first_to_act = idx
                idx = (idx + 1) % 6
        else:
            first_to_act = (self.button_position + 3) % 6 
        
        bb_pos = (self.button_position + 2) % 6
        
        if self.current_bet == 0:
            return (self.current_player_idx == first_to_act and 
                    all(self.street_contributions[i] >= 0 for i in range(6) if self.players[i].is_active))
        else:
            all_matched = all(self.street_contributions[i] == self.current_bet 
                            for i in range(6) if self.players[i].is_active)
            
            if (self.current_stage == GameStage.PREFLOP and 
                self.current_bet == self.big_blind and 
                self.players[bb_pos].is_active and
                all_matched and 
                self.last_bettor_idx is None): 
                return self.current_player_idx != bb_pos
                
            return all_matched
                       
    def reset_street_bets(self):
        self.current_bet = 0
        self.last_bettor_idx = None
        self.street_contributions = {i: 0 for i in range(6)}
        self.current_player_idx = (self.button_position + 1) % 6

    def play_betting_round(self):
        while True:
            player = self.players[self.current_player_idx]
            if not player.is_active:
                self.move_to_next_player()
                continue
                
            print("\n" + "="*50)
            print(self.get_hand_summary())
            print(f"\nCurrent player: {player.name}")
            print(self.get_betting_info())
            print(f"Available actions: {[a.value for a in self.get_available_actions()]}")
            
            while True:
                try:
                    action_input = input("Enter action (fold/check/call/bet/raise): ").lower()
                    action = Action(action_input)
                    
                    if action not in self.get_available_actions():
                        print("Invalid action!")
                        continue
                        
                    amount = None
                    if action in (Action.BET, Action.RAISE):
                        amount = int(input("Enter amount: "))
                        
                    if self.process_action(action, amount):
                        return
                    break
                    
                except (ValueError, KeyError) as e:
                    print(f"Error: {str(e)}")
                    continue
                    
    def play_hand(self):
        self.start_new_hand()
        
        # Preflop
        print("\nPre-flop betting round:")
        self.play_betting_round()
        
        if len(self.get_active_players()) > 1:
            # Flop
            self.deal_flop()
            print("\nFlop betting round:")
            self.reset_street_bets()
            self.play_betting_round()
            
        if len(self.get_active_players()) > 1:
            # Turn
            self.deal_turn()
            print("\nTurn betting round:")
            self.reset_street_bets()
            self.play_betting_round()
            
        if len(self.get_active_players()) > 1:
            # River
            self.deal_river()
            print("\nRiver betting round:")
            self.reset_street_bets()
            self.play_betting_round()
            
        # Show results
        print("\nHand complete!")
        print(f"Pot: {self.pot}")
        active_players = self.get_active_players()
        if len(active_players) == 1:
            winner = active_players[0]
            print(f"Winner: {winner.name} wins {self.pot} chips")
            winner.chips += self.pot
        else:
            print("Showdown required!")
            for player in active_players:
                cards = " ".join(str(card) for card in player.pocket)
                print(f"{player.name}'s hand: {cards}")
                
    def get_betting_info(self) -> str:
        active_player = self.players[self.current_player_idx]
        current_contribution = self.street_contributions[self.current_player_idx]
        to_call = max(0, self.current_bet - current_contribution)
        
        info = []
        info.append(f"Current bet: {self.current_bet}")
        info.append(f"Your contribution this street: {current_contribution}")
        if to_call > 0:
            info.append(f"Amount needed to call: {to_call}")
        
        return "\n".join(info)

    def get_hand_summary(self) -> str:
        summary = []
        summary.append(f"Stage: {self.current_stage.value}")
        summary.append(f"Pot: {self.pot}")
        summary.append(f"Current bet: {self.current_bet}")
        
        if self.community_cards:
            community = " ".join(str(card) for card in self.community_cards)
            summary.append(f"Community cards: {community}")
            
        summary.append("\nPlayers:")
        for i, player in enumerate(self.players):
            position = self.get_player_position(i)
            pocket = " ".join(str(card) for card in player.pocket) if player.pocket else "XX"
            player_info = f"{player.name} ({position}): {pocket} - Chips: {player.chips}"
            if not player.is_active:
                player_info = "Folded"
            summary.append(player_info)
            
        return "\n".join(summary)
    
players = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"]
game = TexasHoldem(players)
game.play_hand()
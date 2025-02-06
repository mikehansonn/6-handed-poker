from enum import Enum
from typing import List, Optional
from player import Player
from deck import Deck
import random

class Pot:
    def __init__(self):
        self.amount = 0
        self.eligible_players = set()
        self.required_amount = 0 

    def add_chips(self, amount: int, player_idx: int):
        self.amount += amount
        self.eligible_players.add(player_idx)

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
        self.players = [Player(name, random.randint(100, 1000)) for name in player_names]
        self.community_cards = []
        self.current_stage = GameStage.PREFLOP
        self.button_position = 0
        self.current_player_idx = 0
        self.pots = [Pot()]  # Main pot is always first
        self.current_bet = 0
        self.small_blind = 10
        self.big_blind = 20
        self.all_in_players = set()  # Track players who are all-in
        
    def reset_hand(self):
        self.deck.reset()
        self.community_cards = []
        self.current_stage = GameStage.PREFLOP
        self.pots = [Pot()]
        self.current_bet = 0
        self.all_in_players = set()
        
        for player in self.players:
            player.clear_pocket()
            player.clear_hand()
            player.is_active = True

    def get_total_pot(self) -> int:
        return sum(pot.amount for pot in self.pots)
    
    def create_side_pot(self, all_in_amount: int):
        new_pot = Pot()
        excess_chips = 0

        for i, player in enumerate(self.players):
            if player.is_active and i not in self.all_in_players:
                if self.street_contributions[i] > all_in_amount:
                    excess = self.street_contributions[i] - all_in_amount
                    self.street_contributions[i] = all_in_amount
                    excess_chips += excess
                    new_pot.add_chips(excess, i)

        if excess_chips > 0:
            new_pot.required_amount = self.current_bet - all_in_amount
            self.pots.append(new_pot)
            self.current_bet = all_in_amount
            return True
        return False

    def get_call_amount(self) -> int:
        player = self.players[self.current_player_idx]
        current_contribution = self.street_contributions[self.current_player_idx]
        total_to_call = 0
        
        for pot in self.pots:
            if self.current_player_idx not in pot.eligible_players:
                continue
            to_call_for_pot = pot.required_amount - current_contribution
            if to_call_for_pot > 0:
                total_to_call += to_call_for_pot
        
        if total_to_call == 0:
            total_to_call = self.current_bet - current_contribution
        
        return min(total_to_call, player.chips)

    def move_button(self):
        self.button_position = (self.button_position + 1) % 6
        
    def deal_hole_cards(self):
        for i in range(6):
            player_idx = (self.button_position + i + 1) % 6
            card = self.deck.deal()
            if card:
                self.players[player_idx].add_pocket_card(card)
                
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
        sb_player = self.players[sb_pos]
        sb_amount = min(self.small_blind, sb_player.chips)
        sb_player.chips -= sb_amount
        self.pots[0].add_chips(sb_amount, sb_pos)
        
        if sb_amount < self.small_blind:
            self.all_in_players.add(sb_pos)
        
        # Big blind
        bb_player = self.players[bb_pos]
        bb_amount = min(self.big_blind, bb_player.chips)
        bb_player.chips -= bb_amount
        self.pots[0].add_chips(bb_amount, bb_pos)
        
        if bb_amount < self.big_blind:
            self.all_in_players.add(bb_pos)
            if bb_amount < sb_amount:
                # Create side pot if SB posted more than BB's all-in
                self.create_side_pot(bb_amount)
        
        # Set current bet to the maximum amount posted
        self.current_bet = max(sb_amount, bb_amount)
        
        self.current_player_idx = (self.button_position + 3) % 6
        self.last_bettor_idx = None
        self.min_raise = self.big_blind
        self.street_contributions = {i: 0 for i in range(6)}
        
        # Update street contributions
        self.street_contributions[sb_pos] = sb_amount
        self.street_contributions[bb_pos] = bb_amount
        
    def get_available_actions(self) -> List[Action]:
        actions = [Action.FOLD]
        player = self.players[self.current_player_idx]
        
        if self.current_bet == 0:
            actions.append(Action.CHECK)
            if player.chips > 0: 
                actions.append(Action.BET)
        else:
            if player.chips > 0: 
                actions.append(Action.CALL)
                call_amount = self.current_bet - self.street_contributions[self.current_player_idx]
                if player.chips > call_amount:
                    actions.append(Action.RAISE)
                
        return actions

    def process_action(self, action: Action, amount: Optional[int] = None) -> bool:
        player = self.players[self.current_player_idx]
        
        if action == Action.FOLD:
            player.is_active = False
            
        elif action == Action.CHECK:
            if self.current_bet != 0:
                raise ValueError("Cannot check when there's a bet")
            self.street_contributions[self.current_player_idx] = 0
                
        elif action == Action.CALL:
            call_amount = self.get_call_amount()
            current_contribution = self.street_contributions[self.current_player_idx]
            
            player.chips -= call_amount
            self.pots[0].add_chips(call_amount, self.current_player_idx)
            self.street_contributions[self.current_player_idx] += call_amount
            
            if player.chips == 0:
                self.all_in_players.add(self.current_player_idx)
                if call_amount < self.current_bet - current_contribution:
                    # Create side pot for the amount above what the all-in player could call
                    self.create_side_pot(current_contribution + call_amount)
            
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
            total_needed = min(amount - current_contribution, player.chips)
            
            player.chips -= total_needed
            self.pots[0].add_chips(total_needed, self.current_player_idx)
            self.current_bet = current_contribution + total_needed
            self.street_contributions[self.current_player_idx] += total_needed
            self.last_bettor_idx = self.current_player_idx
            self.min_raise = total_needed - self.current_bet
            
            if player.chips == 0:
                self.all_in_players.add(self.current_player_idx)
                
        self.move_to_next_player()
        return self.is_betting_round_complete()
        
    def move_to_next_player(self):
        original_idx = self.current_player_idx
        while True:
            self.current_player_idx = (self.current_player_idx + 1) % 6
            if self.players[self.current_player_idx].is_active:
                break
            if self.current_player_idx == original_idx:
                break
                
    def is_betting_round_complete(self) -> bool:
        active_players = self.get_active_players()
        non_allin_players = [p for p in active_players if self.players.index(p) not in self.all_in_players]
        
        if len(active_players) == 1:
            return True
        
        if len(non_allin_players) <= 1:
            return True

        first_to_act = None
        if self.current_stage != GameStage.PREFLOP:
            idx = (self.button_position + 1) % 6
            while first_to_act is None:
                if self.players[idx].is_active and idx not in self.all_in_players:
                    first_to_act = idx
                idx = (idx + 1) % 6
        else:
            first_to_act = (self.button_position + 3) % 6 
        
        bb_pos = (self.button_position + 2) % 6
        
        if self.current_bet == 0:
            return (self.current_player_idx == first_to_act and 
                    all(self.street_contributions[i] >= 0 for i in range(6) 
                        if self.players[i].is_active and i not in self.all_in_players))
        else:
            all_matched = all(self.street_contributions[i] == self.current_bet 
                            for i in range(6) 
                            if self.players[i].is_active and i not in self.all_in_players)
            
            if (self.current_stage == GameStage.PREFLOP and 
                self.current_bet == self.big_blind and 
                self.players[bb_pos].is_active and
                bb_pos not in self.all_in_players and
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
        total_pot = self.get_total_pot()
        print(f"Total pot: {total_pot}")
        
        active_players = self.get_active_players()
        if len(active_players) == 1:
            winner = active_players[0]
            winner_idx = self.players.index(winner)
            print(f"\nWinner: {winner.name}")
            # Award all pots to the single remaining player
            for i, pot in enumerate(self.pots):
                pot_name = "Main pot" if i == 0 else f"Side pot {i}"
                print(f"{winner.name} wins {pot.amount} chips from {pot_name}")
                winner.chips += pot.amount
        else:
            print("\nShowdown required!")
            # Show all hands first
            for player in active_players:
                cards = " ".join(str(card) for card in player.pocket)
                print(f"{player.name}'s hand: {cards}")
            
            # Determine winners for each pot
            for i, pot in enumerate(self.pots):
                pot_name = "Main pot" if i == 0 else f"Side pot {i}"
                print(f"\n{pot_name} ({pot.amount} chips)")
                
                # Get eligible players for this pot
                eligible_players = [p for p in active_players 
                                if self.players.index(p) in pot.eligible_players]
                
                if len(eligible_players) == 0:
                    print("No eligible players for this pot!")
                    continue
                    
                if len(eligible_players) == 1:
                    winner = eligible_players[0]
                    print(f"{winner.name} wins {pot.amount} chips")
                    winner.chips += pot.amount
                else:
                    # Here you would add logic to determine the best hand
                    # For now, we'll just show the eligible players
                    print("Eligible players:")
                    for player in eligible_players:
                        print(f"- {player.name}")
                    # TODO: Implement hand comparison logic
                    # For now, give it to the first eligible player
                    winner = eligible_players[0]
                    print(f"[Placeholder] {winner.name} wins {pot.amount} chips")
                    winner.chips += pot.amount
                
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
        
        for i, pot in enumerate(self.pots):
            pot_name = "Main Pot" if i == 0 else f"Side Pot {i}"
            eligible_players = ", ".join(self.players[idx].name for idx in pot.eligible_players)
            summary.append(f"{pot_name}: {pot.amount} (Eligible: {eligible_players})")
            
        summary.append(f"Current bet: {self.current_bet}")
        
        if self.community_cards:
            community = " ".join(str(card) for card in self.community_cards)
            summary.append(f"Community cards: {community}")
            
        summary.append("\nPlayers:")
        for i, player in enumerate(self.players):
            position = self.get_player_position(i)
            pocket = " ".join(str(card) for card in player.pocket) if player.pocket else "XX"
            status = "All-in" if i in self.all_in_players else ("Active" if player.is_active else "Folded")
            player_info = f"{player.name} ({position}): {pocket} - Chips: {player.chips} - {status}"
            summary.append(player_info)
            
        return "\n".join(summary)
    
players = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"]
game = TexasHoldem(players)
game.play_hand()
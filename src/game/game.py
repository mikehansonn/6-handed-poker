from enum import Enum
from typing import List, Optional
from .player import Player
from .status import Status
from .deck import Deck
import random
from .evaluator import HandEvaluator
import os
import time

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
    def __init__(self, player_names: List[str], player_controllers: Optional[List[object]] = None, starting_chips: int = 1000):
        if len(player_names) != 6:
            raise ValueError("Texas Hold'em requires exactly 6 players")
        

        # Default: all humans if no controllers provided
        if player_controllers is None:
            player_controllers = [None] * 6
        if len(player_controllers) != 6:
            raise ValueError("player_controllers must also be length 6")
        
        self.player_controllers = player_controllers
        
        self.deck = Deck()
        self.players = [Player(name, 100) for name in player_names]
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
            player.is_active = Status.ACTIVE

    def get_total_pot(self) -> int:
        return sum(pot.amount for pot in self.pots)
    
    def create_side_pot(self, all_in_amount: int):
        all_in_amounts = []
        for i, player in enumerate(self.players):
            if i in self.all_in_players:
                contribution = self.street_contributions[i]
                if contribution not in all_in_amounts:
                    all_in_amounts.append(contribution)
        all_in_amounts.sort()
        
        old_main_pot = self.pots[0]
        self.pots = [old_main_pot]
        
        prev_amount = 0
        for amount in all_in_amounts:
            new_pot = Pot()
            pot_size = 0
            
            for i, player in enumerate(self.players):
                if player.is_active != Status.FOLDED:
                    player_contribution = min(amount, self.street_contributions[i])
                    if player_contribution > prev_amount:
                        contribution_to_this_pot = player_contribution - prev_amount
                        pot_size += contribution_to_this_pot
                        if self.street_contributions[i] >= amount:
                            new_pot.eligible_players.add(i)
            
            if prev_amount == 0:
                self.pots[0].amount = pot_size
                self.pots[0].eligible_players = new_pot.eligible_players
            else:
                new_pot.amount = pot_size
                if pot_size > 0:
                    self.pots.append(new_pot)
            
            prev_amount = amount
        
        return len(self.pots) > 1

    def get_call_amount(self) -> int:
        player = self.players[self.current_player_idx]
        current_contribution = self.street_contributions[self.current_player_idx]

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
        return [player for player in self.players if player.is_active == Status.ACTIVE]
    
    def get_non_folded_players(self) -> List[Player]:
        return [player for player in self.players if player.is_active != Status.FOLDED]
        
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
                self.create_side_pot(bb_amount)
        
        self.current_bet = max(sb_amount, bb_amount)
        
        self.current_player_idx = (self.button_position + 3) % 6
        self.last_bettor_idx = None
        self.min_raise = self.big_blind
        self.street_contributions = {i: 0 for i in range(6)}
        
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
            player.is_active = Status.FOLDED
            
        elif action == Action.CHECK:
            if self.current_bet != 0:
                raise ValueError("Cannot check when there's a bet")
            self.street_contributions[self.current_player_idx] = 0
                
        elif action == Action.CALL:
            call_amount = self.get_call_amount()
            current_contribution = self.street_contributions[self.current_player_idx]
            
            if call_amount >= player.chips:
                all_in_amount = player.chips
                player.chips = 0
                
                remaining_to_add = all_in_amount
                total_contribution = current_contribution
                
                if self.pots[0].required_amount > 0:
                    main_pot_contribution = min(remaining_to_add, self.pots[0].required_amount - current_contribution)
                    if main_pot_contribution > 0:
                        self.pots[0].add_chips(main_pot_contribution, self.current_player_idx)
                        remaining_to_add -= main_pot_contribution
                        total_contribution += main_pot_contribution
                
                for pot in self.pots[1:]:
                    if remaining_to_add <= 0:
                        break
                    if pot.required_amount > total_contribution:
                        side_pot_contribution = min(remaining_to_add, pot.required_amount - total_contribution)
                        if side_pot_contribution > 0:
                            pot.add_chips(side_pot_contribution, self.current_player_idx)
                            remaining_to_add -= side_pot_contribution
                            total_contribution += side_pot_contribution
                
                if remaining_to_add > 0:
                    self.pots[0].add_chips(remaining_to_add, self.current_player_idx)
                    total_contribution += remaining_to_add
                
                self.street_contributions[self.current_player_idx] = total_contribution
                self.all_in_players.add(self.current_player_idx)
                player.is_active = Status.ALL_IN
                
                if total_contribution < self.current_bet:
                    original_bet = self.current_bet
                    self.create_side_pot(total_contribution)
                    self.current_bet = original_bet
            else:
                player.chips -= call_amount
                self.pots[0].add_chips(call_amount, self.current_player_idx)
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
            to_add = amount - current_contribution
            
            if to_add > player.chips:
                to_add = player.chips
                amount = current_contribution + to_add
            
            if to_add >= player.chips:
                all_in_amount = player.chips
                player.chips = 0
                self.pots[0].add_chips(all_in_amount, self.current_player_idx)
                total_contribution = current_contribution + all_in_amount
                self.street_contributions[self.current_player_idx] = total_contribution
                self.current_bet = total_contribution
                self.all_in_players.add(self.current_player_idx)
                player.is_active = Status.ALL_IN
                self.last_bettor_idx = self.current_player_idx
                
                if total_contribution < amount:
                    original_bet = amount 
                    self.create_side_pot(total_contribution)
                    self.current_bet = original_bet
            else:
                player.chips -= to_add
                self.pots[0].add_chips(to_add, self.current_player_idx)
                self.street_contributions[self.current_player_idx] += to_add
                self.current_bet = amount
                self.last_bettor_idx = self.current_player_idx
                self.min_raise = to_add
                
        self.move_to_next_player()
        return self.is_betting_round_complete()

        
    def move_to_next_player(self):
        original_idx = self.current_player_idx
        while True:
            self.current_player_idx = (self.current_player_idx + 1) % 6
            if self.players[self.current_player_idx].is_active == Status.ACTIVE:
                break
            if self.current_player_idx == original_idx:
                break
                
    def is_betting_round_complete(self) -> bool:
        active_players = self.get_non_folded_players()
        non_allin_players = [p for p in active_players if self.players.index(p) not in self.all_in_players]
        
        if len(active_players) == 1:
            return True
        
        if len(non_allin_players) <= 1 and self.current_bet == 0:
            return True

        first_to_act = None
        if self.current_stage != GameStage.PREFLOP:
            idx = (self.button_position + 1) % 6
            while first_to_act is None:
                if self.players[idx].is_active == Status.ACTIVE and idx not in self.all_in_players:
                    first_to_act = idx
                idx = (idx + 1) % 6
        else:
            first_to_act = (self.button_position + 3) % 6 
        
        bb_pos = (self.button_position + 2) % 6
        
        if self.current_bet == 0:
            return (self.current_player_idx == first_to_act and 
                    all(self.street_contributions[i] >= 0 for i in range(6) 
                        if self.players[i].is_active == Status.ACTIVE and i not in self.all_in_players))
        else:
            all_matched = all(self.street_contributions[i] == self.current_bet 
                            for i in range(6) 
                            if self.players[i].is_active == Status.ACTIVE and i not in self.all_in_players)
            
            if (self.current_stage == GameStage.PREFLOP and 
                self.current_bet == self.big_blind and 
                self.players[bb_pos].is_active == Status.ACTIVE and
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

            # Skip folded players
            if player.is_active == Status.FOLDED:
                self.move_to_next_player()
                continue

            # BOT or HUMAN?
            bot_controller = self.player_controllers[self.current_player_idx]
            if bot_controller is not None:
                # 1) Get the game state as a dict
                game_state = self.get_game_state_json()

                # 2) Ask the bot for a decision
                decision = bot_controller.get_decision(game_state)

                # 3) Validate the decision
                action_str = decision.get("action", "fold")
                amount = decision.get("amount", 0)
                print("\n" + "="*50)
                print(self.get_hand_summary())
                print(f"\nCurrent player: {player.name}")
                print(self.get_betting_info())
                print(f"Available actions: {[a.value for a in self.get_available_actions()]}")
                print(f"Action: {action_str}")
                print(f"Amount bet {amount}")
                time.sleep(15) 
                

                try:
                    action_enum = Action(action_str)
                except ValueError:
                    # If bot's action not recognized, default to fold
                    action_enum = Action.FOLD
                    amount = 0

                # Ensure the action is actually allowed
                if action_enum not in self.get_available_actions():
                    action_enum = Action.FOLD
                    amount = 0

                # Now process the action
                if self.process_action(action_enum, amount):
                    return
            else:
                # HUMAN flow (same as before)
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
        
        self.deal_flop()
        if len(self.get_active_players()) > 1:
            # Flop
            print("\nFlop betting round:")
            self.reset_street_bets()
            self.play_betting_round()
            
        self.deal_turn()
        if len(self.get_active_players()) > 1:
            # Turn
            print("\nTurn betting round:")
            self.reset_street_bets()
            self.play_betting_round()
        
        self.deal_river()
        if len(self.get_active_players()) > 1:
            # River
            print("\nRiver betting round:")
            self.reset_street_bets()
            self.play_betting_round()
            
        # Show results
        print(self.get_game_state_json())
        print("\nHand complete!")
        total_pot = self.get_total_pot()
        print(f"Total pot: {total_pot}")
        
        active_players = self.get_non_folded_players()
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
            if len(active_players) > 1:
                print("\nShowdown!")
                print("\nCommunity cards:", " ".join(str(card) for card in self.community_cards))

                for player in active_players:
                    hand_str = " ".join(str(card) for card in player.pocket)
                    print(f"\n{player.name}'s hole cards: {hand_str}")

                for i, pot in enumerate(self.pots):
                    pot_name = "Main pot" if i == 0 else f"Side pot {i}"
                    print(f"\n{pot_name} ({pot.amount} chips)")

                    eligible_players = [p for p in active_players 
                                    if self.players.index(p) in pot.eligible_players]

                    pot_players = [p if self.players.index(p) in pot.eligible_players else None 
                                for p in self.players]

                    winner_shares, hand_results = HandEvaluator.determine_winners(pot_players, self.community_cards)

                    print("\nHand rankings:")
                    for player in eligible_players:
                        player_idx = self.players.index(player)
                        if player_idx in hand_results:
                            rank, primary, kickers = hand_results[player_idx]
                            hand_desc = HandEvaluator.get_hand_description(rank, primary, kickers)
                            print(f"{player.name}: {hand_desc}")

                    print("\nPot awards:")
                    for player_idx, share in winner_shares.items():
                        winner = self.players[player_idx]
                        amount = int(pot.amount * share)
                        winner.chips += amount
                        print(f"{winner.name} wins {amount} chips")
                    print(self.get_hand_summary())
                
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

    def get_game_state_json(self) -> dict:
        game_state = {
            "game_stage": self.current_stage.value,
            "button_position": self.button_position,
            "current_player_idx": self.current_player_idx,
            "current_bet": self.current_bet,
            "small_blind": self.small_blind,
            "big_blind": self.big_blind,
            "min_raise": self.min_raise,
            "last_bettor_idx": self.last_bettor_idx,
            
            "community_cards": [str(card) for card in self.community_cards],
            
            "pots": [{
                "amount": pot.amount,
                "eligible_players": list(pot.eligible_players),
                "required_amount": pot.required_amount
            } for pot in self.pots],
            "total_pot": self.get_total_pot(),
            
            "players": [],
            
            "street_contributions": self.street_contributions,
            "all_in_players": list(self.all_in_players)
        }
        
        for i, player in enumerate(self.players):
            player_info = {
                "name": player.name,
                "position": self.get_player_position(i),
                "chips": player.chips,
                "status": player.is_active.value,
                "pocket_cards": [str(card) for card in player.pocket] if player.pocket else [],
                "current_street_contribution": self.street_contributions[i],
                "is_all_in": i in self.all_in_players
            }
            
            if i == self.current_player_idx:
                player_info.update({
                    "available_actions": [action.value for action in self.get_available_actions()],
                    "call_amount": self.get_call_amount() if Action.CALL in self.get_available_actions() else 0,
                })
                
            game_state["players"].append(player_info)
        
        return game_state
    



if __name__ == "__main__": 

    players = ["Alice", "Bob", "Kevin", "Matt", "Lebron", "Jack"]
    game = TexasHoldem(players)
    game.play_hand()


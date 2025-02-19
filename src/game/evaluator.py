from enum import Enum
from typing import List, Tuple, Dict
from collections import Counter
from itertools import combinations
from card import Card
from player import Player 

class HandRank(Enum):
    HIGH_CARD = 0
    PAIR = 1
    TWO_PAIR = 2
    THREE_OF_A_KIND = 3
    STRAIGHT = 4
    FLUSH = 5
    FULL_HOUSE = 6
    FOUR_OF_A_KIND = 7
    STRAIGHT_FLUSH = 8
    ROYAL_FLUSH = 9

class HandEvaluator:
    @staticmethod
    def evaluate_hand(pocket_cards: List['Card'], community_cards: List['Card']) -> Tuple[HandRank, List[int], List[int]]:
        """
        Evaluates the best possible 5-card hand from the given pocket and community cards.
        Returns a tuple of (HandRank, primary_values, kicker_values)
        """
        all_cards = pocket_cards + community_cards
        best_hand = None
        best_rank = None
        best_primary = []
        best_kickers = []

        # Try all possible 5-card combinations
        for hand in combinations(all_cards, 5):
            rank, primary, kickers = HandEvaluator._evaluate_five_card_hand(list(hand))
            if best_hand is None or HandEvaluator._is_better_hand(rank, primary, kickers, best_rank, best_primary, best_kickers):
                best_hand = hand
                best_rank = rank
                best_primary = primary
                best_kickers = kickers

        return best_rank, best_primary, best_kickers

    @staticmethod
    def _is_better_hand(rank1: HandRank, primary1: List[int], kickers1: List[int],
                       rank2: HandRank, primary2: List[int], kickers2: List[int]) -> bool:
        """Compare two hands and return True if the first hand is better"""
        if rank1.value != rank2.value:
            return rank1.value > rank2.value

        # Compare primary values (e.g., pair values, three of a kind values)
        for v1, v2 in zip(primary1, primary2):
            if v1 != v2:
                return v1 > v2

        # Compare kickers
        for k1, k2 in zip(kickers1, kickers2):
            if k1 != k2:
                return k1 > k2

        return False

    @staticmethod
    def _evaluate_five_card_hand(cards: List['Card']) -> Tuple[HandRank, List[int], List[int]]:
        """Evaluate a specific 5-card hand"""
        values = sorted([card.value for card in cards], reverse=True)
        suits = [card.suit for card in cards]
        
        # Check for flush
        is_flush = len(set(suits)) == 1
        
        # Check for straight
        is_straight = all(values[i] - values[i+1] == 1 for i in range(len(values)-1))
        # Special case for Ace-low straight (A,2,3,4,5)
        if not is_straight and values == [14, 5, 4, 3, 2]:
            is_straight = True
            values = [5, 4, 3, 2, 1]  # Ace becomes low

        # Royal Flush
        if is_flush and values == [14, 13, 12, 11, 10]:
            return HandRank.ROYAL_FLUSH, values, []

        # Straight Flush
        if is_flush and is_straight:
            return HandRank.STRAIGHT_FLUSH, [values[0]], []

        # Count frequencies of values
        value_counts = Counter(values)
        freqs = sorted(((freq, val) for val, freq in value_counts.items()), reverse=True)

        # Four of a Kind
        if freqs[0][0] == 4:
            primary = [freqs[0][1]]
            kickers = [freqs[1][1]]
            return HandRank.FOUR_OF_A_KIND, primary, kickers

        # Full House
        if freqs[0][0] == 3 and freqs[1][0] == 2:
            primary = [freqs[0][1], freqs[1][1]]
            return HandRank.FULL_HOUSE, primary, []

        # Flush
        if is_flush:
            return HandRank.FLUSH, [], values

        # Straight
        if is_straight:
            return HandRank.STRAIGHT, [values[0]], []

        # Three of a Kind
        if freqs[0][0] == 3:
            primary = [freqs[0][1]]
            kickers = sorted([freqs[1][1], freqs[2][1]], reverse=True)
            return HandRank.THREE_OF_A_KIND, primary, kickers

        # Two Pair
        if freqs[0][0] == 2 and freqs[1][0] == 2:
            primary = sorted([freqs[0][1], freqs[1][1]], reverse=True)
            kickers = [freqs[2][1]]
            return HandRank.TWO_PAIR, primary, kickers

        # One Pair
        if freqs[0][0] == 2:
            primary = [freqs[0][1]]
            kickers = sorted([val for val, freq in value_counts.items() if freq == 1], reverse=True)
            return HandRank.PAIR, primary, kickers

        # High Card
        return HandRank.HIGH_CARD, [], values

    @staticmethod
    def get_hand_description(rank: HandRank, primary_values: List[int], kicker_values: List[int]) -> str:
        """
        Returns a human-readable description of the hand.
        """
        value_to_name = {
            14: "Ace",
            13: "King",
            12: "Queen",
            11: "Jack",
            10: "Ten",
            9: "Nine",
            8: "Eight",
            7: "Seven",
            6: "Six",
            5: "Five",
            4: "Four",
            3: "Three",
            2: "Two"
        }

        def values_to_str(values: List[int]) -> str:
            return ", ".join(value_to_name[v] for v in values)

        if rank == HandRank.ROYAL_FLUSH:
            return "Royal Flush"
            
        elif rank == HandRank.STRAIGHT_FLUSH:
            return f"Straight Flush, {value_to_name[primary_values[0]]} high"
            
        elif rank == HandRank.FOUR_OF_A_KIND:
            return f"Four of a Kind, {value_to_name[primary_values[0]]}s with {value_to_name[kicker_values[0]]} kicker"
            
        elif rank == HandRank.FULL_HOUSE:
            return f"Full House, {value_to_name[primary_values[0]]}s full of {value_to_name[primary_values[1]]}s"
            
        elif rank == HandRank.FLUSH:
            return f"Flush, {values_to_str(kicker_values)} high"
            
        elif rank == HandRank.STRAIGHT:
            return f"Straight, {value_to_name[primary_values[0]]} high"
            
        elif rank == HandRank.THREE_OF_A_KIND:
            return f"Three of a Kind, {value_to_name[primary_values[0]]}s with {values_to_str(kicker_values)} kickers"
            
        elif rank == HandRank.TWO_PAIR:
            return f"Two Pair, {value_to_name[primary_values[0]]}s and {value_to_name[primary_values[1]]}s with {value_to_name[kicker_values[0]]} kicker"
            
        elif rank == HandRank.PAIR:
            return f"Pair of {value_to_name[primary_values[0]]}s with {values_to_str(kicker_values)} kickers"
            
        else:  # HIGH_CARD
            return f"High Card, {values_to_str(kicker_values)}"

    @staticmethod
    def determine_winners(players: List['Player'], community_cards: List['Card']) -> Tuple[Dict[int, float], Dict[int, Tuple[HandRank, List[int], List[int]]]]:
        """
        Determine the winner(s) of the hand and their share of the pot.
        Returns:
            - Dictionary mapping player indices to their share of the pot (1.0 for sole winner, 0.5 each for split pot, etc.)
            - Dictionary mapping player indices to their hand evaluation (rank, primary values, kickers)
        """
        player_hands = []
        for i, player in enumerate(players):
            if player:  # Only evaluate hands of players who haven't folded
                result = HandEvaluator.evaluate_hand(player.pocket, community_cards)
                player_hands.append((i, result))

        if not player_hands:
            return {}

        # Find the best hand(s)
        best_hand = max(player_hands, key=lambda x: (x[1][0].value, x[1][1], x[1][2]))
        winners = [ph[0] for ph in player_hands if ph[1] == best_hand[1]]
        
        # Calculate share for each winner
        share = 1.0 / len(winners)
        winner_shares = {winner: share for winner in winners}
        
        # Create dictionary of all player hands
        player_hand_results = {ph[0]: ph[1] for ph in player_hands}
        
        return winner_shares, player_hand_results
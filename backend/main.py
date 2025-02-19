# main.py
from game import TexasHoldem
from bots import LooseLaurenBot  # we can import multiple if needed

def main():
    # Setup players
    player_names = ["Bot1", "Human", "Bot2", "Bot3", "Bot4", "Bot5"]
    # Create your five bots
    bot1 = LooseLaurenBot()
    bot2 = LooseLaurenBot()
    bot3 = LooseLaurenBot()
    bot4 = LooseLaurenBot()
    bot5 = LooseLaurenBot()

    # The last slot is for a human, indicated by None
    controllers = [bot1, None, bot2, bot3, bot4, bot5]

    game = TexasHoldem(
        player_names=player_names,
        player_controllers=controllers  # see earlier code snippet
    )

    while True:
        game.play_hand()
        cont = input("Play another hand? (y/n): ")
        if cont.lower() not in ("y", "yes"):
            break

if __name__ == "__main__":
    main()

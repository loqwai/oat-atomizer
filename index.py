#!/usr/bin/env python3

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation


def draw_equalizer_bars_on_the_screen(bars: list[float]):
    # draw equalizer bars on the screen
    for _bar in bars:
        # draw a bar
        pass


def draw_rectangle(x: float, y: float, width: float, height: float):
    fig, ax = plt.subplots()
    rng = np.random.default_rng(19680801)
    data = np.array([20, 20, 20, 20])
    x = np.array([1, 2, 3, 4])

    artists = []
    colors = ['tab:blue', 'tab:red', 'tab:green', 'tab:purple']
    for i in range(20):
        data += rng.integers(low=0, high=10, size=data.shape)
        container = ax.barh(x, data, color=colors)
        artists.append(container)

    ani = animation.ArtistAnimation(fig=fig, artists=artists, interval=400)
    plt.show()


def create_new_opengl_window():
    # create a new opengl window
    pass


if __name__ == "__main__":
    # generate a milkdrop like visualization
    # and save it to a file
    draw_rectangle(1, 2, 3, 4)

# define Matplotlib figure and axis

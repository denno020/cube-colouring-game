# Cube Colouring Game

A game in which you colour in a cube of spheres.

This game is based on an [existing demo](https://threejs.org/examples/#webgl_instancing_raycast) created by the [ThreeJS team](https://threejs.org).

When I first saw the example, I found it oddly satisfying colouring in all of the spheres. However, I didn't know how many spheres I had coloured in, and as the colours change when the cursor hits it again, it was hard to visually track.

So the idea came from wanting to know when I've coloured in all of the spheres, and I thought I could make a game of it, by timing how long it takes, and provide a simple leader board for the fastest times.

## Getting Started

Clone this repo

```shell
$ git clone git@github.com:denno020/cube-colouring-game.git
```

Install dependencies for web app

```shell
$ yarn install
```

Install dependencies for cloud functions

```shell
$ cd functions/
$ npm ci
```

## Development

Start a local development server

```shell
$ yarn start
```

Start a local development server for firebase function

```shell
$ cd functions/
$ npm run serve
```

_Local development of cloud functions will require the [Firebase CLI](https://firebase.google.com/docs/cli)_


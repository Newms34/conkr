#Conkr - A Risk™ port;

##Contents: 
 - [&#128712;About](#about)
 - [&#128377;Usage](#usage)
 - [&#128421;Server](#server)
 - [&#128202;Technical Stuff](#technical-stuff)
 - [&#128203;Credits](#credits)

#About
It's multiplayer Risk™! With random country generation! Or at least it will be eventually!

##Usage
For now, just look at the pretty countries. Soon there'll actually be stuff to do.

##Server
The server runs on a full JavaScript stack. As of right now, it does *not* use a database, but I'll probably use that eventually to store games in progress

##Technical Stuff
Conkr uses (or *will* use) the following technologies:

 - AngularJS for front-end responsiveness.
 - NodeJS and ExpressJS on the back-end for the server.
 - Websockets, via socket.io, to allow quick communication between the server, phones, and game.
 - HTML5's Canvas.
 - The map itself is generated with something called a [Voronoi Diagram](https://en.wikipedia.org/wiki/Voronoi_diagram). I'm not completely sure how this works, but suffice it to say it produces nice, random shapes.
 - MongoDB for storing currently in-progress games.

##Credits
 - Risk™ is owned by Hasbro. They own the game, and I'm just doin this as an experiment.
 - Conkr was written by me, [Dave](https://github.com/Newms34). 
 - Other various libraries/technologies are from their respective creators. I'm just usin em.

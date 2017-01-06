#Conkr - A Risk™ port;

##Contents: 
 - [&#128712;About](#about)
 - [&#9888;Warning](#warning)
 - [&#128377;Usage](#usage)
 - [&#128421;Server](#server)
 - [&#128202;Technical Stuff](#technical-stuff)
 - [&#128203;Credits](#credits)

#About
It's multiplayer Risk™! With random country generation! Or at least it will be eventually!

##Warning
Please note that Conkr is still very much a work in progress. As such, players should keep two warnings in mind:

 - There will be &#128027; bugs. If something horrible happens, try *not* to panic, and send me a (nice!) message about it.
 - I will likely reset the database numerous times before release, due to updates in models, &#128027; bugs, etc., which will include resets of user accounts, active games, and/or maps. I'll try to do this as *rarely* as possible, but be warned!

#Usage

After you've created an account, you'll be placed in the main game screen. There, you have a number of options:

 - Create a new map &#127758;
 - Load an existing map &#127758;
 - Join a game

Note that, if you're already in a game when you log in, you will not be given these options (though you can still see the options for map &#127758; creation by clicking 'menu' at the top right).

If you've created a game, it will remain 'open', allowing other players to join it, until you close it. For now, as long as a game's open, anyone can join. Eventually, I'll probably give you an option to make private, password-protected games. 

Once you're ready to start a game, click the My Games tab in the menu, and then click "Start Game". Note that this is only available if *you* are the creator of the game. 

Finally, once the game's started, it cycles thru each player in sequence. During your turn, you:

 1. Move armies from one country to an adjacent country that you own during the &#127939; Move phase. Click the starting country, and then the destination country. Note that you *cannot* abandon a country: if the starting country has only 1 army, you'll get told off. Shame on you. Also, right now you can only move to countries that share a border with yours. I plan to make cross-ocean travel possible later.
 2. You'll then begin the &#9876;Attack phase by clicking the green button at bottom.
 3. The &#9876;Attack phase works similarly to the movement phase, except that your target must be an enemy, adjacent country. As in the movement phase, you *must* have at least 2 armies in the attacking country to perform an attack.
 4. If you attack a country and kill off the last enemy army, you counquer that country! One of your armies moves in to take up residence and piss off the locals.

##Server
The server runs on a full JavaScript stack. This includes MongoDB as the database, Express.js as the server software, Angular (1.x) for the front end, and Node.js for the back end. By their powers combined, they form Captain MEAN-stack.

##Technical Stuff
Conkr uses (or *will* use) the following technologies:

 - AngularJS for front-end responsiveness.
 - NodeJS and ExpressJS on the back-end for the server.
 - Websockets, via socket.io, to allow quick communication between the server, phones, and game. They also allow me to send information *from* the server *to* the client without prompting, which is something boring old AJAX doesn't really do. 
 - HTML5's Canvas.
 - The map &#127758; itself is generated with something called a [Voronoi Diagram](https://en.wikipedia.org/wiki/Voronoi_diagram). I'm not completely sure how this works, but suffice it to say it produces nice, random shapes. There's some arcane math things happening in there somewhere.
 - Socket.io for quick chat communication.
 - MongoDB for storing currently in-progress games.

##Credits
 - Risk™ is owned by Hasbro. They own the game, and I'm just doin this as an experiment.
 - Conkr was written by me, [Dave](https://github.com/Newms34). 
 - Other various libraries/technologies are from their respective creators. I'm just using them.

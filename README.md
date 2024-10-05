# Conkr - A Risk™ port;

## Contents: 
 - [&#128712;About](#about)
 - [&#9888;Warning](#warning)
 - [&#128377;Usage](#usage)
 - [&#128421;Server](#server)
 - [&#128202;Technical Stuff](#technical-stuff)
 - [&#128203;Credits](#credits)

# About
It's multiplayer Risk™! With random country generation! Or at least it will be eventually!

## Warning
Please note that Conkr is still very much a work in progress. As such, players should keep two warnings in mind:

 - There will be &#128027; bugs. If something horrible happens, try *not* to panic, and send me a (nice!) message about it.
 - I will likely reset the database numerous times before release, due to updates in models, &#128027; bugs, etc., which will include resets of user accounts, active games, and/or maps. I'll try to do this as *rarely* as possible, but be warned!

# Usage

After you've created an account, you'll be placed in the main game screen. There, you have a number of options:

 - Create a new map &#127758;
 - Load an existing map &#127758;
 - Join a game

Note that, if you're already in a game when you log in, you will not be given these options.

If you've created a game, it will remain 'open', allowing other players to join it, until you close it by clicking "start game". If you want, you can also give your game a password to make it private.

Once you're ready to start a game, click the My Games tab in the menu, and then click "Start Game". Note that this is only available if *you* are the creator of the game. 

Finally, once the game's started, it cycles thru each player in sequence. During your turn, you:

 1. Move armies from one country to an adjacent country that you own during the &#127939; Move phase. Click the starting country, and then the destination country. Note that you *cannot* abandon a country: if the starting country has only 1 army, you'll get told off. Shame on you. 
 2. You'll then begin the &#9876;Attack phase by clicking the green button at bottom.
 3. The &#9876;Attack phase works similarly to the movement phase, except that your target must be an enemy, adjacent country. As in the movement phase, you *must* have at least 2 armies in the attacking country to perform an attack. When attacking, your attack takes into account the terrain of the target region as follows:

  ### Normal Regions
  - **Plains:** Due to the plains' largely open nature, the offensive army has an advantage here, while the defending army has nowhere to hide. Bonus to &#128481; offense, &#128065; visible armies.
  - **Swamp:** The boggy nature of the swamp causes difficulty for the attacking army. However, the defending army has to contend with the noxious swamp gas, which can overwhelm an army. Bonus to &#128737; defense, &#128065; visible armies, &#9760; swamp gas.
  - **Forest:** The dappled light of the forest makes life equally difficult for both attacking and defending armies. While it allows the defending army to hide their numbers, there's a small chance that the forest beasts may not appreciate your presence. &#10006; No visible armies, &#128059; animal attacks.
  - **City:** The close-quarters fighting, civilian casualties, and plethora of glass in the city means the attacking army has an advantage. However, the defending army can hide some of their troops in the surrounding buildings. In addition, the local residents may choose to defend their homes, adding to the defender's armies! Bonus to &#128481; offense, &#10006; no visible armies, &#128587; recruiting.
  - **Hills:** These natural fortresses give the defending army an advantage. In addition, the twisting steep canyons allow said defending army to hide their numbers. Bonus to &#128737; defense, &#10006; no visible armies.

  ### Frozen Regions &#10052;
  - **Tundra:** The frozen version of Plains. As with Plains, there's not really anywhere to hide. Bonus to &#128481; offense, &#128065; visible armies, &#10052; cold weather.
  - **Frozen Swamp:** Frozen version of the Swamp. Beware of swamp gas! Bonus to &#128737; defense, &#128065; visible armies, &#9760; swamp gas, &#10052; cold weather.
  - **Boreal Forest:** Frozen version of the Forest. You'll have to contend both with animal attacks and the frigid weather here. &#10006; No visible armies, &#128059; animal attacks, &#10052; cold weather.
  - **Frozen City:** Frozen version of the City. Who would build a city here? It's freezing! Bonus to &#128481; offense, &#10006; no visible armies, &#128587; recruiting, &#10052; cold weather.
  - **Mountain:** Frozen version of Hills. Still nice and cozy and defend-y, but this time you'll need a warm coat. Bonus to &#128737; defense, &#10006; no visible armies, &#10052; cold weather.
 4. If you attack a country and kill off the last enemy army, you conquer that country! Your armies move in to take up residence and piss off the locals.
    - You *must* move the number of armies you attacked with into the new country. So if you attacked with 3 armies, you'll need to move 3 armies from the attacking country into the new one.
 5. The end of the game occurs under two circumstances, relative to each player:
  - If you conquer all countries, congrats, you win! And... nothing happens. So far. Eventually, each win will give a player a score point, and you can brag to your friends about how much you pwned them.
  - If the last of your countries is conquered, you lose! You'll still be able to watch (and say rude things about) your enemies, but you can no longer influence the battle. Except, you know, by like psychological warfare.

## Server
The server runs on a full JavaScript stack. This includes MongoDB as the database, Express.js as the server software, Angular (1.x) for the front end, and Node.js for the back end. By their powers combined, they form Captain MEAN-stack.

## Technical Stuff
Conkr uses the following technologies:

 - AngularJS for front-end responsiveness.
 - NodeJS and ExpressJS on the back-end for the server.
 - Websockets, via socket.io, to allow quick communication between the server, phones, and game. They also allow me to send information *from* the server *to* the client without prompting, which is something boring old AJAX doesn't really do. 
 - HTML5's Canvas. I'm (probably stupidly) storing the maps' actual appearance as dataurls in MongoDB, which allows me to then pull up the map without having to explicitly recalculate it each time.
 - The map &#127758; itself is generated with something called a [Voronoi Diagram](https://en.wikipedia.org/wiki/Voronoi_diagram). I'm not completely sure how this works, but suffice it to say it produces nice, random shapes. There's some arcane math things happening in there somewhere.
 - MongoDB for storing currently all the things! That's maps &#127758;, games, and people (or at least their accounts. People are too much data).

## Credits
 - Risk™ is owned by Hasbro. They own the game, and I'm just doin this as an experiment.
 - Conkr was written by me, [Dave](https://github.com/Newms34). 
 - Other various libraries/technologies are from their respective creators. I'm just using them.
 - As usual, if you see something that's yours, and you don't want me to use it, let me know!

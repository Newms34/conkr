const hints = [{
    txt: 'Login or Register to get started!',
    bottom: 20,
    point: 'log-btn'
}, {
    txt: 'Wanna chat with other players? Click here!',
    bottom: 30,
    point: 'chat-btn'
}, {
    txt: 'Let&rsquo;s start by making a new map! Pick an average number of countries and a smoothing amount, and then click here.',
    bottom: 30,
    point: 'make-map'
}, {
    txt: 'Go ahead and start a new game. Feel free to set a password if you want!',
    bottom: 30,
    point: 'start-new-game-btn'
}, {
    txt: 'Your friends can join your game by clicking here, and then clicking the "Join Game" button. Note: You won&rsquo;t be able to join any games, since you&rsquo;re in one!',
    bottom: 30,
    point: 'load-game-tab'
}, {
    txt: 'Now click the Menu button to get back to main menu.',
    bottom: 30,
    point: 'men-butt'
}, {
    txt: 'Once you&rsquo;re ready to start, click My Games, and then click Start Game.',
    bottom: 30,
    point: 'my-games-tab'
}, {
    txt: 'This is the play field. Right now, you&rsquo;re in Move Mode. In this mode, you can move your armies between occupied countries. You can move as many armies as you want, as long as the origin and destination countries share a border, <i>and</i> the origin country contains more than one (1) army. You can also attack across one ocean block.',
    bottom: 30,
    point: 'game-parts'
}, {
    txt: 'Once you&rsquo;re done, click here to begin Attack Mode.',
    bottom: 30,
    point: 'move-mode-btn'
}, {
    txt: 'You&rsquo;re now in Attack Mode! Click one of your armies, and then click another player in an adjacent country. Click Attack, and you&rsquo;ll be prompted for how many armies you wish to involve in the attack. As in Move Mode, you must have at least two armies in order to attack, and your armies must share a border with the target country!',
    bottom: 30,
    point: 'game-parts'
}, {
    txt: 'Once you&rsquo;re done laying waste to those foolish enough to stand in your way, click here to let the next player go. Keep in mind that before their turn, each player will be given additional armies based on how many territories they own.',
    bottom: 30,
    point: 'end-turn-btn'
}];
const remHint = function(f,cb) {
    var bg = document.querySelector('#hint-bg-div');
    if (f) localStorage.conkrHints = hints.length;
    bg.parentNode.removeChild(bg);
    if(typeof cb == 'function') cb();
}
const hintMaker = function(n,cb) {
    if (localStorage.conkrHints && parseInt(localStorage.conkrHints) >= (n + 1)) {
        if(typeof cb=='function'){
            cb();
        }
        return;
    }
    var bgDiv = document.createElement('div'),
        hintDiv = document.createElement('div'),
        leftPoint = document.querySelector('#' + hints[n].point).offsetLeft,
        topPoint = document.querySelector('#' + hints[n].point).offsetTop,
        pntr = document.createElement('div');
    hintDiv.innerHTML = '<h3>&#128161; Hint</h3>' + hints[n].txt + '<hr/><small><input type="checkbox" id="no-more-hints"> No more hints, please!</small><hr/><button class="btn btn-primary" id="close-hint" onclick="remHint()">Got it!</button>';
    hintDiv.className = 'hint-msg';
    hintDiv.style.top = hints[n].bottom + '%';
    hintDiv.onclick = function(e) {
        e.stopPropagation();
    }
    bgDiv.onclick = function(){
    	remHint(document.querySelector('#no-more-hints').checked,cb)
    };
    bgDiv.className = 'hint-bg';
    bgDiv.style.height = window.outerHeight+'px';
    bgDiv.id = 'hint-bg-div';
    bgDiv.append(hintDiv);
    document.body.append(bgDiv);
    var pntrLen = Math.sqrt(Math.pow(Math.abs(leftPoint - hintDiv.offsetLeft),2)+Math.pow(Math.abs(topPoint - hintDiv.offsetTop),2));
    pntr.style.width = pntrLen+'px';
    pntr.className = 'hint-pointer';
    var amt = Math.asin((topPoint-hintDiv.offsetTop)/pntrLen)*180/Math.PI;
    if(leftPoint<hintDiv.offsetLeft) amt=180-amt;
    pntr.style.transform = 'rotate('+amt+'deg)';
    hintDiv.append(pntr);
    var arrowDiv = document.createElement('div');
    arrowDiv.className = 'hint-pnt-arrow';
    pntr.append(arrowDiv);
    document.querySelector('#hint-bg-div div.hint-msg button').onclick = function(e){
        e.stopPropagation();
    	remHint(document.querySelector('#no-more-hints').checked,cb)
    }
    localStorage.conkrHints = n+1;
};

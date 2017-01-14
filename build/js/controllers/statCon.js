app.controller('statCon', function($scope, miscFact) {
    $scope.pStats = [];

    //this prevents us from closing the stats window by clicking INSIDE the window
    document.querySelector('#stat-main').onclick = function(e) {
        e.stopPropagation();
    };
    $scope.getScores = function() {
        miscFact.getAllUsers().then(function(r) {
            r = r.sort((a, b) => {
                return a.totalScore - b.totalScore;
            });
            console.log('Users:', r);
            var currPlace = 1,
                prevScore = r[0].totalScore,
                currPlayers=[];
            r.forEach((pl) => {
                if (pl.totalScore < prevScore) {
                    //new score. Push in old rank
                    $scope.pStats.push({
                        names:currPlayers.join(','),
                        place:currPlace,
                        score:prevScore
                    });
                    currPlayers=[];
                    currPlace++;
                    prevScore = pl.totalScore;
                }
                currPlayers.push(pl.name);
            });
            //push in the last one!
            $scope.pStats.push({
                        names:currPlayers.join(', '),
                        place:currPlace,
                        score:prevScore
                    });
        });
    };
    socket.on('newScores', function(r) {
        $scope.getScore();
    });
    $scope.getScores();
});

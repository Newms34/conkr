var app = angular.module('conkr', []).controller('conkrcon', function($scope, fightFact,mapFact) {
    $scope.win = {
        w: $(window).width() * 0.95,
        h: $(window).height() * 0.95
    };
    $scope.gameCreateLoad = true;
    $scope.gameSettingsPanel = 0;
    $scope.numCountries = 20;
    $scope.map = mapFact.GetVoronoi($scope.win.h,$scope.win.w,$scope.numCountries);
    $scope.newMap = function(){
        var smootz =101-$scope.smoothing,numZones = Math.round($scope.numCountries/0.3);
        $scope.map = mapFact.GetVoronoi($scope.win.h,$scope.win.w,numZones,smootz);
        $scope.map.init();
        $scope.gameCreateLoad = false;
    };
    $scope.avgCounInfo = function(){
        bootbox.alert('Because of how the map is generated, the actual number of countries may or may not be exactly the number here.');
    };
});

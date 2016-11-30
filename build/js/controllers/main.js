var socket = io();
var app = angular.module('conkr', []).controller('conkrcon', function($scope, chatFact,mapFact) {
    $scope.win = {
        w: $(window).width() * .95,
        h: $(window).height() * .95
    }
    $scope.numCountries = 20;
    $scope.map = mapFact.GetVoronoi($scope.win.h,$scope.win.w,$scope.numCountries);
    $scope.newMap = function(){
        var smootz =101-$scope.smoothing,numZones = Math.round($scope.numCountries/.3);
        $scope.map = mapFact.GetVoronoi($scope.win.h,$scope.win.w,numZones,smootz);
        $scope.map.init();
        
    }
    $scope.newMap();//render an initial default map @ 20 countries
});

var app = angular.module('conkr', []).controller('chatController',function($scope,mapFact){
	$scope.msgs = [];
	$scope.user = null;
	$scope.msgInp = '';
	miscFact.getUsr().then(function(r){
		if(!r.data||r.data=='none'){
			throw new Error('User not found or not logged in!')
		}else{
			$scope.user = r.data;
		}
	})
	socket.on('newMsg',function(msg){
		if($scope.msgs.length>10){
			$scope.msgs.shift();
		}
		$scope.msgs.push(msg)
	})
	$scope.sendMsg = function(){
		socket.emit('sendMsg',{msg:$scope.msgInp,usr:$scope.user});
	}
})
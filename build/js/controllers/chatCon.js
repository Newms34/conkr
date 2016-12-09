var app = angular.module('conkr', ['ngSanitize']).controller('chatController', function($scope, mapFact, miscFact) {
	$scope.prevSent = [];
    $scope.msgs = [{
    	now:new Date().toLocaleTimeString(),
    	usr:'system',
    	msg:'Welcome to Conkr! chat. Type /inv to switch color modes, or /time to toggle timestamp.'
    }];
    $scope.user = null;
    $scope.msgInp = '';
    miscFact.getUsr().then(function(r) {
        if (!r.data || !r.data.name) {
            throw new Error('User not found or not logged in!');
        } else {
            $scope.user = r.data.name;
        }
    });
    socket.on('newMsg', function(msg) {
        msg.now = new Date().toLocaleTimeString();
        // if ($scope.msgs.length>1 && !$scope.maxMsg)
        if ($scope.msgs.length > 8) {
            $scope.msgs.shift();
        }
        $scope.msgs.push(msg);
        console.log($scope.msgs);
        $scope.$digest();
        $('.chat-cont').scrollTop(parseInt($('.chat-cont').height()));
    });
    $scope.sendMsg = function() {
        if ($scope.msgInp == '/time') {
            $scope.timeStamp = !$scope.timeStamp;
        } else if ($scope.msgInp == '/inv') {
        	$scope.invCol = !$scope.invCol;
        } else if($scope.msgInp===''){
            return false;
        }else {
            socket.emit('sendMsg', { msg: $scope.msgInp, usr: $scope.user });
        }
        $scope.prevSent.push($scope.msgInp);
        $scope.currPrevMsg = $scope.prevSent.length;
        $scope.msgInp = '';
        $('#msgInp').focus();
    };
    document.querySelector('#msgInp').addEventListener('keyup',function(e){
    	//38 == up, 40==down
    	if (e.which==38){
    		e.preventDefault();
    		if($scope.prevSent.length && $scope.currPrevMsg>0){
    			$scope.currPrevMsg--;
    			$scope.msgInp = $scope.prevSent[$scope.currPrevMsg];
    		}
    		$scope.$digest();
    	}else if(e.which==40){
    		e.preventDefault();
    		if($scope.prevSent.length && $scope.currPrevMsg<$scope.prevSent.length-1){
    			$scope.currPrevMsg++;
    			$scope.msgInp = $scope.prevSent[$scope.currPrevMsg];
    		}
    		$scope.$digest();
    	}else if(e.which==27){
    		e.preventDefault();
    		$scope.currPrevMsg = $scope.prevSent.length;
    		$scope.msgInp = '';
    		$scope.$digest();
    	}
    });
});
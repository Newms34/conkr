const app = angular.module('conkr', ['ngSanitize','ui.bootstrap.contextMenu']).controller('chatController', function($scope, mapFact, miscFact) {
	$scope.prevSent = [];
    $scope.msgs = [{
    	now:new Date().toLocaleTimeString(),
    	usr:'system',
    	msg:'Welcome to Conkr! chat. "/inv": toggle color modes, "/time": toggle timestamp, "/l": switch to local chat (only works if you\'re in a game!), "/a": switch to all chat',
        local:false
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
        if ($scope.msgs.length > 8) {
            $scope.msgs.shift();
        }
        $scope.msgs.push(msg);
        $scope.$digest();
        console.log('new message',msg)
        if(!$scope.$parent.$parent.showChat){
            $('#chat-btn').addClass('chat-blink btn-lg');
            setTimeout(function(){
                $('#chat-btn').removeClass('chat-blink btn-lg');
            },250)
        }
        $('.chat-cont').scrollTop(parseInt($('.chat-cont').height()));
    });
    $scope.sendMsg = function() {
        if ($scope.msgInp == '/time') {
            $scope.timeStamp = !$scope.timeStamp;
        } else if ($scope.msgInp == '/inv') {
        	$scope.invCol = !$scope.invCol;
        }else if($scope.msgInp == '/l' && $scope.$parent.gameId){
            $scope.chatLocal = true;
        }else if($scope.msgInp == '/l' && !$scope.$parent.gameId){
            // do nothin
        }else if($scope.msgInp == '/a'){
            $scope.chatLocal = false;
        }else if($scope.msgInp===''){
            return false;
        }else {
            socket.emit('sendMsg', { msg: $scope.msgInp, usr: $scope.user, local:!!$scope.$parent.gameId && $scope.chatLocal});
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
    $scope.switchTabs = function(dir){
        console.log($scope.$parent.gameId);
        $scope.chatLocal = !!$scope.$parent.gameId && parseInt(dir);
    };
});
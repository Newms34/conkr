app.factory('miscFact', function($rootScope, $http) {
    return {
        getUsr: function() {
            return $http.get('/user/currUsrData').then(function(r){
            	return r;
            })
        },
        chkLoggedStatus:function(){
        	return $http.get('/user/chkLog').then(function(r){
            	return r;
            })
        },
        checkUnDup: function(u){
        	return $http.get('/user/nameOkay/'+u).then(function(r){
        		return r;
        	})
        },
        regNewUsr:function(u,p){
        	return $http.post('/user/new',{user:u,password:p}).then(function(r){
        		return r;
        	})
        },
        login:function(u,p){
        	return $http.post('/user/login',{user:u,password:p}).then(function(r){
        		return r;
        	})
        },
        logout:function(u,p){
        	return $http.get('/user/logout',{user:u,password:p}).then(function(r){
        		return r;
        	})
        }
    };
});

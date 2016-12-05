app.controller('loginCont', function($scope, miscFact) {
    $scope.logMode = true;
    $scope.pwdStren = 0;
    $scope.passGud = {
        len: 0,
        caps: false,
        lower: false,
        num: false,
        symb: false,
        badWrd: false,
        sameUn: false
    };
    $scope.dupUn = false;
    $scope.checkDupUn = function() {
        if (!$scope.regUser) return false;
        miscFact.checkUnDup($scope.regUser).then(function(r) {
            $scope.dupUn = r.data == 'bad';
        });
    }
    $scope.getPwdStren = function() {
        //how stronk is pwrd?
        var str = 0,
            pwd = $scope.regPwdOne,
            badWrds = ['password', 'pass', '123', 'abc', 'admin'];
        $scope.passGud = {
            len: 0,
            caps: false,
            lower: false,
            num: false,
            symb: false,
            badWrd: false,
            sameUn: false
        };
        if (pwd.length > 16) {
            str += 8;
            $scope.passGud.len = 16;
        } else if (pwd.length > 12) {
            str += 6;
            $scope.passGud.len = 12;
        } else if (pwd.length > 8) {
            str += 4;
            $scope.passGud.len = 8;
        } else if (pwd.length > 4) {
            str += 2;
            $scope.passGud.len = 4;
        } else {
            $scope.passGud.len = false;
        }
        //now particular symbols
        if (pwd.match(/[A-Z]/)) {
            str += 1;
            $scope.passGud.caps = true;
        }
        if (pwd.match(/[a-z]/)) {
            str += 1;
            $scope.passGud.lower = true;
        }
        if (pwd.match(/[0-9]/)) {
            str += 1;
            $scope.passGud.num = true;
        }
        if (pwd.match(/!|@|#|\$|%|\/|\\|\^|&|\*|-|_/)) {
            str += 1;
            $scope.passGud.symb = true;
        }
        badWrds.forEach((w) => {
            if (str > 1 && pwd.indexOf(w) > -1) {
                //penalty for really common words.
                str -= 2;
                $scope.passGud.badWrd = true;
            }
        });
        if ($scope.regUser == pwd && str > 2) {
            str -= 3;
            $scope.passGud.sameUn = true;
        }
        console.log(pwd, str, 'out of 12 is ', 100 * str / 12)
        $scope.pwdStren = str;
        console.log('ang var now', $scope.pwdStren)
    }

    // ${$scope.passGud.len>3?'&#10003;':'&#10007;'}
    $scope.explPwd = function() {
        bootbox.alert(`<h4>Password Strength</h4>Password Criteria:<ul class='pwd-list'><li><span id='pwd-len-btn' style='background:hsl(${120*($scope.passGud.len)/16},100%,40%);'></span> ${!$scope.passGud.len?'Less than 4':'At least '+$scope.passGud.len} characters}</li><li>${$scope.passGud.caps?'&#10003;':'&#10007;'} Contains a capital letter</li><li>${$scope.passGud.lower?'&#10003;':'&#10007;'} Contains a lowercase letter</li><li>${$scope.passGud.num?'&#10003;':'&#10007;'} Contains a number</li><li>${$scope.passGud.symb?'&#10003;':'&#10007;'} Contains a non-alphanumeric symbol (i.e., '@', or '#')</li><li>${!$scope.passGud.badWrd?'&#10003;':'&#10007;'} Does <i>not</i> contain any common sequences, like 'abc' or '123' or 'password'.</li><li>${!$scope.passGud.sameUn?'&#10003;':'&#10007;'} Is <i>not</i> the same as your username.</li></ul>`);
    };
    $scope.newUsr = function() {
        miscFact.regNewUsr($scope.regUser, $scope.regPwdOne).then(function(r) {
            if (r.data == 'DUPLICATE') {
                bootbox.alert('Uh oh! Something went horribly wrong!');
            } else {
                //auto-login;
                miscFact.login($scope.regUser, $scope.regPwdOne).then(function(d) {
                    if (d.data == 'no') {
                        bootbox.alert('Login error: please check your username and/or password');
                    } else {
                        bootbox.alert('Welcome back!')
                    }
                })
            }
        })
    }
    $scope.log = function() {
        miscFact.login($scope.logUsr, $scope.logPwd).then(function(d) {
            if (d.data == 'no') {
                bootbox.alert('Login error: please check your username and/or password');
            } else {
                window.location.assign('../')
            }
        })
    }
})

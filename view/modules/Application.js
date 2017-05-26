//TO_READ [2016-10-15] : Angular err / debug if DOM storage is disabled

//This is THE app module. ALL DEPENDz modules are loaded here,
//thus no need to explicitly load at each module's definition
const app = angular.module('trade_reskew',
        ['reskewDOMStorage',
         'reskewLogin',
         'reskewMenuXpoint',
         'reskewMenuXdate',
         'reskewMenuXpect',
         'reskewMenuXpectXdate',
         'reskewXpect',
         'reskewXpoint',
        'reskewXpricing']);


app.controller('studyController', ['$scope', function ($scope) {
    //Requires controller as
    this.r = 100;
    $scope.rad = 40;
}]);

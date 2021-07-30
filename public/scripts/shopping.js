/**
 * Created by Fabian on 31.07.2021.
 */

"use strict";

angular.module('Shopping', ['Values'])
    .controller('shopping', ['$scope', function($scope) {
        $scope.list = [];
    }]);
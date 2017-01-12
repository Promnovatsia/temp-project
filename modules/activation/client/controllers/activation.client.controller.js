(function () {
    'use strict';

    angular
        .module('activation')
        .controller('ActivationController', ActivationController);
    ActivationController.$inject = ['$scope', '$location', 'activation'];

    function ActivationController($scope, $location, activation) {

        $scope.activations = activation;
        $scope.activation = activation;

        $scope.pseudopay = function (isValid) {
            $scope.error = null;

            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'articleForm');
                return false;
            }

            $scope.activation.$pseudopay(function () {
                $location.path('activation/confirmed');
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });
        };

        // Remove existing Activation
        $scope.remove = function (activation) {
            if (activation) {
                activation.$remove();
                $location.path('activations');
            } else {
                $scope.activation.$remove(function () {
                    $location.path('activation');
                });
            }
        };

        // Update existing Activation
        $scope.update = function (isValid) {
            $scope.error = null;

            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'articleForm');
                return false;
            }

            $scope.activation.$update(function () {
                $location.path('activation/' + $scope.activation.id);
            }, function (errorResponse) {
                $scope.error = errorResponse.data.message;
            });

        };
    }
}());

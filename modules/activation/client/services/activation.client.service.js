(function () {
    'use strict';

    //Activation service used for communicating with the activations REST endpoints
    angular
        .module('activation')
        .factory('ActivationService', ActivationService);

    ActivationService.$inject = ['$resource'];

    function ActivationService($resource) {
        return $resource('api/activation/:activationId', {
            activationId: '@id'
        }, {
            update: {
                method: 'PUT'
            },
            pseudopay: {
                method: 'GET',
                url: '/api/activation/:activationId/pseudopay',
                params: {
                    activationId: '@id'
                }
            }
        });
    }
}());

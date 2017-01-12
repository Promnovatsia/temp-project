(function () {
    'use strict';

    // Setting up route
    angular
        .module('activation')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('activations', {
                abstract: true,
                url: '/activation',
                template: '<ui-view/>'
            })
            .state('activations.list', {
                url: '',
                controller: 'ActivationController',
                templateUrl: 'modules/activation/client/views/list-activations.client.view.html',
                resolve: {
                    activation: listActivations
                }
            })
            .state('activations.edit', {
                url: '/:activationId/edit',
                controller: 'ActivationController',
                templateUrl: 'modules/activation/client/views/edit-activation.client.view.html',
                resolve: {
                    activation: getActivation
                }
            })
            .state('activations.payment', {
                url: '/pseudo-payment/:activationId',
                controller: 'ActivationController',
                templateUrl: 'modules/activation/client/views/pay-activation.client.view.html',
                resolve: {
                    activation: getActivation
                }
            })
            .state('activations.confirmed', {
                url: '/confirmed',
                controller: 'ActivationController',
                templateUrl: 'modules/activation/client/views/confirmed-activation.client.view.html'
            })
        ;
    }

    listActivations.$inject = ['ActivationService'];
    function listActivations(ActivationService) {
        return ActivationService.query();
    }

    getActivation.$inject = ['$stateParams', 'ActivationService'];
    function getActivation($stateParams, ActivationService) {
        return ActivationService.get(
            {
                activationId: $stateParams.activationId
            }
        );
    }

}());

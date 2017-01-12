'use strict';

// Configuring the activation module
angular.module('activation').run(['Menus',
  function(Menus) {

    Menus.addMenuItem('topbar', {
      title: 'Активации',
      state: 'activations.list',
      roles: ['*']
    });
  }
]);

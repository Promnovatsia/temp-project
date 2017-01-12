'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
  // Init module configuration options
  var applicationModuleName = 'seanjs';
  var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ngMessages', 'ui.router', 'ui.bootstrap', 'ui.utils', 'angularFileUpload'];

  // Add a new vertical module
  var registerModule = function(moduleName, dependencies) {
    // Create angular module
    angular.module(moduleName, dependencies || []);

    // Add the module to the AngularJS configuration file
    angular.module(applicationModuleName).requires.push(moduleName);
  };

  return {
    applicationModuleName: applicationModuleName,
    applicationModuleVendorDependencies: applicationModuleVendorDependencies,
    registerModule: registerModule
  };
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
  function($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    $httpProvider.interceptors.push('authInterceptor');
  }
]);

angular.module(ApplicationConfiguration.applicationModuleName).run(["$rootScope", "$state", "Authentication", function($rootScope, $state, Authentication) {

  // Check authentication before changing state
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.roles && toState.data.roles.length > 0) {
      var allowed = false;

      if (Authentication.user.roles) {
        toState.data.roles.forEach(function(role) {
          if (Authentication.user.roles !== undefined && Authentication.user.roles.indexOf(role) !== -1) {
            allowed = true;
            return true;
          }
        });
      }

      if (!allowed) {
        event.preventDefault();
        if (Authentication.user !== undefined && typeof Authentication.user === 'object') {
          $state.go('forbidden');
        } else {
          $state.go('authentication.signin');
        }
      }
    }
  });

  // Record previous state
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    if (!fromState.data || !fromState.data.ignoreState) {
      $state.previous = {
        state: fromState,
        params: fromParams,
        href: $state.href(fromState, fromParams)
      };
    }
  });
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
  //Fixing facebook bug with redirect
  if (window.location.hash && window.location.hash === '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState('', document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  //Then init the app
  angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('articles');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('chat');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
ApplicationConfiguration.registerModule('core.admin', ['core']);
ApplicationConfiguration.registerModule('core.admin.routes', ['ui.router']);
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('recipes',[]);
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('user', ['core']);
ApplicationConfiguration.registerModule('user.admin', ['core.admin']);
ApplicationConfiguration.registerModule('user.admin.routes', ['core.admin.routes']);
'use strict';

// Configuring the Articles module
angular.module('articles').run(['Menus',
  function(Menus) {
    // Add the articles dropdown item
    /*Menus.addMenuItem('topbar', {
      title: 'Articles',
      state: 'articles',
      type: 'dropdown',
      roles: ['*']
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'articles', {
      title: 'List Articles',
      state: 'articles.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'articles', {
      title: 'Create Articles',
      state: 'articles.create',
      roles: ['user']
    });*/
  }
]);
'use strict';

// Setting up route
angular.module('articles').config(['$stateProvider',
  function($stateProvider) {
    // Articles state routing

    $stateProvider
      .state('articles', {
        abstract: true,
        url: '/articles',
        template: '<ui-view/>'
      })
      .state('articles.list', {
        url: '',
        templateUrl: 'modules/articles/client/views/list-articles.client.view.html'
      })
      .state('articles.create', {
        url: '/create',
        templateUrl: 'modules/articles/client/views/create-article.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('articles.view', {
        url: '/:articleId',
        templateUrl: 'modules/articles/client/views/view-article.client.view.html'
      })
      .state('articles.edit', {
        url: '/:articleId/edit',
        templateUrl: 'modules/articles/client/views/edit-article.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
'use strict';

// Articles controller
angular.module('articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Articles',
  function($scope, $stateParams, $location, Authentication, Articles) {
    $scope.authentication = Authentication;

    // Create new Article
    $scope.create = function(isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      }

      // Create new Article object
      var article = new Articles({
        title: this.title,
        content: this.content
      });

      // Redirect after save
      article.$save(function(response) {
        $location.path('articles/' + response.id);

        // Clear form fields
        $scope.title = '';
        $scope.content = '';
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Article
    $scope.remove = function(article) {
      if (article) {

        article.$remove();
        $location.path('articles');
      } else {
        $scope.article.$remove(function() {
          $location.path('articles');
        });
      }
    };

    // Update existing Article
    $scope.update = function(isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'articleForm');
        return false;
      }

      var article = $scope.article;

      article.$update(function() {
        $location.path('articles/' + article.id);
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list of Articles
    $scope.find = function() {
      $scope.articles = Articles.query();
    };

    // Find existing Article
    $scope.findOne = function() {
      $scope.article = Articles.get({
        articleId: $stateParams.articleId
      });
    };
  }
]);
'use strict';

//Articles service used for communicating with the articles REST endpoints
angular.module('articles').factory('Articles', ['$resource',
  function($resource) {
    return $resource('api/articles/:articleId', {
      articleId: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
'use strict';

// Configuring the Chat module
angular.module('chat').run(['Menus',
  function(Menus) {
    // Set top bar menu items
    /*Menus.addMenuItem('topbar', {
      title: 'Chat',
      state: 'chat'
    });*/
  }
]);
'use strict';

// Configure the 'chat' module routes
angular.module('chat').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider
      .state('chat', {
        url: '/chat',
        templateUrl: 'modules/chat/client/views/chat.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
'use strict';

// Create the 'chat' controller
angular.module('chat').controller('ChatController', ['$scope', '$location', 'Authentication', 'Socket',
  function($scope, $location, Authentication, Socket) {
    // Create a messages array
    $scope.messages = [];

    // If user is not signed in then redirect back home
    if (!Authentication.user) {
      $location.path('/');
    }

    // Make sure the Socket is connected
    if (!Socket.socket) {
      Socket.connect();
    }

    // Add an event listener to the 'chatMessage' event
    Socket.on('chatMessage', function(message) {
      $scope.messages.unshift(message);
    });

    // Create a controller method for sending messages
    $scope.sendMessage = function() {
      // Create a new message object
      var message = {
        text: this.messageText
      };

      // Emit a 'chatMessage' message event
      Socket.emit('chatMessage', message);

      // Clear the message text
      this.messageText = '';
    };

    // Remove the event listener when the controller instance is destroyed
    $scope.$on('$destroy', function() {
      Socket.removeListener('chatMessage');
    });

    // Get the current connected clients
    Socket.on('currentClients', function(count) {
      $scope.currentClients = count;
    });

  }
]);
'use strict';

angular.module('core.admin').run(['Menus',
  function(Menus) {
    Menus.addMenuItem('topbar', {
      title: 'Admin',
      state: 'admin',
      type: 'dropdown',
      roles: ['admin']
    });
  }
]);
'use strict';

// Setting up route
angular.module('core.admin.routes').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider
      .state('admin', {
        abstract: true,
        url: '/admin',
        template: '<ui-view/>',
        data: {
          roles: ['admin']
        }
      });
  }
]);
'use strict';

//Configuering the core module
angular.module('core').run(['Menus',
  function(Menus) {

    /*//Add the contact-us to the menu
    Menus.addMenuItem('topbar', {
      title: 'Contact us',
      state: 'contact-us',
      roles: ['*'] //All users
    });*/

  }
]);
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {

    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'modules/core/client/views/home.client.view.html'
      })
      .state('contact-us', {
        url: '/contact-us',
        templateUrl: 'modules/core/client/views/contact.client.view.html'
      })
      .state('not-found', {
        url: '/not-found',
        templateUrl: 'modules/core/client/views/404.client.view.html',
        data: {
          ignoreState: true
        }
      })
      .state('bad-request', {
        url: '/bad-request',
        templateUrl: 'modules/core/client/views/400.client.view.html',
        data: {
          ignoreState: true
        }
      })
      .state('forbidden', {
        url: '/forbidden',
        templateUrl: 'modules/core/client/views/403.client.view.html',
        data: {
          ignoreState: true
        }
      });
  }
]);

'use strict';

angular.module('core').controller('ContactController', ['$scope', 'ContactForm',
  function($scope, ContactForm) {

    $scope.contact = function(isValid) {
      $scope.error = null;
      $scope.success = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'contactForm');
        return false;
      }

      if (grecaptcha.getResponse() === "") {
        $scope.error = "Please resolve the captcha first!";
      } else {
        var contactForm = new ContactForm({
          name: this.name,
          email: this.email,
          subject: this.subject,
          message: this.message,
          //Get the captcha value and send it to the server for verifing
          grecaptcha: grecaptcha.getResponse()
        });

        $scope.submitButton = "Working...";
        $scope.submitButtonDisabled = true;

        contactForm.$save(function(response) {
          //Reset the reCaptcha
          grecaptcha.reset();
          $scope.success = response.message;
        }, function(errorResponse) {
          console.log('errorResponse', errorResponse);
          //Reset the reCaptcha
          grecaptcha.reset();
          $scope.error = errorResponse.data.message;
        });

        $scope.submitButton = "Send";
        $scope.submitButtonDisabled = false;
      }
    };

  }

]);
'use strict';

angular.module('core').controller('HeaderController', ['$rootScope', '$scope', '$location', '$state', 'Authentication', 'Menus',
  function($rootScope, $scope, $location, $state, Authentication, Menus) {
    // Expose view variables
    $scope.$state = $state;
    $scope.authentication = Authentication;

    // Get the topbar menu
    $scope.menu = Menus.getMenu('topbar');

    // Toggle the menu items
    $scope.isCollapsed = false;
    $scope.toggleCollapsibleMenu = function() {
      $scope.isCollapsed = !$scope.isCollapsed;
    };

    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function() {
      $scope.isCollapsed = false;
      ga('send', 'pageview', $location.path());
    });

  }
]);
'use strict';

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
  function($scope, Authentication) {
    // This provides Authentication context.
    $scope.authentication = Authentication;
  }
]);
'use strict';

/**
 * Edits by Ryan Hutchison
 * Credit: https://github.com/paulyoder/angular-bootstrap-show-errors */

angular.module('core')
  .directive('showErrors', ['$timeout', '$interpolate', function($timeout, $interpolate) {
    var linkFn = function(scope, el, attrs, formCtrl) {
      var inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses,
        initCheck = false,
        showValidationMessages = false,
        blurred = false;

      options = scope.$eval(attrs.showErrors) || {};
      showSuccess = options.showSuccess || false;
      inputEl = el[0].querySelector('.form-control[name]') || el[0].querySelector('[name]');
      inputNgEl = angular.element(inputEl);
      inputName = $interpolate(inputNgEl.attr('name') || '')(scope);

      if (!inputName) {
        throw 'show-errors element has no child input elements with a \'name\' attribute class';
      }

      var reset = function() {
        return $timeout(function() {
          el.removeClass('has-error');
          el.removeClass('has-success');
          showValidationMessages = false;
        }, 0, false);
      };

      scope.$watch(function() {
        return formCtrl[inputName] && formCtrl[inputName].$invalid;
      }, function(invalid) {
        return toggleClasses(invalid);
      });

      scope.$on('show-errors-check-validity', function(event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          initCheck = true;
          showValidationMessages = true;

          return toggleClasses(formCtrl[inputName].$invalid);
        }
      });

      scope.$on('show-errors-reset', function(event, name) {
        if (angular.isUndefined(name) || formCtrl.$name === name) {
          return reset();
        }
      });

      toggleClasses = function(invalid) {
        el.toggleClass('has-error', showValidationMessages && invalid);
        if (showSuccess) {
          return el.toggleClass('has-success', showValidationMessages && !invalid);
        }
      };
    };

    return {
      restrict: 'A',
      require: '^form',
      compile: function(elem, attrs) {
        if (attrs.showErrors.indexOf('skipFormGroupCheck') === -1) {
          if (!(elem.hasClass('form-group') || elem.hasClass('input-group'))) {
            throw 'show-errors element does not have the \'form-group\' or \'input-group\' class';
          }
        }
        return linkFn;
      }
    };
  }]);
'use strict';

//Contact form service
angular.module('core').factory('ContactForm', ['$resource',
  function($resource) {
    return $resource('api/contact', {}, {
      update: {
        method: 'POST'
      }
    });
  }
]);

'use strict';

angular.module('core').factory('authInterceptor', ['$q', '$injector',
  function($q, $injector) {
    return {
      responseError: function(rejection) {
        if (!rejection.config.ignoreAuthModule) {
          switch (rejection.status) {
            case 401:
              $injector.get('$state').transitionTo('authentication.signin');
              break;
            case 403:
              $injector.get('$state').transitionTo('forbidden');
              break;
            case 404:
              $injector.get('$state').transitionTo('not-found');
              break;
          }
        }
        // otherwise, default behaviour
        return $q.reject(rejection);
      }
    };
  }
]);
'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [
  function() {
    // Define a set of default roles
    this.defaultRoles = ['user', 'admin'];

    // Define the menus object
    this.menus = {};

    // A private function for rendering decision
    var shouldRender = function(user) {
      if (!!~this.roles.indexOf('*')) {
        return true;
      } else {
        if (!user) {
          return false;
        }
        for (var userRoleIndex in user.roles) {
          for (var roleIndex in this.roles) {
            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    // Validate menu existance
    this.validateMenuExistance = function(menuId) {
      if (menuId && menuId.length) {
        if (this.menus[menuId]) {
          return true;
        } else {
          throw new Error('Menu does not exist');
        }
      } else {
        throw new Error('MenuId was not provided');
      }

      return false;
    };

    // Get the menu object by menu id
    this.getMenu = function(menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      return this.menus[menuId];
    };

    // Add new menu object by menu id
    this.addMenu = function(menuId, options) {
      options = options || {};

      // Create the new menu
      this.menus[menuId] = {
        roles: options.roles || this.defaultRoles,
        items: options.items || [],
        shouldRender: shouldRender
      };

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenu = function(menuId) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Return the menu object
      delete this.menus[menuId];
    };

    // Add menu item object
    this.addMenuItem = function(menuId, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Push new menu item
      this.menus[menuId].items.push({
        title: options.title || '',
        state: options.state || '',
        type: options.type || 'item',
        class: options.class,
        roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.defaultRoles : options.roles),
        position: options.position || 0,
        items: [],
        shouldRender: shouldRender
      });

      // Add submenu items
      if (options.items) {
        for (var i in options.items) {
          this.addSubMenuItem(menuId, options.state, options.items[i]);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Add submenu item object
    this.addSubMenuItem = function(menuId, parentItemState, options) {
      options = options || {};

      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === parentItemState) {
          // Push new submenu item
          this.menus[menuId].items[itemIndex].items.push({
            title: options.title || '',
            state: options.state || '',
            roles: ((options.roles === null || typeof options.roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : options.roles),
            position: options.position || 0,
            shouldRender: shouldRender
          });
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeMenuItem = function(menuId, menuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        if (this.menus[menuId].items[itemIndex].state === menuItemState) {
          this.menus[menuId].items.splice(itemIndex, 1);
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    // Remove existing menu object by menu id
    this.removeSubMenuItem = function(menuId, submenuItemState) {
      // Validate that the menu exists
      this.validateMenuExistance(menuId);

      // Search for menu item to remove
      for (var itemIndex in this.menus[menuId].items) {
        for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
          if (this.menus[menuId].items[itemIndex].items[subitemIndex].state === submenuItemState) {
            this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
          }
        }
      }

      // Return the menu object
      return this.menus[menuId];
    };

    //Adding the topbar menu
    this.addMenu('topbar', {
      roles: ['*']
    });
  }
]);
'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('Socket', ['Authentication', '$state', '$timeout',
  function(Authentication, $state, $timeout) {
    // Connect to Socket.io server
    this.connect = function() {
      // Connect only when authenticated
      if (Authentication.user) {
        this.socket = io();
      }
    };
    this.connect();

    // Wrap the Socket.io 'on' method
    this.on = function(eventName, callback) {
      if (this.socket) {
        this.socket.on(eventName, function(data) {
          $timeout(function() {
            callback(data);
          });
        });
      }
    };

    // Wrap the Socket.io 'emit' method
    this.emit = function(eventName, data) {
      if (this.socket) {
        this.socket.emit(eventName, data);
      }
    };

    // Wrap the Socket.io 'removeListener' method
    this.removeListener = function(eventName) {
      if (this.socket) {
        this.socket.removeListener(eventName);
      }
    };
  }
]);
'use strict';

// Configuring the Recipes module
angular
    .module('recipes')
    .run(['Menus', function (Menus) {
        
        Menus.addMenuItem('topbar', {
            title: 'Книга рецептов',
            state: 'recipes.list',
            type: 'button',
            roles: ['*']
        });
       /* Menus.addSubMenuItem('topbar', 'recipes', {
            title: 'List Recipes',
            state: 'recipes.list'
        });*/
        /*Menus.addSubMenuItem('topbar', 'recipes', {
            title: 'Create Recipes',
            state: 'recipes.create',
            roles: ['user']
        }); */
        
        Menus.addMenuItem('topbar', {
            title: 'Ингредиенты',
            state: 'ingredients',
            type: 'dropdown',
            roles: ['user']
        });
        Menus.addSubMenuItem('topbar', 'ingredients', {
            title: 'Справочник',
            state: 'ingredients.list',
            roles: ['user']
        });
        Menus.addSubMenuItem('topbar', 'ingredients', {
            title: 'Добавить ингредиент',
            state: 'ingredients.create',
            roles: ['user']
        });
        
        Menus.addMenuItem('topbar', {
            title: 'Хранилище',
            state: 'shelf',
            type: 'dropdown',
            roles: ['user']
        });
        Menus.addSubMenuItem('topbar', 'shelf', {
            title: 'Полки',
            state: 'shelf.list',
            roles: ['user']
        });
        
        Menus.addMenuItem('topbar', {
            title: 'Меню',
            state: 'menu',
            type: 'dropdown',
            roles: ['user']
        });
        Menus.addSubMenuItem('topbar', 'menu', {
            title: '(В разработке) Текущее меню',
            state: 'menu.list',
            roles: ['user']
        });
        
        //admin management
        Menus.addSubMenuItem('topbar', 'admin', {
            title: 'Manage Measures',
            state: 'measures.list',
            roles: ['admin']
        });
        Menus.addSubMenuItem('topbar', 'admin', {
            title: 'Manage Products',
            state: 'products.list',
            roles: ['admin']
        });
    }]);
'use strict';

// Setting up route
angular
    .module('recipes')
    .config(routeConfig);

routeConfig.$inject = ['$stateProvider'];

function routeConfig($stateProvider) {
    $stateProvider
        .state('recipes', {
            abstract: true,
            url: '/recipes',
            template: '<ui-view/>'
        })
        .state('recipes.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/recipes/recipes-list.client.view.html'
        })
        .state('recipes.create', {
            url: '/create',
            templateUrl: 'modules/recipes/client/views/recipes/recipe-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('recipes.view', {
            url: '/:recipeId',
            templateUrl: 'modules/recipes/client/views/recipes/recipe-read.client.view.html'
        })
        .state('recipes.edit', {
            url: '/:recipeId/edit',
            templateUrl: 'modules/recipes/client/views/recipes/recipe-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })

        .state('ingredients', {
            abstract: true,
            url: '/ingredients',
            template: '<ui-view/>'
        })
        .state('ingredients.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/ingredients/ingredients-list.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('ingredients.create', {
            url: '/create',
            templateUrl: 'modules/recipes/client/views/ingredients/ingredient-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('ingredients.view', {
            url: '/:ingredientId',
            templateUrl: 'modules/recipes/client/views/ingredients/ingredient-read.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('ingredients.edit', {
            url: '/:ingredientId/edit',
            templateUrl: 'modules/recipes/client/views/ingredients/ingredient-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })

        .state('measures', {
            abstract: true,
            url: '/measures',
            template: '<ui-view/>'
        })
        .state('measures.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/measures/measures-list.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('measures.create', {
            url: '/create',
            templateUrl: 'modules/recipes/client/views/measures/measure-form.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('measures.edit', {
            url: '/:measureId',
            templateUrl: 'modules/recipes/client/views/measures/measure-form.client.view.html',
            data: {
                roles: ['admin']
            }
        })

        .state('products', {
            abstract: true,
            url: '/products',
            template: '<ui-view/>'
        })
        .state('products.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/products/products-list.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('products.create', {
            url: '/create',
            templateUrl: 'modules/recipes/client/views/products/product-create.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('products.edit', {
            url: '/:productId',
            templateUrl: 'modules/recipes/client/views/products/product-edit.client.view.html',
            data: {
                roles: ['admin']
            }
        })

        .state('menu', {
            abstract: true,
            url: '/menu',
            template: '<ui-view/>'
        })
        .state('menu.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/menus/menus-list.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.create', {
            url: '/create',
            templateUrl: 'modules/recipes/client/views/menus/menu-init.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.init', {
            url: '/:menuId/init',
            templateUrl: 'modules/recipes/client/views/menus/menu-init.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.meals', {
            url: '/:menuId/meals',
            templateUrl: 'modules/recipes/client/views/menus/menu-meals.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.edit', {
            url: '/:menuId/weekplan',
            templateUrl: 'modules/recipes/client/views/menus/menu-weekplan.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.view', {
            url: '/:menuId',
            templateUrl: 'modules/recipes/client/views/menus/menu-read.client.view.html',
            data: {
                roles: ['admin']
            }
        })
        .state('menu.summary', {
            url: '/:menuId/summary',
            templateUrl: 'modules/recipes/client/views/menus/menu-summary.client.view.html',
            data: {
                roles: ['admin']
            }
        })

        .state('shelf', {
            abstract: true,
            url: '/shelf',
            template: '<ui-view/>'
        })
        .state('shelf.list', {
            url: '',
            templateUrl: 'modules/recipes/client/views/shelf/shelf-list.client.view.html',
            data: {
                pageTitle: 'Shelf List'
            }
        })
        .state('shelf.create', {
            url: '/create',
            params: {
                ingredient: null,
            },
            templateUrl: 'modules/recipes/client/views/shelf/shelf-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('shelf.edit', {
            url: '/:shelfId/edit',
            templateUrl: 'modules/recipes/client/views/shelf/shelf-form.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('shelf.view', {
            url: '/:shelfId',
            templateUrl: 'modules/recipes/client/views/shelf/shelf-read.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
    
        .state('shelf.query', {
            url: '/:shelfId/query',
            templateUrl: 'modules/recipes/client/views/shelf/shelf-queries.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
        .state('shelf.queryEdit', {
            url: '/:shelfId/query/:queryId',
            templateUrl: 'modules/recipes/client/views/shelf/shelf-query-edit.client.view.html',
            data: {
                roles: ['user', 'admin']
            }
        })
    ;
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('IngredientsController', IngredientsController);
IngredientsController.$inject = ['$scope', '$stateParams', '$location', '$window', '$timeout', 'Authentication', 'IngredientService', 'MeasureService', 'FileUploader'];
function IngredientsController($scope, $stateParams, $location, $window, $timeout, Authentication, IngredientService, MeasureService, FileUploader) {

    $scope.authentication = Authentication;

    $scope.find = function () {
        IngredientService.query().$promise.then(function (ingredients) {
            $scope.ingredients = ingredients;
        });
    };

    $scope.findOne = function () {
        if ($stateParams.ingredientId) {
            IngredientService.get(
                {
                    ingredientId: $stateParams.ingredientId
                }
            ).$promise.then(function (ingredient) {
                $scope.ingredient = ingredient;
                ingredient.getMeasure().then(function (measure) {
                    $scope.ingredient.measure = measure;
                });
                ingredient.getShelf().then(function (shelf) {
                    if (shelf.id) {
                        $scope.shelf = shelf;
                    }
                });
            });    
        } else {
            $scope.ingredient = new IngredientService();
        }
    };
    
    $scope.getMeasures = function (value) {
        return MeasureService.query().$promise.then(function (results) {
            var matched = [];
            results.forEach(function (item, i, arr) {
                if (item.caption.includes(value)) {
                    matched.push(item);
                }
            });
            return matched;
        });
    };
    
    $scope.setMeasure = function (subMeasure) {
        $scope.ingredient.measureDefault = subMeasure.id;
        $scope.ingredient.measure = subMeasure;
    };
    
    $scope.unsetMeasure = function () {
        $scope.ingredient.measure = null;
        $scope.ingredient.measureDefault = null;
        $scope.asyncSelected = null;
    };
    
    $scope.unsetPicture = function () {
        $scope.ingredient.image = "";
        $scope.uploader.clearQueue();
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');//FIX ingredientForm
            return false;
        }
        
        $scope.ingredient.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('ingredients/' + $scope.ingredient.id);
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };

    var uploader = $scope.uploader = new FileUploader({
        url: '/api/pictures/ingredients'
    });

    $scope.imageurl = 'http://res.cloudinary.com/thomascookbook/image/upload/v1466671927/';

    // FILTERS

    uploader.filters.push(
        {
            name: 'imageFilter',
            fn: function (item, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        },
        {
            name: 'overWriteFilter',
            fn: function(item, options) {
                if(this.queue.length===1){
                    this.clearQueue();
                }
                return true;
            }
        }
    );

        // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(fileItem._file);

            fileReader.onload = function (fileReaderEvent) {
                $timeout(function () {
                    $scope.imageURL = fileReaderEvent.target.result;
                }, 0);
            };
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('IngridientsController', IngridientsController);
IngridientsController.$inject = ['$scope', '$stateParams', '$location', '$window', '$timeout', 'Authentication', 'Recipes', 'Ingridients', 'Measures', 'FileUploader'];
function IngridientsController($scope, $stateParams, $location, $window, $timeout, Authentication, Recipes, Ingridients, Measures, FileUploader) {

    $scope.authentication = Authentication;

    $scope.find = function () {
        $scope.ingridients = Ingridients.query();
    };

    $scope.findOne = function () {
        $scope.ingridient = Ingridients.get(
            {
                ingridientId: $stateParams.ingridientId
            }
        );
    };

    $scope.getMeasuresList = function () {
        return Measures.query().$promise;
    };

    $scope.create = function (isValid) {
        $scope.error = null;

        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'ingridientForm');
            return false;
        }

        // Create new Recipe object

        var ingridient = new Ingridients(
            {
                caption: this.caption,
                infoCard: this.infoCard,
                image: $scope.imageURL,
                measureDefault: $scope.measureDefault
            }
        );

        // Redirect after save
        ingridient.$save(function (response) {
            $location.path('ingridients/' + response.id);

        // Clear form fields
            $scope.caption = '';
            $scope.infoCard = '';
        }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
        });
    };

    $scope.update = function (isValid) {
        $scope.error = null;
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'ingridientForm');
            return false;
        }

        var ingridient = $scope.ingridient;
        ingridient.image = $scope.imageURL;
        ingridient.$update(function () {
            $location.path('ingridients/' + ingridient.id);
        }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
        });
    };

    $scope.remove = function (ingridient) {
        if (ingridient) {
            ingridient.$remove();
            $location.path('ingridients');
        } else {
            $scope.ingridient.$remove(function () {
                $location.path('ingridient');
            });
        }
    };

    var uploader = $scope.uploader = new FileUploader({
        url: '/api/pictures/ingridients'
    });

    $scope.imageurl = 'http://res.cloudinary.com/thomascookbook/image/upload/v1466671927/';

    // FILTERS

    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });

        // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(fileItem._file);

            fileReader.onload = function (fileReaderEvent) {
                $timeout(function () {
                    $scope.imageURL = fileReaderEvent.target.result;
                }, 0);
            };
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MeasuresController', MeasuresController);
MeasuresController.$inject = ['$scope', '$stateParams', '$location', 'Authentication', 'MeasureService'];

function MeasuresController($scope, $stateParams, $location, Authentication, MeasureService) {
        
    $scope.authentication = Authentication;
    $scope.converter = [];
    
    $scope.find = function () {
        $scope.measures = MeasureService.query();
    };

    $scope.findOne = function () {
        if ($stateParams.measureId) {
            MeasureService.get(
                {
                    measureId: $stateParams.measureId
                }
            ).$promise.then(function (measure) {
                $scope.converter = measure.converter || [];
                $scope.measure = measure;
                $scope.uncountable = measure.step === 0;
                if ($scope.converter) {
                    $scope.converter.forEach(function (item, i, arr) {
                        item.index = i;
                    });
                }
            });
        } else {
            $scope.measure = new MeasureService(
                {
                    min: 0,
                    step: 1
                }
            );
        }
    };

    $scope.getMeasures = function (value) {
        return MeasureService.query().$promise.then(function (results) {
            var matched = [];
            results.forEach(function (item, i, arr) {
                if (item.caption.includes(value)) {
                    matched.push(item);
                }
            });
            return matched;
        });
    };
    
    $scope.addSubMeasure = function (subMeasure) {
        $scope.converter.push({
            id: subMeasure.id,
            index: $scope.converter.length,
            caption: subMeasure.caption,
            rate: 1,
            uncountable: subMeasure.step === 0
        });
        $scope.asyncSelected = "";
    };
    
    $scope.removeSubMeasure = function (index) {
        $scope.converter.splice(index, 1);
        $scope.converter.forEach(function (item, i, arr) {
            item.index = i;
        });
    };
    
    $scope.applyStep = function (id, step) {
        if (step <= 0) {
            $scope.uncountable = true;
        }
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'shelfForm');
            return false;
        }
        
        if ($scope.uncountable) {
            $scope.measure.step = 0;
            $scope.converter.forEach(function (item, i, arr) {
                item.rate = 0;
            });
        }
        $scope.measure.converter = $scope.converter;
        
        $scope.measure.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('measures');
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
    
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MenusController', MenusController);
MenusController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'MenuService', 'ShelfQueryService', 'Recipes', 'Measures'];

function MenusController($scope, $stateParams, $location, $window, Authentication, MenuService, ShelfQueryService, Recipes, Measures) {
    
    $scope.authentication = Authentication;
    $scope.error = null;
    $scope.info = {};
    $scope.form = {};
    $scope.mytime = Date.now();
    
    $scope.weekDays = [];
    $scope.weekDayMask = [true, true, true, true, true, true, false];
    $scope.weekDayExamples = [new Date('2016-08-15'), new Date('2016-08-16'), new Date('2016-08-17'), new Date('2016-08-18'), new Date('2016-08-19'), new Date('2016-08-20'), new Date('2016-08-21')]; //Mon-Sun
    $scope.meals = [
        {
            recipeId: 1,
            index: 0,
            type: 0,
            weekday: 0,
            portions: 2,
            comment: 'test meal 1',
            isDone: false,
            startTime: 16 * 60 //16:00
        },
        {   
            recipeId: 1,
            index: 1,
            type: 0,
            weekday: 2,
            portions: 2.5,
            comment: 'test meal 2',
            isDone: true,
            startTime: 17 * 60 + 30 //17:30
        },
        {   
            recipeId: 1,
            index: 2,
            type: 1,
            weekday: 2,
            portions: 2.5,
            comment: 'test meal 2 - double',
            isDone: true,
            startTime: 17 * 60 + 30 //17:30
        },
        {   
            recipeId: 1,
            index: 3,
            type: 0,
            weekday: 2,
            portions: 2.5,
            comment: 'test meal 3',
            isDone: true,
            startTime: 17 * 60 + 30 //17:30
        },
        {   
            recipeId: 1,
            index: 4,
            type: 1,
            weekday: 3,
            portions: 2.5,
            comment: 'test meal 2',
            isDone: true,
            startTime: 17 * 60 + 30 //17:30
        }
    ];
    
    $scope.find = function () {
        MenuService.query().$promise.then(function (menus) {
            $scope.menus = menus;
        });
    };
    
    $scope.findOneInit = function () {
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.menu = menu;
                $scope.menu.startDate = new Date(menu.startDate);
            });    
        } else {
            $scope.menu = new MenuService(
                {
                    startDate: new Date(Date.now()),
                    types: [
                        {
                            index: 0,
                            caption: "Завтрак",
                            serve: new Date('2016-08-15 7:30')
                        },
                        {
                            index: 1,
                            caption: "Обед",
                            serve: new Date('2016-08-15 19:30')
                        }
                    ]
                }
            );
        }
    };
    
    $scope.findOneRecipes = function () {
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                if (menu.meals) {
                    menu.meals.forEach(function (item, i, arr) {
                        item.recipe = $scope.getRecipe(item.recipeId);    
                    });
                }
                $scope.menu = menu;
                $scope.menu.startDate = new Date(menu.startDate);
            });    
        }
    };
    
    $scope.findOne = function () {
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.meals = menu.meals;
                $scope.menuInitByDays(menu);
                $scope.menu = menu;
                $scope.menu.startDate = new Date(menu.startDate);
            });    
        } else {
            $scope.menu = new MenuService(
                {
                    startDate: Date.now(),
                    types: [
                        {
                            index: 0,
                            caption: "Завтрак",
                            serve: new Date('2016-08-15 7:30')
                        },
                        {
                            index: 1,
                            caption: "Обед",
                            serve: new Date('2016-08-15 19:30')
                        }
                    ]
                }
            );
        }
    };
    
    $scope.findQueryForMenu = function () {
        ShelfQueryService.query(
            {
                menuId: $stateParams.menuId
            }
        ).$promise.then(function (shelfQueries) {
            $scope.shelfQueries = shelfQueries;
        });
    };
    
    $scope.menuInitByDays = function (menu) {
        $scope.weekDays = [];
        $scope.weekDayMask.forEach(function (weekDay, i, arr) {
            if (!weekDay) {
                $scope.weekDays.push(
                    {
                        index: i,
                        isActive: false,
                        caption: $scope.weekDayExamples[i]
                    }
                );
            } else {
                $scope.weekDays.push(
                    {
                        index: i,
                        isActive: true,
                        caption: $scope.weekDayExamples[i]
                    }
                );
            }
            $scope.weekDays[i].types = [];
            menu.types.forEach(function (type, j, arr) {
                $scope.weekDays[i].types.push(
                    {
                        index: j,
                        caption: type.caption,
                        serve: type.serve
                    }
                );
                $scope.weekDays[i].types[j].meals = [];
                $scope.meals.forEach(function (meal, k, arr) {
                    if (meal.weekday === i && meal.type === $scope.weekDays[i].types[j].index) {
                        $scope.weekDays[i].types[j].meals.push(meal);
                        $scope.weekDays[i].types[j].meals[$scope.weekDays[i].types[j].meals.length - 1].index = k;
                    }
                });
            });
        });
        $scope.form.newType = {
            isShown: false,
            caption: null,
            serve: menu.types[menu.types.length - 1].serve
        };
    };
    
    $scope.addType = function () {
        $scope.menu.types.push(
            {
                index: $scope.menu.types[$scope.menu.types.length - 1].index + 1, 
                caption: $scope.form.newType.caption,
                serve: $scope.form.newType.serve
            }
        );
        $scope.form.newType = {
            isShown: false,
            caption: null,
            serve: $scope.menu.types[$scope.menu.types.length - 1].serve
        };
    };
    
    $scope.removeType = function (typeIndex) {
        $scope.menu.types.splice(typeIndex, 1);
        $scope.menuInitByDays($scope.menu);
    };
    
    $scope.addMeal = function (weekday, typeIndex) {
        $scope.meals.push(
            { 
                recipeId: 1,
                index: $scope.meals.length,
                type: typeIndex,
                weekday: weekday,
                portions: 2.5,
                comment: '',
                isDone: false,
                startTime: 17 * 60 + 30 //17:30
            } 
        );
        $scope.menuInitByDays($scope.menu);
    };
    
    $scope.mealMoveType = function (oldType, meal, direction) {
        
        var targetIndex = -1;
        $scope.weekDays[meal.weekday].types.some(function (type) {
            if (direction < 0) {
                if (type.serve >= oldType.serve)
                    return true;
                targetIndex = type.index;
            } else {
                targetIndex = type.index;
                if (type.serve > oldType.serve)
                    return true;    
            }
            return false;
        });
        if (targetIndex === -1) return;
        
        $scope.meals[meal.index].type = $scope.weekDays[meal.weekday].types[targetIndex].index;
        $scope.menuInitByDays($scope.menu);
    };
    
    $scope.mealMoveDay = function (meal, direction) {
        if (direction < 0) {
            if (meal.weekday > 0)
                meal.weekday = meal.weekday - 1;
            else 
                return;
        } else {
            if (meal.weekday < 6)
                meal.weekday = meal.weekday + 1;
            else 
                return;
        }
        $scope.meals[meal.index].weekday = meal.weekday;
        $scope.menuInitByDays($scope.menu);
    };
    
    $scope.getLocation = function (val) {
        return Recipes.query().$promise.then(function (results) {
            return results.map(function (item) {
                return {
                    id: item.id,
                    caption: item.title
                };
            });
        });
    };
    
    $scope.getRecipe = function (id) {
        return Recipes.get(
            {
                recipeId: id
            }
        );
    };
    
    $scope.getRecipeIngredients = function (recipe) {
        if (recipe.ingridients.length > 0) {
            recipe.ingridients.forEach(function (item, i, arr) {
                Measures.get(
                    {
                        measureId: item.ingridientAmount.measureId
                    }
                ).$promise.then(function (measure) {
                    item.measure = measure;
                });
            });
        }
    };
    
    $scope.addRecipe = function (id) {
        Recipes.get(
            {
                recipeId: id
            }
        ).$promise.then(function (recipe) {
            $scope.menu.meals.push(
                { 
                    recipeId: recipe.id,
                    recipe: recipe,
                    index: $scope.meals.length,
                    portions: recipe.portions
                }
            );
            $scope.getRecipeIngredients(recipe);
        });                                                
    };
    
    $scope.remove = function () {
        if ($window.confirm('Are you sure you want to delete?')) {
            $scope.menu.$remove();
            $location.path('menu');    
        }
    };

    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');
            return false;
        }
        
        console.log($scope.menu.meals);
        $scope.menu.meals = [];
        $scope.meals.forEach(function (meal, k, arr) {
             $scope.menu.meals.push(meal);    
        });
        console.log($scope.menu);
        $scope.menu.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('menu/' + $scope.menu.number);
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MenuInitController', MenuInitController);
MenuInitController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'MenuService'];

function MenuInitController($scope, $stateParams, $location, $window, Authentication, MenuService) {
    
    $scope.authentication = Authentication;
    $scope.error = null;
    $scope.form = {};
    
    $scope.find = function () {
        MenuService.query().$promise.then(function (menus) {
            $scope.menus = menus;
        });
    };
    
    $scope.findOne = function () {
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.menu = menu;
                $scope.menu.startDate = new Date(menu.startDate);
            });    
        } else {
            $scope.menu = new MenuService(
                {
                    startDate: new Date(Date.now()),
                    types: [
                        {
                            index: 0,
                            caption: "Завтрак",
                            serve: new Date('2016-08-15 7:30')
                        },
                        {
                            index: 1,
                            caption: "Обед",
                            serve: new Date('2016-08-15 19:30')
                        }
                    ]
                }
            );
        }
    };
    
    $scope.addType = function () {
        $scope.menu.types.push(
            {
                index: $scope.menu.types[$scope.menu.types.length - 1].index + 1, 
                caption: $scope.form.newType.caption,
                serve: $scope.form.newType.serve
            }
        );
        $scope.form.newType = {
            isShown: false,
            caption: null,
            serve: $scope.menu.types[$scope.menu.types.length - 1].serve
        };
    };
    
    $scope.removeType = function (typeIndex) {
        $scope.menu.types.splice(typeIndex, 1);
        $scope.menuInitByDays($scope.menu);
    };
    
    $scope.remove = function () {
        if ($window.confirm('Are you sure you want to delete?')) {
            $scope.menu.$remove();
            $location.path('menu');    
        }
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');
            return false;
        }
        $scope.menu.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('menu/' + $scope.menu.number + '/meals');
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MenuMealsController', MenuMealsController);
MenuMealsController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'MenuService','RecipeService', 'MealService'];

function MenuMealsController($scope, $stateParams, $location, $window, Authentication, MenuService, RecipeService, MealService) {
    
    $scope.authentication = Authentication;
    $scope.error = null;
    $scope.form = {};
    $scope.recipeList = [];
    
    $scope.find = function () {
        MenuService.query().$promise.then(function (menus) {
            $scope.menus = menus;
        });
    };
    
    $scope.findOne = function () {//TODO pass object via param
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.menu = menu;
                $scope.menu.startDate = new Date(menu.startDate);
                $scope.assignMeals();
            });
        }
    };
    
    $scope.getRecipes = function (value) {
        var matched = [];
        if ($scope.recipeList.length === 0) {
            return RecipeService.query().$promise.then(function (results) { //FUTURE уменьшить загрузку через поиск БД
                $scope.recipeList = results;
                results.forEach(function (item, i, arr) {
                    if (item.title.includes(value)) {
                        matched.push(item);
                    }
                });
                return matched;
            });
        } else {
            $scope.recipeList.forEach(function (item, i, arr) {
                if (item.title.includes(value)) {
                    matched.push(item);
                }
            });
            return matched;
        }
    };
    
    /*$scope.getRecipes = function (value) {
        return RecipeService.query(
            {
                recipeSearchTitle: value
            }
        ).$promise.then(function (results) {
            return results;
        });
    };search by param*/
    
    $scope.addRecipe = function (recipe) {
        var meal = new MealService(
            {
                index: $scope.menu.meals.length,
                recipeId: recipe.id,
                weekday: -1,
                type: -1,
                portions: recipe.portions,
                recipe: recipe
            }
        );
        $scope.menu.meals.push(meal);
        $scope.form.unassigned.push(meal);
        $scope.asyncSelected = "";
    };
    
    $scope.assignMeals = function () {
        $scope.form.unassigned = [];
        $scope.form.types = [];
        $scope.menu.types.forEach(function (item, i, arr) {
            $scope.form.types.push(
                {
                    caption: item.caption,
                    meals: []
                }
            );
        });
        $scope.menu.meals.forEach(function (item, i, arr) {
            item = new MealService(item);
            item.getRecipe().then(function (recipe) {
                item.recipe = recipe;
                if (item.type === -1 || item.type >= $scope.form.types.length) {
                    $scope.form.unassigned.push(item);
                } else if($scope.form.types[item.type]) {
                    $scope.form.types[item.type].meals.push(item);
                }
            });
        });
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');
            return false;
        }
        
        $scope.form.types.forEach(function (type, i, arr) {
            type.meals.forEach(function (meal, j, arr) {
                meal.type = i;
                meal.recipe = undefined;
            });
        });
        
        $scope.menu.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('menu/' + $scope.menu.number + '/weekplan');
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MenuSummaryController', MenuSummaryController);
MenuSummaryController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'MenuService','IngredientService', 'MealService'];

function MenuSummaryController($scope, $stateParams, $location, $window, Authentication, MenuService, IngredientService, MealService) {
    
    $scope.authentication = Authentication;
    $scope.error = null;
    $scope.form = {};
    
    $scope.find = function () {
        MenuService.query().$promise.then(function (menus) {
            $scope.menus = menus;
        });
    };
    
    $scope.findOne = function () {//TODO pass object via param
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.menu = menu;
                $scope.ingredientSummary();
                $scope.menu.startDate = new Date(menu.startDate);
            });
        }
    };
    
    
    $scope.ingredientSummary = function () {
        $scope.summary = [];
        $scope.menu.meals.forEach(function (meal, i, arr) {
            meal = new MealService(meal);
            meal.getRecipe().then(function (recipe) {
                meal.recipe = recipe;
                recipe.ingredients.forEach(function (ingredient, j, arr) {
                    ingredient = new IngredientService(ingredient);
                    ingredient.measureDefault = ingredient.ingredientAmount.measureId;
                    ingredient.getMeasure().then(function (measure) {
                        $scope.addIngredientToSum(
                            ingredient.id,
                            ingredient.caption,
                            ingredient.ingredientAmount.amount,
                            measure,
                            meal.portions
                        );
                    });
                });
            });
        });
    };
    
    $scope.addIngredientToSum = function(id, caption, amount, measure, mult) {
        var done = false;
        $scope.summary.forEach(function (ingredient, i, arr) {
            if (ingredient.id === id) {
                ingredient.measures.forEach(function (item, j, arr) {
                    if (item.id === measure.id) {
                        item.amount = item.amount + amount;
                        item.total = +Number(amount * mult).toFixed(3) + (item.total);
                        done = true;
                    }
                });
                if (done) return;
                ingredient.measures.push(
                    {
                        id: measure.id,
                        caption: measure.caption,
                        amount: amount,
                        total: +Number(amount * mult).toFixed(3)  
                    }
                );
                done = true;
            } 
        });
        if (done) return;
        $scope.summary.push(
            {
                id: id,
                caption: caption,
                measures: [
                    {
                        id: measure.id,
                        caption: measure.caption,
                        amount: amount,
                        total: +Number(amount * mult).toFixed(3)
                    }
                ]
            }
        );
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');
            return false;
        }
        
        $scope.menu.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('menu/' + $scope.menu.number + '/weekplan');
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('MenuWeekplanController', MenuWeekplanController);
MenuWeekplanController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'MenuService', 'MealService'];

function MenuWeekplanController($scope, $stateParams, $location, $window, Authentication, MenuService, MealService) {
    
    $scope.authentication = Authentication;
    $scope.error = null;
    
    $scope.weekDays = [];
    $scope.weekDayExamples = [new Date('2016-08-15'), new Date('2016-08-16'), new Date('2016-08-17'), new Date('2016-08-18'), new Date('2016-08-19'), new Date('2016-08-20'), new Date('2016-08-21')]; //Mon-Sun
    
    $scope.find = function () {
        MenuService.query().$promise.then(function (menus) {
            $scope.menus = menus;
        });
    };
    
    $scope.findOne = function () {
        if ($stateParams.menuId) {
            MenuService.get(
                {
                    menuId: $stateParams.menuId
                }
            ).$promise.then(function (menu) {
                $scope.meals = menu.meals;
                $scope.menu = menu;
                $scope.menuInitByDays();
                $scope.menu.startDate = new Date(menu.startDate);
            });
        }
    };
    
    $scope.menuInitByDays = function () {
        $scope.unassigned = [];
        $scope.weekDays = [];
        $scope.weekDayExamples.forEach(function (weekDay, i, arr) {
            $scope.weekDays.push(
                {
                    index: i,
                    caption: weekDay
                }
            );
            $scope.weekDays[i].types = [];
            $scope.menu.types.forEach(function (type, j, arr) {
                $scope.weekDays[i].types.push(
                    {
                        index: j,
                        caption: type.caption,
                        serve: type.serve
                    }
                );
                $scope.weekDays[i].types[j].meals = [];
                $scope.meals.forEach(function (meal, k, arr) {
                    if (meal.weekday === i && meal.type === $scope.weekDays[i].types[j].index) {
                        meal = new MealService(meal);
                        meal.getRecipe().then(function (recipe) {
                            meal.recipe = recipe;
                            $scope.weekDays[i].types[j].meals.push(meal);
                        });
                    }
                });
            });
        });
        $scope.meals.forEach(function (meal, k, arr) {
            if (meal.weekday === -1 || meal.type === -1 || meal.type >= $scope.menu.types.length) {
                meal = new MealService(meal);
                meal.getRecipe().then(function (recipe) {
                    meal.recipe = recipe;
                    $scope.unassigned.push(meal);    
                });
            }
        });
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'menuForm');
            return false;
        }
        
        $scope.meals = [];
        $scope.weekDays.forEach(function (weekDay, i, arr) {
            $scope.menu.types.forEach(function (type, j, arr) {
                $scope.weekDays[i].types[j].meals.forEach(function (meal, k, arr) {
                    meal.type = type.index;
                    meal.weekday = weekDay.index;
                    $scope.meals.push(meal);
                });
            });
        });
        $scope.unassigned.forEach(function (meal, i, arr) {
            meal.weekday = -1;
            $scope.meals.push(meal);
        });
        $scope.menu.meals = $scope.meals;
        $scope.menu.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('menu/' + $scope.menu.number);
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('ProductsController', ProductsController);
ProductsController.$inject = ['$scope', '$stateParams', '$location', '$window', '$timeout', 'Authentication', 'Products', 'FileUploader'];
function ProductsController($scope, $stateParams, $location, $window, $timeout, Authentication, Products, FileUploader) {

    $scope.authentication = Authentication;

    $scope.find = function () {
        $scope.products = Products.query();
    };

    $scope.findOne = function () {
        $scope.product = Products.get(
            {
                productId: $stateParams.productId
            }
        );
    };

    $scope.getMeasuresList = function () {
        //return Measures.query().$promise;
    };

    $scope.create = function (isValid) {
        $scope.error = null;

        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'productForm');
            return false;
        }

        // Create new Recipe object

        var product = new Products(
            {
                caption: this.caption,
                infoCard: this.infoCard,
                image: $scope.imageURL,
                measureId: $scope.measureId
            }
        );

        // Redirect after save
        product.$save(function (response) {
            $location.path('products/' + response.id);

        // Clear form fields
            $scope.caption = '';
            $scope.infoCard = '';
        }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
        });
    };

    $scope.update = function (isValid) {
        $scope.error = null;
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'productForm');
            return false;
        }

        var product = $scope.product;
        product.image = $scope.imageURL;
        product.$update(function () {
            $location.path('products/' + product.id);
        }, function (errorResponse) {
            $scope.error = errorResponse.data.message;
        });
    };

    $scope.remove = function (ingridient) {
        if (ingridient) {
            ingridient.$remove();
            $location.path('ingridients');
        } else {
            $scope.ingridient.$remove(function () {
                $location.path('ingridient');
            });
        }
    };

    var uploader = $scope.uploader = new FileUploader({
        url: '/api/pictures/products'
    });

    // FILTERS

    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });

        // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(fileItem._file);

            fileReader.onload = function (fileReaderEvent) {
                $timeout(function () {
                    $scope.imageURL = fileReaderEvent.target.result;
                }, 0);
            };
        }
    };
}
'use strict';

// Recipes controller
angular
    .module('recipes')
    .controller('RecipesController', RecipesController);
RecipesController.$inject = ['$scope', '$stateParams', '$location', '$window', '$timeout', 'Authentication', 'RecipeService', 'IngredientService', 'FileUploader'];

function RecipesController($scope, $stateParams, $location, $window, $timeout, Authentication, RecipeService, IngredientService, FileUploader) {

    $scope.authentication = Authentication;
    $scope.ingredientList = [];
    $scope.shelves = false;

    $scope.find = function () {
        RecipeService.query().$promise.then(function (recipes) {
            $scope.recipes = recipes;
        });
    };

    $scope.findOne = function () {
        if ($stateParams.recipeId) {
            RecipeService.get(
                {
                    recipeId: $stateParams.recipeId
                }
            ).$promise.then(function (recipe) {
                $scope.recipe = recipe;
                if (recipe.ingredients.length > 0) {
                    var ingredients = recipe.ingredients;
                    recipe.ingredients = [];
                    ingredients.forEach(function (item, i, arr) {
                        $scope.getIngredients(item.caption).then(function (match) {
                            if (match.length > 0) {
                                var measureDefault = match[0].measureDefault;
                                match[0].measureDefault = item.ingredientAmount.measureId;
                                match[0].amount = item.ingredientAmount.amount;
                                match[0].comment = item.ingredientAmount.comment;
                                $scope.addIngredient(match[0]);
                                $scope.recipe.ingredients[i].measureDefault = measureDefault;
                            }
                        });
                    });
                }   
            });    
        } else {
            $scope.recipe = new RecipeService({
                portions: 2,
                ingredients: [],
                steps: []
            });
        }
    };
    
    $scope.getIngredients = function (value) {
        var matched = [];
        if ($scope.ingredientList.length === 0) {
            return IngredientService.query().$promise.then(function (results) {
                $scope.ingredientList = results;
                results.forEach(function (item, i, arr) {
                    if (item.caption.includes(value)) {
                        matched.push(item);
                    }
                });
                return matched;
            });
        } else {
            $scope.ingredientList.forEach(function (item, i, arr) {
                if (item.caption.includes(value)) {
                    matched.push(item);
                }
            });
            return matched;
        }
    };
    
    $scope.addIngredient = function (ingredient) {
        var newIngredient = new IngredientService(ingredient);
        if (!ingredient.measure) {
            ingredient.getMeasure().then(function (measure) {
                newIngredient.measure = measure;
                if (!ingredient.amount) {
                    newIngredient.amount = newIngredient.measure.min;
                }
            });
        } else {
            newIngredient.measure = ingredient.measure;
            newIngredient.amount = ingredient.amount;
        }
        newIngredient.index = $scope.recipe.ingredients.length;
        newIngredient.getShelf().then(function (shelf) {
            if (shelf.id) {
                console.log(shelf);
                newIngredient.shelf = shelf;
            }
        });    
        $scope.recipe.ingredients.push(newIngredient);
        $scope.asyncSelectedAdd = "";
    };
    
    $scope.removeIngredient = function (index) {
        $scope.recipe.ingredients.splice(index, 1);
    };
    
    $scope.addStep = function () {
        $scope.recipe.steps.push({
            action: ""
        });
    };
    
    $scope.removeStep = function (index) {
        $scope.recipe.steps.splice(index, 1);
    };
    
    $scope.selectMain = function (ingredient) {
        $scope.recipe.mainIngredient = ingredient;
        $scope.asyncSelectedMain = "";
    };
    
    $scope.unsetPicture = function () {
        $scope.recipe.image = "";
        $scope.uploader.clearQueue();
    };
    
    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'recipeForm');
            return false;
        }
        
        $scope.recipe.ingredients.forEach(function (item, i, arr) {
            item.index = i; 
        });
        $scope.recipe.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('recipes/' + $scope.recipe.id);
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };

    var uploader = $scope.uploader = new FileUploader({
        url: '/api/pictures/ingredients'
    });

    $scope.imageurl = 'http://res.cloudinary.com/thomascookbook/image/upload/v1466671927/';

    // FILTERS

    uploader.filters.push(
        {
            name: 'imageFilter',
            fn: function (item, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        },
        {
            name: 'overWriteFilter',
            fn: function(item, options) {
                if(this.queue.length===1){
                    this.clearQueue();
                }
                return true;
            }
        }
    );

        // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function (fileItem) {
        if ($window.FileReader) {
            var fileReader = new FileReader();
            fileReader.readAsDataURL(fileItem._file);

            fileReader.onload = function (fileReaderEvent) {
                $timeout(function () {
                    $scope.imageURL = fileReaderEvent.target.result;
                }, 0);
            };
        }
    };
}
'use strict';

angular
    .module('recipes')
    .controller('ShelfController', ShelfController);

ShelfController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'ShelfService', 'ShelfQueryService', 'IngredientService', 'MeasureService'];

function ShelfController($scope, $stateParams, $location, $window, Authentication, ShelfService, ShelfQueryService, IngredientService, MeasureService) {

    // progress bar settings
    const pbLimitDeficit = 20;
    const pbLimitDesired = 50;
    const pbLimitMax = 80;
        
    $scope.authentication = Authentication;
    $scope.error = null;
    
    $scope.ingredientList = [];
    $scope.legend = false;
    $scope.selectedIngridient = "";
    $scope.imageurl = 'http://res.cloudinary.com/thomascookbook/image/upload/v1466671927/';
    
    $scope.find = function () {
        ShelfService.query().$promise.then(function (shelves) {
            $scope.shelves = shelves;
        });
    };
    
    $scope.findOne = function () {
        if ($stateParams.shelfId) {
            ShelfService.get(
                {
                    shelfId: $stateParams.shelfId
                }
            ).$promise.then(function (shelf) {
                $scope.shelf = shelf;
                if (shelf.ingredientId) {
                    $scope.loadIngredient(shelf.ingredientId).then(function (ingredient) {
                        $scope.setIngredient(ingredient);    
                    });      
                }
            });    
        } else {
            $scope.shelf = new ShelfService(
                {
                    stored: 15,
                    desired: 25,
                    max: 30,
                    deficit: 10
                }
            );
            if ($stateParams.ingredient) {
                $scope.setIngredient($stateParams.ingredient);
            }
        } 
    };
    
    $scope.getIngredients = function (value) {
        var matched = [];
        if ($scope.ingredientList.length === 0) {
            IngredientService.query().$promise.then(function (results) {
                $scope.ingredientList = results;
                results.forEach(function (item, i, arr) {
                    if (item.caption.includes(value)) {
                        matched.push(item);
                    }
                });
            });   
        } else {
            $scope.ingredientList.forEach(function (item, i, arr) {
                if (item.caption.includes(value)) {
                    matched.push(item);
                }
            });    
        }
        return matched;
    };
    
    $scope.loadIngredient = function (id) {
        return IngredientService.get(
            {
                ingredientId: id
            }
        ).$promise;
    };
    
    $scope.setIngredient = function (ingredient) {
        
        if (!ingredient) {
            $scope.shelf.ingridientId = null;
            $scope.ingredient = null;
            return;
        }
        
        $scope.ingredient = ingredient;
        $scope.shelf.ingredientId = ingredient.id;
        ingredient.getMeasure().then(function (measure) {
            $scope.measure = measure;
        });
        
        $scope.asyncSelected = '';
    };
    
    $scope.filterBar = {
        spoiled: true,
        deficit: true,
        lsdesired: true,
        desired: true,
        max: true
    };
    
    $scope.filterBarToggle = function () {
        
        if ($scope.filterBar.deficit && $scope.filterBar.lsdesired && $scope.filterBar.desired && $scope.filterBar.max) {
            $scope.filterBar = {
                deficit: false,
                lsdesired: false,
                desired: false,
                max: false
            };       
        } else {
            $scope.filterBar = {
                deficit: true,
                lsdesired: true,
                desired: true,
                max: true
            };
        }
    };
    
    $scope.filterByProgress = function (index) {
        var item = $scope.shelves[index];
        if (!item.progressbar) return true;
        return false ||
            ($scope.filterBar.spoiled && item.isSpoiled) ||
            ($scope.filterBar.deficit && item.progressbar.value <= pbLimitDeficit) ||
            ($scope.filterBar.lsdesired && item.progressbar.value > pbLimitDeficit && item.progressbar.value < pbLimitDesired) ||
            ($scope.filterBar.desired && item.progressbar.value >= pbLimitDesired && item.progressbar.value <= pbLimitMax) ||
            ($scope.filterBar.max && item.progressbar.value > pbLimitMax && item.progressbar.value <= 100);
    };
    
    $scope.clearSpoiled = function () {
        //TODO clearSpoiled        
    };
    
    $scope.validateDeficit = function (id, value, oldValue) {
        $scope.form = {
            deficit: false,
            desired: false,
            max: false
        };
        if (value < $scope.measure.min || $scope.shelf.desired <= value) {
            $scope.form.deficit = true;
            return false;
        }
        return true;
    };
    
    $scope.validateDesired = function (id, value, oldValue) {
        $scope.form = {
            deficit: false,
            desired: false,
            max: false
        };
        if (value <= $scope.shelf.deficit || $scope.shelf.max <= value) {
            $scope.form.desired = true;
            return false;
        }
        return true;
    };
    
    $scope.validateMax = function (id, value, oldValue) {
        $scope.form = {
            deficit: false,
            desired: false,
            max: false
        };
        if (value <= $scope.shelf.desired) {
            $scope.form.max = true;
            return false;
        }
        return true;
    };
    
    $scope.remove = function () {
        if ($window.confirm('Are you sure you want to delete?')) {
            $scope.shelf.$remove();
            $location.path('shelf');    
        }
    };

    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'shelfForm');
            return false;
        }
        
        $scope.shelf.caption = $scope.ingredient.caption;
        $scope.shelf.measureCaption = $scope.measure.caption;
        $scope.shelf.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('shelf/' + $scope.shelf.number);
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
'use strict';

angular
    .module('recipes')
    .controller('ShelfQueryController', ShelfQueryController);

ShelfQueryController.$inject = ['$scope', '$stateParams', '$location', '$window', 'Authentication', 'ShelfQueryService', 'MeasureService'];

function ShelfQueryController($scope, $stateParams, $location, $window, Authentication, ShelfQueryService, MeasureService) {
        
    $scope.authentication = Authentication;
    $scope.error = null;
    $scope.info = {};
    $scope.form = {};

    $scope.imageurl = 'http://res.cloudinary.com/thomascookbook/image/upload/v1466671927/';
    
    $scope.find = function () {
        ShelfQueryService.query().$promise.then(function (shelfQueries) {
            /*shelfQueries.forEach(function (shelfQuery, i, arr) {
                $scope.progressUpdate(shelf);    
            });*/
            $scope.shelfQueries = shelfQueries;
        });
    };
    
    $scope.findOne = function () {
        if ($stateParams.shelfId && $stateParams.queryId) {
            ShelfQueryService.get(
                {
                    shelfId: $stateParams.shelfId,
                    queryId: $stateParams.queryId
                }
            ).$promise.then(function (shelfQuery) {
                MeasureService.get(
                    {
                        measureId: shelfQuery.measureId
                    }
                ).$promise.then(function (measure) {
                    $scope.measure = measure;
                });
                $scope.shelfQuery = shelfQuery;
            });    
        } else {
            //TODO new query from other then shelf    
        } 
    };
    
    $scope.remove = function () {
        if ($window.confirm('Are you sure you want to delete?')) {
            $scope.shelfQuery.$remove();
            $location.path('shelfQuery');    
        }
    };

    $scope.save = function (isValid) {
        
        if (!isValid) {
            $scope.$broadcast('show-errors-check-validity', 'shelfQueryForm');
            return false;
        }
        
        /*console.log($scope.shelfQuery);
        $scope.shelfQuery.id = $scope.shelfQuery.number; */
        $scope.shelfQuery.createOrUpdate()
            .then(successCallback)
            .catch(errorCallback);

        function successCallback(res) {
            $location.path('shelf/' + $scope.shelfQuery.shelfId + '/query');
        }

        function errorCallback(res) {
            $scope.error = res.data.message;
        }
    };
}
//
// Copyright Kamil Pękala http://github.com/kamilkp
// angular-sortable-view v0.0.15c 2015/01/18
// forked from C0ZEN/angular-sortable-view fork of original
//

;(function(window, angular){
	'use strict';
	/* jshint eqnull:true */
	/* jshint -W041 */
	/* jshint -W030 */
    /* jshint -W116 */
    /* jshint -W003 */

	var module = angular.module('recipes');
	module.directive('svRoot', [function(){
		function shouldBeAfter(elem, pointer, isGrid){
			return isGrid ? elem.x - pointer.x < 0 : elem.y - pointer.y < 0;
		}
		function getSortableElements(key){
			return ROOTS_MAP[key];
		}
		function removeSortableElements(key){
			delete ROOTS_MAP[key];
		}

		var sortingInProgress;
		var ROOTS_MAP = Object.create(null);



		// window.ROOTS_MAP = ROOTS_MAP; // for debug purposes

		return {
			restrict: 'A',
			controller: ['$scope', '$attrs', '$interpolate', '$parse', function($scope, $attrs, $interpolate, $parse){


				//multi select

				this.MULTI_SELECT_LIST = [];

				this.multiSelectRaise = function(){
					for (var i=0;i<this.MULTI_SELECT_LIST.length;i++){
						this.MULTI_SELECT_LIST[i].element.addClass('sv-long-pressing');
					}
				};
				this.isMultiSelecting = function(){
					return this.MULTI_SELECT_LIST.length > 1;
				};

				this.clearMultiSelect = function(html){
						for (var i=0;i<this.MULTI_SELECT_LIST.length;i++){
							this.MULTI_SELECT_LIST[i].$multiSelected = false;
							this.MULTI_SELECT_LIST[i].element.removeClass('sv-element-multi-selected');
							this.MULTI_SELECT_LIST[i].element.removeClass('sv-long-pressing');
						}
						html.removeClass('sv-multi-selected');
						this.MULTI_SELECT_LIST=[];
					};

				 this.addToMultiSelect = function(sortableElement, multiScope, attr, html){
				 		for (var i=0;i<this.MULTI_SELECT_LIST.length;i++){
							if (this.MULTI_SELECT_LIST[i] === sortableElement){
								return false;
							}
						}
						sortableElement.$multiSelected = true;
						sortableElement.element.addClass('sv-element-multi-selected');
						sortableElement.multiScope = multiScope;
						sortableElement.attr = attr;
						html.addClass('sv-multi-selected');
						this.MULTI_SELECT_LIST.push(sortableElement);
						return true;
					};

				this.removeFromMultiSelect = function(sortableElement,html){
						sortableElement.$multiSelected = false;
						delete sortableElement.multiScope;
						delete sortableElement.attr;
						sortableElement.element.removeClass('sv-element-multi-selected');
						for (var i=0;i<this.MULTI_SELECT_LIST.length;i++){
							if (this.MULTI_SELECT_LIST[i] === sortableElement){
								this.MULTI_SELECT_LIST.splice(i,1);
								break;
							}
						}
						if (document.querySelectorAll('.sv-element-multi-selected').length === 0){
							html.removeClass('sv-multi-selected');
						}
					};

				this.getMultimodels = function(){
					var multiModels = [];
					var that = this;
					for (var i=0;i<that.MULTI_SELECT_LIST.length;i++){
						multiModels.push($parse(that.MULTI_SELECT_LIST[i].attr)(that.MULTI_SELECT_LIST[i].multiScope));
					}
					return multiModels;
				};


				var mapKey = $interpolate($attrs.svRoot)($scope) || $scope.$id;
				if(!ROOTS_MAP[mapKey]) ROOTS_MAP[mapKey] = [];

				var html = angular.element(document.documentElement);
				var that         = this;
				var candidates;  // set of possible destinations
				var $placeholder;// placeholder element
				var options;     // sortable options
				var $helper;     // helper element - the one thats being dragged around with the mouse pointer
				var $original;   // original element
				var $target;     // last best candidate
				var isGrid       = false;
				var isDisabled   = false;
				var onSort       = $parse($attrs.svOnSort);

				$scope.$watch($parse($attrs.svDisabled), function(newVal, oldVal) {
 					isDisabled = newVal;
 				});

				// ----- hack due to https://github.com/angular/angular.js/issues/8044
				$attrs.svOnStart = $attrs.$$element[0].attributes['sv-on-start'];
				$attrs.svOnStart = $attrs.svOnStart && $attrs.svOnStart.value;

				$attrs.svOnStop = $attrs.$$element[0].attributes['sv-on-stop'];
				$attrs.svOnStop = $attrs.svOnStop && $attrs.svOnStop.value;
				// -------------------------------------------------------------------

				var onStart = $parse($attrs.svOnStart);
				var onStop = $parse($attrs.svOnStop);

				this.mapKey = mapKey;

				this.sortingInProgress = function(){
					return sortingInProgress;
				};

				this.sortingDisabled = function() {
 					return isDisabled;
 				};

				if($attrs.svGrid){ // sv-grid determined explicite
					isGrid = $attrs.svGrid === "true" ? true : $attrs.svGrid === "false" ? false : null;
					if(isGrid === null)
						throw 'Invalid value of sv-grid attribute';
				}
				else{
					// check if at least one of the lists have a grid like layout
					$scope.$watchCollection(function(){
						return getSortableElements(mapKey);
					}, function(collection){
						isGrid = false;
						var array = collection.filter(function(item){
							return !item.container;
						}).map(function(item){
							return {
								part: item.getPart().id,
								y: item.element[0].getBoundingClientRect().top
							};
						});
						var dict = Object.create(null);
						array.forEach(function(item){
							if(dict[item.part])
								dict[item.part].push(item.y);
							else
								dict[item.part] = [item.y];
						});
						Object.keys(dict).forEach(function(key){
							dict[key].sort();
							dict[key].forEach(function(item, index){
								if(index < dict[key].length - 1){
									if(item > 0 && item === dict[key][index + 1]){
										isGrid = true;
									}
								}
							});
						});
					});
				}

				var stop = false;
		    var scroll = function (step, delay) {
		    		var el = document.querySelector('.main-ui-view');
		    		console.log("scrolling top", el.scrollTop);
		        el.scrollTop+=step;
		        if (!stop) {
		            setTimeout(function () {
                        scroll(step);
                    }, delay);
		        }
		    };

				this.$moveUpdate = function(opts, mouse, svElement, svOriginal, svPlaceholder, originatingPart, originatingIndex){
					var svRect = svElement[0].getBoundingClientRect();
					if(opts.tolerance === 'element')
						mouse = {
							x: ~~(svRect.left + svRect.width/2),
							y: ~~(svRect.top + svRect.height/2)
						};

					sortingInProgress = true;
					//console.log("move update");
					candidates = [];
					if(!$placeholder){
						if(svPlaceholder){ // custom placeholder
							$placeholder = svPlaceholder.clone();
							$placeholder.removeClass('ng-hide');
						}
						else{ // default placeholder
							$placeholder = svOriginal.clone();
							$placeholder.addClass('sv-visibility-hidden');
							$placeholder.addClass('sv-placeholder');
							$placeholder.css({
								'height': svRect.height + 'px',
								'width': svRect.width + 'px'
							});
						}

						svOriginal.after($placeholder);
						if (!that.keepInList){
							svOriginal.addClass('ng-hide');
						}

						// cache options, helper and original element reference
						$original = svOriginal;
						options = opts;
						$helper = svElement;

						onStart($scope, {
							$helper: {element: $helper},
							$part: originatingPart.model(originatingPart.scope),
							$index: originatingIndex,
							$item: originatingPart.model(originatingPart.scope)[originatingIndex]
						});
						$scope.$root && $scope.$root.$$phase || $scope.$apply();
					}
					var reposX = mouse.x + document.body.scrollLeft - mouse.offset.x*svRect.width;
					var reposY = mouse.y + document.body.scrollTop - mouse.offset.y*svRect.height;

					$helper[0].style.position ='fixed';
					// ----- move the element
					$helper[0].reposition({
						x: reposX,
						y: reposY
					});

					if (reposY <= 30){
						stop = false;
						scroll(-50, 200);
					} else if (reposY >= document.body.clientHeight - 60){
						stop = false;
						scroll(50, 200);
					} else {
						stop = true;
					}

					// ----- manage candidates
					getSortableElements(mapKey).forEach(function(se, index){
						if(opts.containment != null){
							// TODO: optimize this since it could be calculated only once when the moving begins
							if(
								!elementMatchesSelector(se.element, opts.containment) &&
								!elementMatchesSelector(se.element, opts.containment + ' *')
							) return; // element is not within allowed containment
						}

						var rect = se.element[0].getBoundingClientRect();
						var center = {
							x: ~~(rect.left + rect.width/2),
							y: ~~(rect.top + rect.height/2)
						};

						if(!se.container && // not the container element
							(se.element[0].scrollHeight || se.element[0].scrollWidth)){ // element is visible
							candidates.push({
								element: se.element,
								q: (center.x - mouse.x)*(center.x - mouse.x) + (center.y - mouse.y)*(center.y - mouse.y),
								view: se.getPart(),
								targetIndex: se.getIndex(),
								after: shouldBeAfter(center, mouse, isGrid)
							});
						}
						if(se.container && !se.element[0].querySelector('[sv-element]:not(.sv-placeholder):not(.sv-source)')){ // empty container
							candidates.push({
								element: se.element,
								q: (center.x - mouse.x)*(center.x - mouse.x) + (center.y - mouse.y)*(center.y - mouse.y),
								view: se.getPart(),
								targetIndex: 0,
								container: true
							});
						}
					});
					var pRect = $placeholder[0].getBoundingClientRect();
					var pCenter = {
						x: ~~(pRect.left + pRect.width/2),
						y: ~~(pRect.top + pRect.height/2)
					};
					candidates.push({
						q: (pCenter.x - mouse.x)*(pCenter.x - mouse.x) + (pCenter.y - mouse.y)*(pCenter.y - mouse.y),
						element: $placeholder,
						placeholder: true
					});
					candidates.sort(function(a, b){
						return a.q - b.q;
					});

					candidates.forEach(function(cand, index){
						if(index === 0 && !cand.placeholder && !cand.container){
							$target = cand;
							cand.element.addClass('sv-candidate');
							if(cand.after)
								cand.element.after($placeholder);
							else
								insertElementBefore(cand.element, $placeholder);
						}
						else if(index === 0 && cand.container){
							$target = cand;
							cand.element.append($placeholder);
						}
						else
							cand.element.removeClass('sv-candidate');
					});
				};

				this.$drop = function(originatingPart, index, options){
					stop=true;
					if(!$placeholder) return;

					if(options.revert){
						var placeholderRect = $placeholder[0].getBoundingClientRect();
						var helperRect = $helper[0].getBoundingClientRect();
						var distance = Math.sqrt(
							Math.pow(helperRect.top - placeholderRect.top, 2) +
							Math.pow(helperRect.left - placeholderRect.left, 2)
						);

						var duration = +options.revert*distance/200; // constant speed: duration depends on distance
						duration = Math.min(duration, +options.revert); // however it's not longer that options.revert

						['-webkit-', '-moz-', '-ms-', '-o-', ''].forEach(function(prefix){
							if(typeof $helper[0].style[prefix + 'transition'] !== "undefined")
								$helper[0].style[prefix + 'transition'] = 'all ' + duration + 'ms ease';
						});
						setTimeout(afterRevert, duration);
						$helper.css({
							'top': placeholderRect.top + document.body.scrollTop + 'px',
							'left': placeholderRect.left + document.body.scrollLeft + 'px'
						});
					}
					else
						afterRevert();

					function afterRevert(){
						sortingInProgress = false;
						$placeholder.remove();
						$helper.remove();
						$original.removeClass('ng-hide');

						candidates = void 0;
						$placeholder = void 0;
						options = void 0;
						$helper = void 0;
						$original = void 0;

						// sv-on-stop callback
						onStop($scope, {
							$part: originatingPart.model(originatingPart.scope),
							$index: index,
							$item: originatingPart.model(originatingPart.scope)[index]
						});

						var multiModels = that.getMultimodels();

						if($target){
							$target.element.removeClass('sv-candidate');
							var spliced = [originatingPart.model(originatingPart.scope)[index]];
							if (!that.keepInList){
								spliced = originatingPart.model(originatingPart.scope).splice(index, 1);
							}
							var targetIndex = $target.targetIndex;
							if($target.view === originatingPart && $target.targetIndex > index)
								targetIndex--;
							if($target.after)
								targetIndex++;

							if (multiModels.length ===0)
								multiModels =  spliced;

							for (var i =0;i<multiModels.length;i++){
								$target.view.model($target.view.scope).splice(targetIndex+i, 0, multiModels[i]);
							}

							var sortMethod;
							var destinationScope = $scope;
							var shouldSort = false;
							if(index != targetIndex){
								sortMethod = onSort;
								shouldSort = true;
							}
							// sv-on-sort callback
							if($target.view !== originatingPart){
								shouldSort = true;

								//if destination has sv-on-sort call it not the parent's
								if ($target.view.element && $target.view.element.attr("sv-on-external-sort")){
									destinationScope = $target.view.element.scope();
									var destinationOnSort = $parse($target.view.element.attr("sv-on-external-sort"));
									if (destinationOnSort){
										sortMethod = destinationOnSort;
									}
								}
							}

							if (sortMethod){
									sortMethod(destinationScope, {
										$partTo: $target.view.model($target.view.scope),
										$partFrom: originatingPart.model(originatingPart.scope),
										// $item: spliced[0],
										$items:multiModels,
										$indexTo: targetIndex,
										$indexFrom: index
									});
							}
							if (shouldSort){
								var $viewEl = $target.view.element;
								$viewEl.addClass("sv-dropped");
								setTimeout(function(){
									$viewEl.removeClass("sv-dropped");
									$viewEl = void 0;
									that.clearMultiSelect(html);
								},300);
							}
						}
						$target = void 0;

						$scope.$root && $scope.$root.$$phase || $scope.$apply();
					}
				};

				this.addToSortableElements = function(se){
					getSortableElements(mapKey).push(se);
				};
				this.removeFromSortableElements = function(se){
					var elems = getSortableElements(mapKey);
					var index = elems.indexOf(se);
					if(index > -1){
						elems.splice(index, 1);
						if(elems.length === 0)
							removeSortableElements(mapKey);
					}
				};
			}]
		};
	}]);

	module.directive('svPart', ['$parse', function($parse){

			return {
			restrict: 'A',
			require: '^svRoot',
			controller: ['$scope', function($scope){
				$scope.$ctrl = this;
				this.getPart = function(){
					return $scope.part;
				};
					this.$drop = function(index, options){
						$scope.$sortableRoot.$drop($scope.part, index, options);
					};
			}],
			scope: true,
			link: function($scope, $element, $attrs, $sortable){
				var html = angular.element(document.documentElement);
				if(!$attrs.svPart) throw new Error('no model provided');
				var model = $parse($attrs.svPart);
				if(!model.assign) throw new Error('model not assignable');
				$sortable.keepInList = $parse($attrs.svKeepInList)($scope);
				$scope.$ctrl.isDropzone = $parse($attrs.svIsDropzone)($scope) === false ? false : true;
				$scope.$ctrl.multiSelect = $parse($attrs.svMultiSelect)($scope) === true ? true : false;

				if($scope.$ctrl.multiSelect){
					$element.on('mousedown',function(){
						$sortable.clearMultiSelect(html);
					});
				}
				$scope.part = {
					id: $scope.$id,
					element: $element,
					model: model,
					scope: $scope
				};
				$scope.$sortableRoot = $sortable;

				var sortablePart = {
					element: $element,
					getPart: $scope.$ctrl.getPart,
					container: true
				};

				if ($scope.$ctrl.isDropzone){
					$sortable.addToSortableElements(sortablePart);
				}
				$scope.$on('$destroy', function(){
					$sortable.removeFromSortableElements(sortablePart);
				});
			}
		};
	}]);

	module.directive('svElement', ['$parse','svDragging', function($parse, svDragging){
		return {
			restrict: 'A',
			require: ['^svPart', '^svRoot'],
			controller: ['$scope', function($scope){
				$scope.$ctrl = this;
			}],
			link: function($scope, $element, $attrs, $controllers){



				var sortableElement = {
					element: $element,
					getPart: $controllers[0].getPart,
					getIndex: function(){
						return $scope.$index;
					}
				};
				if ($controllers[0].isDropzone){
					$controllers[1].addToSortableElements(sortableElement);
				}
				$scope.$on('$destroy', function(){
					$controllers[1].removeFromSortableElements(sortableElement);
				});

				var startTimer;
				var clearEvent = function () {
					svDragging.isDragging = false;
				  clearTimeout(startTimer);
			 	};

		 	  var event = function (e) {
		 	  	function setMulti(ev){
		 	    	if (!moveExecuted && $controllers[0].multiSelect){
			 	    	if (ev.ctrlKey || ev.metaKey){
			 	    		if(sortableElement.$multiSelected){
			 	    			$controllers[1].removeFromMultiSelect(sortableElement, html);
			 	    		} else {
			 	    			$controllers[1].addToMultiSelect(sortableElement, $scope, $attrs.svElement, html);
			 	    		}
			 	    	} else if (!sortableElement.$multiSelected){
			 	    		$controllers[1].clearMultiSelect(html);
			 	    		$controllers[1].addToMultiSelect(sortableElement, $scope,$attrs.svElement, html);
			 	    	}
			 	    }
		 	  	}

		 	  	//ignore other buttons
		 	  	var evt = (e==null ? event:e);
		 	  	if (evt && (evt.which>1 || evt.button>2)){
		 	  		return true;
		 	  	}
		 	  	if($controllers[1].sortingDisabled()){
		 	  		return true;
		 	  	}
		 	    html.on('mouseup touchend', function mouseup(e){
		 	    	setMulti(e);
		 	    	clearEvent();
		 	    	html.off('mouseup touchend', mouseup);
		 	    });

		 	    startTimer = setTimeout(function () {
		 	    	setMulti(e);
	 	    		onMousedown(e);
 	    		}, 300);
 	    		e.preventDefault();
 	    		e.stopPropagation();
 	    		return false;
		 	  };

				// assume every element is draggable unless specified
				$scope.$watch($parse($attrs.svElementDisabled), function(newVal, oldVal) {
					if (newVal){
						resetOnStartEvent(false, event);
					} else {
						resetOnStartEvent($element, event);
					}

 				});

				var handle = $element;

				handle.on('mousedown touchstart', event);
				$scope.$watch('$ctrl.handle', function(customHandle){
					if(customHandle){
						resetOnStartEvent(customHandle, event);
					}
				});

				var helper;
				$scope.$watch('$ctrl.helper', function(customHelper){
					if(customHelper){
						helper = customHelper;
					}
				});

				var placeholder;
				$scope.$watch('$ctrl.placeholder', function(customPlaceholder){
					if(customPlaceholder){
						placeholder = customPlaceholder;
					}
				});

				var body = angular.element(document.body);
				var html = angular.element(document.documentElement);

				var moveExecuted;


				function resetOnStartEvent(newHandle, event){
					if (newHandle){
							handle.off('mousedown touchstart', event);
							handle = newHandle;
							handle.on('mousedown touchstart', event);
							return;
					} else {
						handle.off('mousedown touchstart', event);
					}
				}

				function onMousedown(e){
					if (svDragging.isDragging){
						return;
					}

					if ($controllers[0].multiSelect && !sortableElement.$multiSelect){
						$controllers[1].addToMultiSelect(sortableElement, $scope, $attrs.svElement, html);
						$controllers[1].multiSelectRaise();
					} else {
						$element.addClass('sv-long-pressing');
					}


					svDragging.isDragging = true;
					touchFix(e);

					if($controllers[1].sortingInProgress()) return;
					if($controllers[1].sortingDisabled()) return;
					if(e.button != 0 && e.type === 'mousedown') return;

					moveExecuted = false;
					var opts = $parse($attrs.svElement)($scope);
					opts = angular.extend({}, {
						tolerance: 'pointer',
						revert: 200,
						containment: 'html'
					}, opts);
					if(opts.containment){
						var containmentRect = closestElement.call($element, opts.containment)[0].getBoundingClientRect();
					}

					var target = $element;
					var clientRect = $element[0].getBoundingClientRect();
					var clone;
					if(!helper) helper = $controllers[0].helper;
					if(!placeholder) placeholder = $controllers[0].placeholder;
					if(helper){
						clone = helper.clone();
						clone.removeClass('ng-hide');
						clone.css({
							'left': clientRect.left + document.body.scrollLeft + 'px',
							'top': clientRect.top + document.body.scrollTop + 'px'
						});
							target.addClass('sv-visibility-hidden');
					} else if ($controllers[1].isMultiSelecting()){
						clone = angular.element(document.querySelector("#sv-multi-helper")).clone();
						var models = $controllers[1].getMultimodels();
						clone[0].querySelector(".card-title-text").innerHTML = target[0].querySelector(".card-title-text").innerHTML;

						clone[0].querySelector(".badge").innerHTML = $controllers[1].MULTI_SELECT_LIST.length;
						clone.addClass('sv-helper').css({
							'left': clientRect.left + document.body.scrollLeft + 'px',
							'top': clientRect.top + document.body.scrollTop + 'px',
							'width': clientRect.width + 'px'
						});
					}
					else{
						clone = target.clone();
						clone.removeClass("sv-element-multi-selected");
						clone.addClass('sv-helper').css({
							'left': clientRect.left + document.body.scrollLeft + 'px',
							'top': clientRect.top + document.body.scrollTop + 'px',
							'width': clientRect.width + 'px'
						});
					}

					clone[0].reposition = function(coords){
						var targetLeft = coords.x;
						var targetTop = coords.y;
						var helperRect = clone[0].getBoundingClientRect();

						var body = document.body;

						if(containmentRect){
							if(targetTop < containmentRect.top + body.scrollTop) // top boundary
								targetTop = containmentRect.top + body.scrollTop;
							if(targetTop + helperRect.height > containmentRect.top + body.scrollTop + containmentRect.height) // bottom boundary
								targetTop = containmentRect.top + body.scrollTop + containmentRect.height - helperRect.height;
							if(targetLeft < containmentRect.left + body.scrollLeft) // left boundary
								targetLeft = containmentRect.left + body.scrollLeft;
							if(targetLeft + helperRect.width > containmentRect.left + body.scrollLeft + containmentRect.width) // right boundary
								targetLeft = containmentRect.left + body.scrollLeft + containmentRect.width - helperRect.width;
						}
						this.style.left = targetLeft - body.scrollLeft + 'px';
						this.style.top = targetTop - body.scrollTop + 'px';
					};

					var pointerOffset = {
						x: (e.clientX - clientRect.left)/clientRect.width,
						y: (e.clientY - clientRect.top)/clientRect.height
					};
					html.addClass('sv-sorting-in-progress');

					var dropzoneClass = 'sv-sorting-'+$controllers[1].mapKey;
					html.addClass(dropzoneClass);

					html.on('mousemove touchmove', onMousemove).on('mouseup touchend touchcancel', function mouseup(e){
						svDragging.isDragging = false;
						html.off('mousemove touchmove', onMousemove);
						html.off('mouseup touchend', mouseup);

						// timeout so animation goes to the right element
						setTimeout(function(){
							html.removeClass('sv-sorting-in-progress');
							html.removeClass(dropzoneClass);
						},500);

						if(moveExecuted){
							$controllers[0].$drop($scope.$index, opts);
							moveExecuted = false;
						}
						$element.removeClass('sv-visibility-hidden');
						if (!$controllers[0].multiSelect){
							setTimeout(function(){
								target.removeClass('sv-long-pressing');
							},300);
						} else {
							if ($controllers[1].MULTI_SELECT_LIST.length === 1){
								$controllers[1].clearMultiSelect(html);
							}
						}
					});

					// onMousemove(e);
					function onMousemove(e){
						touchFix(e);
						if(!moveExecuted){
							body.prepend(clone);
							moveExecuted = true;
						}
						$controllers[1].$moveUpdate(opts, {
							x: e.clientX,
							y: e.clientY,
							offset: pointerOffset
						}, clone, $element, placeholder, $controllers[0].getPart(), $scope.$index);
						e.stopPropagation();
						e.preventDefault();
						return false;
					}
				}
			}
		};
	}]);

	module.directive('svHandle', function(){
		return {
			require: '?^svElement',
			link: function($scope, $element, $attrs, $ctrl){
				if($ctrl)
					$ctrl.handle = $element.add($ctrl.handle); // support multiple handles
			}
		};
	});

	module.directive('svHelper', function(){
		return {
			require: ['?^svPart', '?^svElement'],
			link: function($scope, $element, $attrs, $ctrl){
				$element.addClass('sv-helper').addClass('ng-hide');
				if($ctrl[1])
					$ctrl[1].helper = $element;
				else if($ctrl[0])
					$ctrl[0].helper = $element;
			}
		};
	});

	module.directive('svPlaceholder', function(){
		return {
			require: ['?^svPart', '?^svElement'],
			link: function($scope, $element, $attrs, $ctrl){
				$element.addClass('sv-placeholder').addClass('ng-hide');
				if ($ctrl[1] && $ctrl[0]){
					//find closest svPart or svElement and set placeholder in the correct place
					var p = $element.parent();
					while (p.length > 0) {
					  if (p[0].hasAttribute('sv-element')){
					  	$ctrl[1].placeholder = $element;
					  	return;
					  } else if (p[0].hasAttribute('sv-part')){
					  	$ctrl[0].placeholder = $element;
					  	return;
					  }
					  p = p.parent();
					}
				} else if($ctrl[1])
					$ctrl[1].placeholder = $element;
				else if($ctrl[0])
					$ctrl[0].placeholder = $element;
			}
		};
	});

	module.service('svDragging', function(){
		this.isDragging = false;
	});

	angular.element(document.head).append([
		'<style>' +
		'.sv-helper{' +
			'position: fixed !important;' +
			'z-index: 99999;' +
			'margin: 0 !important;' +
		'}' +
		'.sv-candidate{' +
		'}' +
		'.sv-placeholder{' +
			// 'opacity: 0;' +
		'}' +
		'.sv-sorting-in-progress{' +
			'-webkit-user-select: none;' +
			'-moz-user-select: none;' +
			'-ms-user-select: none;' +
			'user-select: none;' +
		'}' +
		'.sv-visibility-hidden{' +
			'visibility: hidden !important;' +
			'opacity: 0 !important;' +
		'}' +
		'</style>'
	].join(''));

	function touchFix(e){
		if(!('clientX' in e) && !('clientY' in e)) {
			var touches = e.touches || e.originalEvent.touches;
			if(touches && touches.length) {
				e.clientX = touches[0].clientX;
				e.clientY = touches[0].clientY;
			}
			e.preventDefault();
		}
	}

	function getPreviousSibling(element){
		element = element[0];
		if(element.previousElementSibling)
			return angular.element(element.previousElementSibling);
		else{
			var sib = element.previousSibling;
			while(sib != null && sib.nodeType != 1)
				sib = sib.previousSibling;
			return angular.element(sib);
		}
	}

	function insertElementBefore(element, newElement){
		var prevSibl = getPreviousSibling(element);
		if(prevSibl.length > 0){
			prevSibl.after(newElement);
		}
		else{
			element.parent().prepend(newElement);
		}
	}

	var dde = document.documentElement,
	matchingFunction = dde.matches ? 'matches' :
						dde.matchesSelector ? 'matchesSelector' :
						dde.webkitMatches ? 'webkitMatches' :
						dde.webkitMatchesSelector ? 'webkitMatchesSelector' :
						dde.msMatches ? 'msMatches' :
						dde.msMatchesSelector ? 'msMatchesSelector' :
						dde.mozMatches ? 'mozMatches' :
						dde.mozMatchesSelector ? 'mozMatchesSelector' : null;
	if(matchingFunction == null)
		throw 'This browser doesn\'t support the HTMLElement.matches method';

	function elementMatchesSelector(element, selector){
		if(element instanceof angular.element) element = element[0];
		if(matchingFunction !== null)
			return element[matchingFunction](selector);
	}

	var closestElement = angular.element.prototype.closest || function (selector){
		var el = this[0].parentNode;
		while(el !== document.documentElement && !el[matchingFunction](selector))
			el = el.parentNode;

		if(el[matchingFunction](selector))
			return angular.element(el);
		else
			return angular.element();
	};

	/*
		Simple implementation of jQuery's .add method
	 */
	if(typeof angular.element.prototype.add !== 'function'){
		angular.element.prototype.add = function(elem){
			var i, res = angular.element();
			elem = angular.element(elem);
			for(i=0;i<this.length;i++){
				res.push(this[i]);
			}
			for(i=0;i<elem.length;i++){
				res.push(elem[i]);
			}
			return res;
		};
	}

})(window, window.angular);
/**
 * angular-strap
 * @version v2.3.8 - 2016-03-31
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/* jshint ignore:start */
(function(window, document, undefined) {
  'use strict';
  bsCompilerService.$inject = [ '$q', '$http', '$injector', '$compile', '$controller', '$templateCache' ];
  angular.module('mgcrea.ngStrap.tooltip', [ 'mgcrea.ngStrap.core', 'mgcrea.ngStrap.helpers.dimensions' ]).provider('$tooltip', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      prefixClass: 'tooltip',
      prefixEvent: 'tooltip',
      container: false,
      target: false,
      placement: 'top',
      templateUrl: 'tooltip/tooltip.tpl.html',
      template: '',
      titleTemplate: false,
      trigger: 'hover focus',
      keyboard: false,
      html: false,
      show: false,
      title: '',
      type: '',
      delay: 0,
      autoClose: false,
      bsEnabled: true,
      viewport: {
        selector: 'body',
        padding: 0
      }
    };
    this.$get = [ '$window', '$rootScope', '$bsCompiler', '$q', '$templateCache', '$http', '$animate', '$sce', 'dimensions', '$$rAF', '$timeout', function($window, $rootScope, $bsCompiler, $q, $templateCache, $http, $animate, $sce, dimensions, $$rAF, $timeout) {
      var isTouch = 'createTouch' in $window.document;
      var $body = angular.element($window.document);
      function TooltipFactory(element, config) {
        var $tooltip = {};
        var options = $tooltip.$options = angular.extend({}, defaults, config);
        var promise = $tooltip.$promise = $bsCompiler.compile(options);
        var scope = $tooltip.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        var nodeName = element[0].nodeName.toLowerCase();
        if (options.delay && angular.isString(options.delay)) {
          var split = options.delay.split(',').map(parseFloat);
          options.delay = split.length > 1 ? {
            show: split[0],
            hide: split[1]
          } : split[0];
        }
        $tooltip.$id = options.id || element.attr('id') || '';
        if (options.title) {
          scope.title = $sce.trustAsHtml(options.title);
        }
        scope.$setEnabled = function(isEnabled) {
          scope.$$postDigest(function() {
            $tooltip.setEnabled(isEnabled);
          });
        };
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $tooltip.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $tooltip.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $tooltip.toggle();
          });
        };
        $tooltip.$isShown = scope.$isShown = false;
        var timeout;
        var hoverState;
        var compileData;
        var tipElement;
        var tipContainer;
        var tipScope;
        promise.then(function(data) {
          compileData = data;
          $tooltip.init();
        });
        $tooltip.init = function() {
          if (options.delay && angular.isNumber(options.delay)) {
            options.delay = {
              show: options.delay,
              hide: options.delay
            };
          }
          if (options.container === 'self') {
            tipContainer = element;
          } else if (angular.isElement(options.container)) {
            tipContainer = options.container;
          } else if (options.container) {
            tipContainer = findElement(options.container);
          }
          bindTriggerEvents();
          if (options.target) {
            options.target = angular.isElement(options.target) ? options.target : findElement(options.target);
          }
          if (options.show) {
            scope.$$postDigest(function() {
              if (options.trigger === 'focus') {
                element[0].focus();
              } else {
                $tooltip.show();
              }
            });
          }
        };
        $tooltip.destroy = function() {
          unbindTriggerEvents();
          destroyTipElement();
          scope.$destroy();
        };
        $tooltip.enter = function() {
          clearTimeout(timeout);
          hoverState = 'in';
          if (!options.delay || !options.delay.show) {
            return $tooltip.show();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'in') $tooltip.show();
          }, options.delay.show);
        };
        $tooltip.show = function() {
          if (!options.bsEnabled || $tooltip.$isShown) return;
          scope.$emit(options.prefixEvent + '.show.before', $tooltip);
          var parent;
          var after;
          if (options.container) {
            parent = tipContainer;
            if (tipContainer[0].lastChild) {
              after = angular.element(tipContainer[0].lastChild);
            } else {
              after = null;
            }
          } else {
            parent = null;
            after = element;
          }
          if (tipElement) destroyTipElement();
          tipScope = $tooltip.$scope.$new();
          tipElement = $tooltip.$element = compileData.link(tipScope, function(clonedElement, scope) {});
          tipElement.css({
            top: '-9999px',
            left: '-9999px',
            right: 'auto',
            display: 'block',
            visibility: 'hidden'
          });
          if (options.animation) tipElement.addClass(options.animation);
          if (options.type) tipElement.addClass(options.prefixClass + '-' + options.type);
          if (options.customClass) tipElement.addClass(options.customClass);
          if (after) {
            after.after(tipElement);
          } else {
            parent.prepend(tipElement);
          }
          $tooltip.$isShown = scope.$isShown = true;
          safeDigest(scope);
          $tooltip.$applyPlacement();
          if (angular.version.minor <= 2) {
            $animate.enter(tipElement, parent, after, enterAnimateCallback);
          } else {
            $animate.enter(tipElement, parent, after).then(enterAnimateCallback);
          }
          safeDigest(scope);
          $$rAF(function() {
            if (tipElement) tipElement.css({
              visibility: 'visible'
            });
            if (options.keyboard) {
              if (options.trigger !== 'focus') {
                $tooltip.focus();
              }
              bindKeyboardEvents();
            }
          });
          if (options.autoClose) {
            bindAutoCloseEvents();
          }
        };
        function enterAnimateCallback() {
          scope.$emit(options.prefixEvent + '.show', $tooltip);
        }
        $tooltip.leave = function() {
          clearTimeout(timeout);
          hoverState = 'out';
          if (!options.delay || !options.delay.hide) {
            return $tooltip.hide();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'out') {
              $tooltip.hide();
            }
          }, options.delay.hide);
        };
        var _blur;
        var _tipToHide;
        $tooltip.hide = function(blur) {
          if (!$tooltip.$isShown) return;
          scope.$emit(options.prefixEvent + '.hide.before', $tooltip);
          _blur = blur;
          _tipToHide = tipElement;
          if (angular.version.minor <= 2) {
            $animate.leave(tipElement, leaveAnimateCallback);
          } else {
            $animate.leave(tipElement).then(leaveAnimateCallback);
          }
          $tooltip.$isShown = scope.$isShown = false;
          safeDigest(scope);
          if (options.keyboard && tipElement !== null) {
            unbindKeyboardEvents();
          }
          if (options.autoClose && tipElement !== null) {
            unbindAutoCloseEvents();
          }
        };
        function leaveAnimateCallback() {
          scope.$emit(options.prefixEvent + '.hide', $tooltip);
          if (tipElement === _tipToHide) {
            if (_blur && options.trigger === 'focus') {
              return element[0].blur();
            }
            destroyTipElement();
          }
        }
        $tooltip.toggle = function(evt) {
          if (evt) {
            evt.preventDefault();
          }
          if ($tooltip.$isShown) {
            $tooltip.leave();
          } else {
            $tooltip.enter();
          }
        };
        $tooltip.focus = function() {
          tipElement[0].focus();
        };
        $tooltip.setEnabled = function(isEnabled) {
          options.bsEnabled = isEnabled;
        };
        $tooltip.setViewport = function(viewport) {
          options.viewport = viewport;
        };
        $tooltip.$applyPlacement = function() {
          if (!tipElement) return;
          var placement = options.placement;
          var autoToken = /\s?auto?\s?/i;
          var autoPlace = autoToken.test(placement);
          if (autoPlace) {
            placement = placement.replace(autoToken, '') || defaults.placement;
          }
          tipElement.addClass(options.placement);
          var elementPosition = getPosition();
          var tipWidth = tipElement.prop('offsetWidth');
          var tipHeight = tipElement.prop('offsetHeight');
          $tooltip.$viewport = options.viewport && findElement(options.viewport.selector || options.viewport);
          if (autoPlace) {
            var originalPlacement = placement;
            var viewportPosition = getPosition($tooltip.$viewport);
            if (/bottom/.test(originalPlacement) && elementPosition.bottom + tipHeight > viewportPosition.bottom) {
              placement = originalPlacement.replace('bottom', 'top');
            } else if (/top/.test(originalPlacement) && elementPosition.top - tipHeight < viewportPosition.top) {
              placement = originalPlacement.replace('top', 'bottom');
            }
            if (/left/.test(originalPlacement) && elementPosition.left - tipWidth < viewportPosition.left) {
              placement = placement.replace('left', 'right');
            } else if (/right/.test(originalPlacement) && elementPosition.right + tipWidth > viewportPosition.width) {
              placement = placement.replace('right', 'left');
            }
            tipElement.removeClass(originalPlacement).addClass(placement);
          }
          var tipPosition = getCalculatedOffset(placement, elementPosition, tipWidth, tipHeight);
          applyPlacement(tipPosition, placement);
        };
        $tooltip.$onKeyUp = function(evt) {
          if (evt.which === 27 && $tooltip.$isShown) {
            $tooltip.hide();
            evt.stopPropagation();
          }
        };
        $tooltip.$onFocusKeyUp = function(evt) {
          if (evt.which === 27) {
            element[0].blur();
            evt.stopPropagation();
          }
        };
        $tooltip.$onFocusElementMouseDown = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          if ($tooltip.$isShown) {
            element[0].blur();
          } else {
            element[0].focus();
          }
        };
        function bindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          angular.forEach(triggers, function(trigger) {
            if (trigger === 'click' || trigger === 'contextmenu') {
              element.on(trigger, $tooltip.toggle);
            } else if (trigger !== 'manual') {
              element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
              element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
              if (nodeName === 'button' && trigger !== 'hover') {
                element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
              }
            }
          });
        }
        function unbindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          for (var i = triggers.length; i--; ) {
            var trigger = triggers[i];
            if (trigger === 'click' || trigger === 'contextmenu') {
              element.off(trigger, $tooltip.toggle);
            } else if (trigger !== 'manual') {
              element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
              element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
              if (nodeName === 'button' && trigger !== 'hover') {
                element.off(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
              }
            }
          }
        }
        function bindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            tipElement.on('keyup', $tooltip.$onKeyUp);
          } else {
            element.on('keyup', $tooltip.$onFocusKeyUp);
          }
        }
        function unbindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            tipElement.off('keyup', $tooltip.$onKeyUp);
          } else {
            element.off('keyup', $tooltip.$onFocusKeyUp);
          }
        }
        var _autoCloseEventsBinded = false;
        function bindAutoCloseEvents() {
          $timeout(function() {
            tipElement.on('click', stopEventPropagation);
            $body.on('click', $tooltip.hide);
            _autoCloseEventsBinded = true;
          }, 0, false);
        }
        function unbindAutoCloseEvents() {
          if (_autoCloseEventsBinded) {
            tipElement.off('click', stopEventPropagation);
            $body.off('click', $tooltip.hide);
            _autoCloseEventsBinded = false;
          }
        }
        function stopEventPropagation(event) {
          event.stopPropagation();
        }
        function getPosition($element) {
          $element = $element || (options.target || element);
          var el = $element[0];
          var isBody = el.tagName === 'BODY';
          var elRect = el.getBoundingClientRect();
          var rect = {};
          for (var p in elRect) {
            rect[p] = elRect[p];
          }
          if (rect.width === null) {
            rect = angular.extend({}, rect, {
              width: elRect.right - elRect.left,
              height: elRect.bottom - elRect.top
            });
          }
          var elOffset = isBody ? {
            top: 0,
            left: 0
          } : dimensions.offset(el);
          var scroll = {
            scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.prop('scrollTop') || 0
          };
          var outerDims = isBody ? {
            width: document.documentElement.clientWidth,
            height: $window.innerHeight
          } : null;
          return angular.extend({}, rect, scroll, outerDims, elOffset);
        }
        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
          var offset;
          var split = placement.split('-');
          switch (split[0]) {
           case 'right':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left + position.width
            };
            break;

           case 'bottom':
            offset = {
              top: position.top + position.height,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;

           case 'left':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left - actualWidth
            };
            break;

           default:
            offset = {
              top: position.top - actualHeight,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;
          }
          if (!split[1]) {
            return offset;
          }
          if (split[0] === 'top' || split[0] === 'bottom') {
            switch (split[1]) {
             case 'left':
              offset.left = position.left;
              break;

             case 'right':
              offset.left = position.left + position.width - actualWidth;
              break;

             default:
              break;
            }
          } else if (split[0] === 'left' || split[0] === 'right') {
            switch (split[1]) {
             case 'top':
              offset.top = position.top - actualHeight + position.height;
              break;

             case 'bottom':
              offset.top = position.top;
              break;

             default:
              break;
            }
          }
          return offset;
        }
        function applyPlacement(offset, placement) {
          var tip = tipElement[0];
          var width = tip.offsetWidth;
          var height = tip.offsetHeight;
          var marginTop = parseInt(dimensions.css(tip, 'margin-top'), 10);
          var marginLeft = parseInt(dimensions.css(tip, 'margin-left'), 10);
          if (isNaN(marginTop)) marginTop = 0;
          if (isNaN(marginLeft)) marginLeft = 0;
          offset.top = offset.top + marginTop;
          offset.left = offset.left + marginLeft;
          dimensions.setOffset(tip, angular.extend({
            using: function(props) {
              tipElement.css({
                top: Math.round(props.top) + 'px',
                left: Math.round(props.left) + 'px',
                right: ''
              });
            }
          }, offset), 0);
          var actualWidth = tip.offsetWidth;
          var actualHeight = tip.offsetHeight;
          if (placement === 'top' && actualHeight !== height) {
            offset.top = offset.top + height - actualHeight;
          }
          if (/top-left|top-right|bottom-left|bottom-right/.test(placement)) return;
          var delta = getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
          if (delta.left) {
            offset.left += delta.left;
          } else {
            offset.top += delta.top;
          }
          dimensions.setOffset(tip, offset);
          if (/top|right|bottom|left/.test(placement)) {
            var isVertical = /top|bottom/.test(placement);
            var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
            var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';
            replaceArrow(arrowDelta, tip[arrowOffsetPosition], isVertical);
          }
        }
        function getViewportAdjustedDelta(placement, position, actualWidth, actualHeight) {
          var delta = {
            top: 0,
            left: 0
          };
          if (!$tooltip.$viewport) return delta;
          var viewportPadding = options.viewport && options.viewport.padding || 0;
          var viewportDimensions = getPosition($tooltip.$viewport);
          if (/right|left/.test(placement)) {
            var topEdgeOffset = position.top - viewportPadding - viewportDimensions.scroll;
            var bottomEdgeOffset = position.top + viewportPadding - viewportDimensions.scroll + actualHeight;
            if (topEdgeOffset < viewportDimensions.top) {
              delta.top = viewportDimensions.top - topEdgeOffset;
            } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
              delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
            }
          } else {
            var leftEdgeOffset = position.left - viewportPadding;
            var rightEdgeOffset = position.left + viewportPadding + actualWidth;
            if (leftEdgeOffset < viewportDimensions.left) {
              delta.left = viewportDimensions.left - leftEdgeOffset;
            } else if (rightEdgeOffset > viewportDimensions.right) {
              delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
            }
          }
          return delta;
        }
        function replaceArrow(delta, dimension, isHorizontal) {
          var $arrow = findElement('.tooltip-arrow, .arrow', tipElement[0]);
          $arrow.css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isHorizontal ? 'top' : 'left', '');
        }
        function destroyTipElement() {
          clearTimeout(timeout);
          if ($tooltip.$isShown && tipElement !== null) {
            if (options.autoClose) {
              unbindAutoCloseEvents();
            }
            if (options.keyboard) {
              unbindKeyboardEvents();
            }
          }
          if (tipScope) {
            tipScope.$destroy();
            tipScope = null;
          }
          if (tipElement) {
            tipElement.remove();
            tipElement = $tooltip.$element = null;
          }
        }
        return $tooltip;
      }
      function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
      }
      function findElement(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      }
      return TooltipFactory;
    } ];
  }).directive('bsTooltip', [ '$window', '$location', '$sce', '$tooltip', '$$rAF', function($window, $location, $sce, $tooltip, $$rAF) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var tooltip;
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'titleTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'backdropAnimation', 'type', 'customClass', 'id' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
            options[key] = false;
          }
        });
        var dataTarget = element.attr('data-target');
        if (angular.isDefined(dataTarget)) {
          if (falseValueRegExp.test(dataTarget)) {
            options.target = false;
          } else {
            options.target = dataTarget;
          }
        }
        if (!scope.hasOwnProperty('title')) {
          scope.title = '';
        }
        attr.$observe('title', function(newValue) {
          if (angular.isDefined(newValue) || !scope.hasOwnProperty('title')) {
            var oldValue = scope.title;
            scope.title = $sce.trustAsHtml(newValue);
            if (angular.isDefined(oldValue)) {
              $$rAF(function() {
                if (tooltip) tooltip.$applyPlacement();
              });
            }
          }
        });
        attr.$observe('disabled', function(newValue) {
          if (newValue && tooltip.$isShown) {
            tooltip.hide();
          }
        });
        if (attr.bsTooltip) {
          scope.$watch(attr.bsTooltip, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.title = newValue;
            }
            if (angular.isDefined(oldValue)) {
              $$rAF(function() {
                if (tooltip) tooltip.$applyPlacement();
              });
            }
          }, true);
        }
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(tooltip),?/i);
            if (newValue === true) {
              tooltip.show();
            } else {
              tooltip.hide();
            }
          });
        }
        if (attr.bsEnabled) {
          scope.$watch(attr.bsEnabled, function(newValue, oldValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|1|,?(tooltip),?/i);
            if (newValue === false) {
              tooltip.setEnabled(false);
            } else {
              tooltip.setEnabled(true);
            }
          });
        }
        if (attr.viewport) {
          scope.$watch(attr.viewport, function(newValue) {
            if (!tooltip || !angular.isDefined(newValue)) return;
            tooltip.setViewport(newValue);
          });
        }
        tooltip = $tooltip(element, options);
        scope.$on('$destroy', function() {
          if (tooltip) tooltip.destroy();
          options = null;
          tooltip = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.typeahead', [ 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.helpers.parseOptions' ]).provider('$typeahead', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'typeahead',
      prefixEvent: '$typeahead',
      placement: 'bottom-left',
      templateUrl: 'typeahead/typeahead.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      minLength: 1,
      filter: 'bsAsyncFilter',
      limit: 6,
      autoSelect: false,
      comparator: '',
      trimValue: true
    };
    this.$get = [ '$window', '$rootScope', '$tooltip', '$$rAF', '$timeout', function($window, $rootScope, $tooltip, $$rAF, $timeout) {
      function TypeaheadFactory(element, controller, config) {
        var $typeahead = {};
        var options = angular.extend({}, defaults, config);
        $typeahead = $tooltip(element, options);
        var parentScope = config.scope;
        var scope = $typeahead.$scope;
        scope.$resetMatches = function() {
          scope.$matches = [];
          scope.$activeIndex = options.autoSelect ? 0 : -1;
        };
        scope.$resetMatches();
        scope.$activate = function(index) {
          scope.$$postDigest(function() {
            $typeahead.activate(index);
          });
        };
        scope.$select = function(index, evt) {
          scope.$$postDigest(function() {
            $typeahead.select(index);
          });
        };
        scope.$isVisible = function() {
          return $typeahead.$isVisible();
        };
        $typeahead.update = function(matches) {
          scope.$matches = matches;
          if (scope.$activeIndex >= matches.length) {
            scope.$activeIndex = options.autoSelect ? 0 : -1;
          }
          safeDigest(scope);
          $$rAF($typeahead.$applyPlacement);
        };
        $typeahead.activate = function(index) {
          scope.$activeIndex = index;
        };
        $typeahead.select = function(index) {
          if (index === -1) return;
          var value = scope.$matches[index].value;
          controller.$setViewValue(value);
          controller.$render();
          scope.$resetMatches();
          if (parentScope) parentScope.$digest();
          scope.$emit(options.prefixEvent + '.select', value, index, $typeahead);
        };
        $typeahead.$isVisible = function() {
          if (!options.minLength || !controller) {
            return !!scope.$matches.length;
          }
          return scope.$matches.length && angular.isString(controller.$viewValue) && controller.$viewValue.length >= options.minLength;
        };
        $typeahead.$getIndex = function(value) {
          var index;
          for (index = scope.$matches.length; index--; ) {
            if (angular.equals(scope.$matches[index].value, value)) break;
          }
          return index;
        };
        $typeahead.$onMouseDown = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
        };
        $typeahead.$onKeyDown = function(evt) {
          if (!/(38|40|13)/.test(evt.keyCode)) return;
          if ($typeahead.$isVisible() && !(evt.keyCode === 13 && scope.$activeIndex === -1)) {
            evt.preventDefault();
            evt.stopPropagation();
          }
          if (evt.keyCode === 13 && scope.$matches.length) {
            $typeahead.select(scope.$activeIndex);
          } else if (evt.keyCode === 38 && scope.$activeIndex > 0) {
            scope.$activeIndex--;
          } else if (evt.keyCode === 40 && scope.$activeIndex < scope.$matches.length - 1) {
            scope.$activeIndex++;
          } else if (angular.isUndefined(scope.$activeIndex)) {
            scope.$activeIndex = 0;
          }
          scope.$digest();
        };
        var show = $typeahead.show;
        $typeahead.show = function() {
          show();
          $timeout(function() {
            if ($typeahead.$element) {
              $typeahead.$element.on('mousedown', $typeahead.$onMouseDown);
              if (options.keyboard) {
                if (element) element.on('keydown', $typeahead.$onKeyDown);
              }
            }
          }, 0, false);
        };
        var hide = $typeahead.hide;
        $typeahead.hide = function() {
          if ($typeahead.$element) $typeahead.$element.off('mousedown', $typeahead.$onMouseDown);
          if (options.keyboard) {
            if (element) element.off('keydown', $typeahead.$onKeyDown);
          }
          if (!options.autoSelect) {
            $typeahead.activate(-1);
          }
          hide();
        };
        return $typeahead;
      }
      function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
      }
      TypeaheadFactory.defaults = defaults;
      return TypeaheadFactory;
    } ];
  }).filter('bsAsyncFilter', [ '$filter', function($filter) {
    return function(array, expression, comparator) {
      if (array && angular.isFunction(array.then)) {
        return array.then(function(results) {
          return $filter('filter')(results, expression, comparator);
        });
      }
      return $filter('filter')(array, expression, comparator);
    };
  } ]).directive('bsTypeahead', [ '$window', '$parse', '$q', '$typeahead', '$parseOptions', function($window, $parse, $q, $typeahead, $parseOptions) {
    var defaults = $typeahead.defaults;
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        element.off('change');
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'filter', 'limit', 'minLength', 'watchOptions', 'selectMode', 'autoSelect', 'comparator', 'id', 'prefixEvent', 'prefixClass' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'trimValue', 'filter' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        if (!element.attr('autocomplete')) element.attr('autocomplete', 'off');
        var filter = angular.isDefined(options.filter) ? options.filter : defaults.filter;
        var limit = options.limit || defaults.limit;
        var comparator = options.comparator || defaults.comparator;
        var bsOptions = attr.bsOptions;
        if (filter) {
          bsOptions += ' | ' + filter + ':$viewValue';
          if (comparator) bsOptions += ':' + comparator;
        }
        if (limit) bsOptions += ' | limitTo:' + limit;
        var parsedOptions = $parseOptions(bsOptions);
        var typeahead = $typeahead(element, controller, options);
        if (options.watchOptions) {
          var watchedOptions = parsedOptions.$match[7].replace(/\|.+/, '').replace(/\(.*\)/g, '').trim();
          scope.$watchCollection(watchedOptions, function(newValue, oldValue) {
            parsedOptions.valuesFn(scope, controller).then(function(values) {
              typeahead.update(values);
              controller.$render();
            });
          });
        }
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          scope.$modelValue = newValue;
          parsedOptions.valuesFn(scope, controller).then(function(values) {
            if (options.selectMode && !values.length && newValue.length > 0) {
              controller.$setViewValue(controller.$viewValue.substring(0, controller.$viewValue.length - 1));
              return;
            }
            if (values.length > limit) values = values.slice(0, limit);
            typeahead.update(values);
            controller.$render();
          });
        });
        controller.$formatters.push(function(modelValue) {
          var displayValue = parsedOptions.displayValue(modelValue);
          if (displayValue) {
            return displayValue;
          }
          if (angular.isDefined(modelValue) && typeof modelValue !== 'object') {
            return modelValue;
          }
          return '';
        });
        controller.$render = function() {
          if (controller.$isEmpty(controller.$viewValue)) {
            return element.val('');
          }
          var index = typeahead.$getIndex(controller.$modelValue);
          var selected = index !== -1 ? typeahead.$scope.$matches[index].label : controller.$viewValue;
          selected = angular.isObject(selected) ? parsedOptions.displayValue(selected) : selected;
          var value = selected ? selected.toString().replace(/<(?:.|\n)*?>/gm, '') : '';
          element.val(options.trimValue === false ? value : value.trim());
        };
        scope.$on('$destroy', function() {
          if (typeahead) typeahead.destroy();
          options = null;
          typeahead = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.timepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('$timepicker', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'timepicker',
      placement: 'bottom-left',
      templateUrl: 'timepicker/timepicker.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      useNative: true,
      timeType: 'date',
      timeFormat: 'shortTime',
      timezone: null,
      modelTimeFormat: null,
      autoclose: false,
      minTime: -Infinity,
      maxTime: +Infinity,
      length: 5,
      hourStep: 1,
      minuteStep: 5,
      secondStep: 5,
      roundDisplay: false,
      iconUp: 'glyphicon glyphicon-chevron-up',
      iconDown: 'glyphicon glyphicon-chevron-down',
      arrowBehavior: 'pager'
    };
    this.$get = [ '$window', '$document', '$rootScope', '$sce', '$dateFormatter', '$tooltip', '$timeout', function($window, $document, $rootScope, $sce, $dateFormatter, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      if (!defaults.lang) {
        defaults.lang = $dateFormatter.getDefaultLocale();
      }
      function timepickerFactory(element, controller, config) {
        var $timepicker = $tooltip(element, angular.extend({}, defaults, config));
        var parentScope = config.scope;
        var options = $timepicker.$options;
        var scope = $timepicker.$scope;
        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };
        function floorMinutes(time) {
          var coeff = 1e3 * 60 * options.minuteStep;
          return new Date(Math.floor(time.getTime() / coeff) * coeff);
        }
        var selectedIndex = 0;
        var defaultDate = options.roundDisplay ? floorMinutes(new Date()) : new Date();
        var startDate = controller.$dateValue || defaultDate;
        var viewDate = {
          hour: startDate.getHours(),
          meridian: startDate.getHours() < 12,
          minute: startDate.getMinutes(),
          second: startDate.getSeconds(),
          millisecond: startDate.getMilliseconds()
        };
        var format = $dateFormatter.getDatetimeFormat(options.timeFormat, lang);
        var hoursFormat = $dateFormatter.hoursFormat(format);
        var timeSeparator = $dateFormatter.timeSeparator(format);
        var minutesFormat = $dateFormatter.minutesFormat(format);
        var secondsFormat = $dateFormatter.secondsFormat(format);
        var showSeconds = $dateFormatter.showSeconds(format);
        var showAM = $dateFormatter.showAM(format);
        scope.$iconUp = options.iconUp;
        scope.$iconDown = options.iconDown;
        scope.$select = function(date, index) {
          $timepicker.select(date, index);
        };
        scope.$moveIndex = function(value, index) {
          $timepicker.$moveIndex(value, index);
        };
        scope.$switchMeridian = function(date) {
          $timepicker.switchMeridian(date);
        };
        $timepicker.update = function(date) {
          if (angular.isDate(date) && !isNaN(date.getTime())) {
            $timepicker.$date = date;
            angular.extend(viewDate, {
              hour: date.getHours(),
              minute: date.getMinutes(),
              second: date.getSeconds(),
              millisecond: date.getMilliseconds()
            });
            $timepicker.$build();
          } else if (!$timepicker.$isBuilt) {
            $timepicker.$build();
          }
        };
        $timepicker.select = function(date, index, keep) {
          if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) controller.$dateValue = new Date(1970, 0, 1);
          if (!angular.isDate(date)) date = new Date(date);
          if (index === 0) controller.$dateValue.setHours(date.getHours()); else if (index === 1) controller.$dateValue.setMinutes(date.getMinutes()); else if (index === 2) controller.$dateValue.setSeconds(date.getSeconds());
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
          if (options.autoclose && !keep) {
            $timeout(function() {
              $timepicker.hide(true);
            });
          }
        };
        $timepicker.switchMeridian = function(date) {
          if (!controller.$dateValue || isNaN(controller.$dateValue.getTime())) {
            return;
          }
          var hours = (date || controller.$dateValue).getHours();
          controller.$dateValue.setHours(hours < 12 ? hours + 12 : hours - 12);
          controller.$setViewValue(angular.copy(controller.$dateValue));
          controller.$render();
        };
        $timepicker.$build = function() {
          var i;
          var midIndex = scope.midIndex = parseInt(options.length / 2, 10);
          var hours = [];
          var hour;
          for (i = 0; i < options.length; i++) {
            hour = new Date(1970, 0, 1, viewDate.hour - (midIndex - i) * options.hourStep);
            hours.push({
              date: hour,
              label: formatDate(hour, hoursFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(hour, 0),
              disabled: $timepicker.$isDisabled(hour, 0)
            });
          }
          var minutes = [];
          var minute;
          for (i = 0; i < options.length; i++) {
            minute = new Date(1970, 0, 1, 0, viewDate.minute - (midIndex - i) * options.minuteStep);
            minutes.push({
              date: minute,
              label: formatDate(minute, minutesFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(minute, 1),
              disabled: $timepicker.$isDisabled(minute, 1)
            });
          }
          var seconds = [];
          var second;
          for (i = 0; i < options.length; i++) {
            second = new Date(1970, 0, 1, 0, 0, viewDate.second - (midIndex - i) * options.secondStep);
            seconds.push({
              date: second,
              label: formatDate(second, secondsFormat),
              selected: $timepicker.$date && $timepicker.$isSelected(second, 2),
              disabled: $timepicker.$isDisabled(second, 2)
            });
          }
          var rows = [];
          for (i = 0; i < options.length; i++) {
            if (showSeconds) {
              rows.push([ hours[i], minutes[i], seconds[i] ]);
            } else {
              rows.push([ hours[i], minutes[i] ]);
            }
          }
          scope.rows = rows;
          scope.showSeconds = showSeconds;
          scope.showAM = showAM;
          scope.isAM = ($timepicker.$date || hours[midIndex].date).getHours() < 12;
          scope.timeSeparator = timeSeparator;
          $timepicker.$isBuilt = true;
        };
        $timepicker.$isSelected = function(date, index) {
          if (!$timepicker.$date) return false; else if (index === 0) {
            return date.getHours() === $timepicker.$date.getHours();
          } else if (index === 1) {
            return date.getMinutes() === $timepicker.$date.getMinutes();
          } else if (index === 2) {
            return date.getSeconds() === $timepicker.$date.getSeconds();
          }
        };
        $timepicker.$isDisabled = function(date, index) {
          var selectedTime;
          if (index === 0) {
            selectedTime = date.getTime() + viewDate.minute * 6e4 + viewDate.second * 1e3;
          } else if (index === 1) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.second * 1e3;
          } else if (index === 2) {
            selectedTime = date.getTime() + viewDate.hour * 36e5 + viewDate.minute * 6e4;
          }
          return selectedTime < options.minTime * 1 || selectedTime > options.maxTime * 1;
        };
        scope.$arrowAction = function(value, index) {
          if (options.arrowBehavior === 'picker') {
            $timepicker.$setTimeByStep(value, index);
          } else {
            $timepicker.$moveIndex(value, index);
          }
        };
        $timepicker.$setTimeByStep = function(value, index) {
          var newDate = new Date($timepicker.$date || startDate);
          var hours = newDate.getHours();
          var minutes = newDate.getMinutes();
          var seconds = newDate.getSeconds();
          if (index === 0) {
            newDate.setHours(hours - parseInt(options.hourStep, 10) * value);
          } else if (index === 1) {
            newDate.setMinutes(minutes - parseInt(options.minuteStep, 10) * value);
          } else if (index === 2) {
            newDate.setSeconds(seconds - parseInt(options.secondStep, 10) * value);
          }
          $timepicker.select(newDate, index, true);
        };
        $timepicker.$moveIndex = function(value, index) {
          var targetDate;
          if (index === 0) {
            targetDate = new Date(1970, 0, 1, viewDate.hour + value * options.length, viewDate.minute, viewDate.second);
            angular.extend(viewDate, {
              hour: targetDate.getHours()
            });
          } else if (index === 1) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute + value * options.length * options.minuteStep, viewDate.second);
            angular.extend(viewDate, {
              minute: targetDate.getMinutes()
            });
          } else if (index === 2) {
            targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute, viewDate.second + value * options.length * options.secondStep);
            angular.extend(viewDate, {
              second: targetDate.getSeconds()
            });
          }
          $timepicker.$build();
        };
        $timepicker.$onMouseDown = function(evt) {
          if (evt.target.nodeName.toLowerCase() !== 'input') evt.preventDefault();
          evt.stopPropagation();
          if (isTouch) {
            var targetEl = angular.element(evt.target);
            if (targetEl[0].nodeName.toLowerCase() !== 'button') {
              targetEl = targetEl.parent();
            }
            targetEl.triggerHandler('click');
          }
        };
        $timepicker.$onKeyDown = function(evt) {
          if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) return;
          evt.preventDefault();
          evt.stopPropagation();
          if (evt.keyCode === 13) {
            $timepicker.hide(true);
            return;
          }
          var newDate = new Date($timepicker.$date);
          var hours = newDate.getHours();
          var hoursLength = formatDate(newDate, hoursFormat).length;
          var minutes = newDate.getMinutes();
          var minutesLength = formatDate(newDate, minutesFormat).length;
          var seconds = newDate.getSeconds();
          var secondsLength = formatDate(newDate, secondsFormat).length;
          var sepLength = 1;
          var lateralMove = /(37|39)/.test(evt.keyCode);
          var count = 2 + showSeconds * 1 + showAM * 1;
          if (lateralMove) {
            if (evt.keyCode === 37) selectedIndex = selectedIndex < 1 ? count - 1 : selectedIndex - 1; else if (evt.keyCode === 39) selectedIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
          }
          var selectRange = [ 0, hoursLength ];
          var incr = 0;
          if (evt.keyCode === 38) incr = -1;
          if (evt.keyCode === 40) incr = +1;
          var isSeconds = selectedIndex === 2 && showSeconds;
          var isMeridian = selectedIndex === 2 && !showSeconds || selectedIndex === 3 && showSeconds;
          if (selectedIndex === 0) {
            newDate.setHours(hours + incr * parseInt(options.hourStep, 10));
            hoursLength = formatDate(newDate, hoursFormat).length;
            selectRange = [ 0, hoursLength ];
          } else if (selectedIndex === 1) {
            newDate.setMinutes(minutes + incr * parseInt(options.minuteStep, 10));
            minutesLength = formatDate(newDate, minutesFormat).length;
            selectRange = [ hoursLength + sepLength, minutesLength ];
          } else if (isSeconds) {
            newDate.setSeconds(seconds + incr * parseInt(options.secondStep, 10));
            secondsLength = formatDate(newDate, secondsFormat).length;
            selectRange = [ hoursLength + sepLength + minutesLength + sepLength, secondsLength ];
          } else if (isMeridian) {
            if (!lateralMove) $timepicker.switchMeridian();
            selectRange = [ hoursLength + sepLength + minutesLength + sepLength + (secondsLength + sepLength) * showSeconds, 2 ];
          }
          $timepicker.select(newDate, selectedIndex, true);
          createSelection(selectRange[0], selectRange[1]);
          parentScope.$digest();
        };
        function createSelection(start, length) {
          var end = start + length;
          if (element[0].createTextRange) {
            var selRange = element[0].createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
          } else if (element[0].setSelectionRange) {
            element[0].setSelectionRange(start, end);
          } else if (angular.isUndefined(element[0].selectionStart)) {
            element[0].selectionStart = start;
            element[0].selectionEnd = end;
          }
        }
        function focusElement() {
          element[0].focus();
        }
        var _init = $timepicker.init;
        $timepicker.init = function() {
          if (isNative && options.useNative) {
            element.prop('type', 'time');
            element.css('-webkit-appearance', 'textfield');
            return;
          } else if (isTouch) {
            element.prop('type', 'text');
            element.attr('readonly', 'true');
            element.on('click', focusElement);
          }
          _init();
        };
        var _destroy = $timepicker.destroy;
        $timepicker.destroy = function() {
          if (isNative && options.useNative) {
            element.off('click', focusElement);
          }
          _destroy();
        };
        var _show = $timepicker.show;
        $timepicker.show = function() {
          if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
          _show();
          $timeout(function() {
            if ($timepicker.$element) $timepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
            if (options.keyboard) {
              if (element) element.on('keydown', $timepicker.$onKeyDown);
            }
          }, 0, false);
        };
        var _hide = $timepicker.hide;
        $timepicker.hide = function(blur) {
          if (!$timepicker.$isShown) return;
          if ($timepicker.$element) $timepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
          if (options.keyboard) {
            if (element) element.off('keydown', $timepicker.$onKeyDown);
          }
          _hide(blur);
        };
        return $timepicker;
      }
      timepickerFactory.defaults = defaults;
      return timepickerFactory;
    } ];
  }).directive('bsTimepicker', [ '$window', '$parse', '$q', '$dateFormatter', '$dateParser', '$timepicker', function($window, $parse, $q, $dateFormatter, $dateParser, $timepicker) {
    var defaults = $timepicker.defaults;
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'autoclose', 'timeType', 'timeFormat', 'timezone', 'modelTimeFormat', 'useNative', 'hourStep', 'minuteStep', 'secondStep', 'length', 'arrowBehavior', 'iconUp', 'iconDown', 'roundDisplay', 'id', 'prefixClass', 'prefixEvent' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoclose', 'useNative', 'roundDisplay' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
            options[key] = false;
          }
        });
        if (isNative && (options.useNative || defaults.useNative)) options.timeFormat = 'HH:mm';
        var timepicker = $timepicker(element, controller, options);
        options = timepicker.$options;
        var lang = options.lang;
        var formatDate = function(date, format, timezone) {
          return $dateFormatter.formatDate(date, format, lang, timezone);
        };
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!timepicker || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(timepicker),?/i);
            if (newValue === true) {
              timepicker.show();
            } else {
              timepicker.hide();
            }
          });
        }
        var dateParser = $dateParser({
          format: options.timeFormat,
          lang: lang
        });
        angular.forEach([ 'minTime', 'maxTime' ], function(key) {
          if (angular.isDefined(attr[key])) {
            attr.$observe(key, function(newValue) {
              timepicker.$options[key] = dateParser.getTimeForAttribute(key, newValue);
              if (!isNaN(timepicker.$options[key])) timepicker.$build();
              validateAgainstMinMaxTime(controller.$dateValue);
            });
          }
        });
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          timepicker.update(controller.$dateValue);
        }, true);
        function validateAgainstMinMaxTime(parsedTime) {
          if (!angular.isDate(parsedTime)) return;
          var isMinValid = isNaN(options.minTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) >= options.minTime;
          var isMaxValid = isNaN(options.maxTime) || new Date(parsedTime.getTime()).setFullYear(1970, 0, 1) <= options.maxTime;
          var isValid = isMinValid && isMaxValid;
          controller.$setValidity('date', isValid);
          controller.$setValidity('min', isMinValid);
          controller.$setValidity('max', isMaxValid);
          if (!isValid) {
            return;
          }
          controller.$dateValue = parsedTime;
        }
        controller.$parsers.unshift(function(viewValue) {
          var date;
          if (!viewValue) {
            controller.$setValidity('date', true);
            return null;
          }
          var parsedTime = angular.isDate(viewValue) ? viewValue : dateParser.parse(viewValue, controller.$dateValue);
          if (!parsedTime || isNaN(parsedTime.getTime())) {
            controller.$setValidity('date', false);
            return undefined;
          }
          validateAgainstMinMaxTime(parsedTime);
          if (options.timeType === 'string') {
            date = dateParser.timezoneOffsetAdjust(parsedTime, options.timezone, true);
            return formatDate(date, options.modelTimeFormat || options.timeFormat);
          }
          date = dateParser.timezoneOffsetAdjust(controller.$dateValue, options.timezone, true);
          if (options.timeType === 'number') {
            return date.getTime();
          } else if (options.timeType === 'unix') {
            return date.getTime() / 1e3;
          } else if (options.timeType === 'iso') {
            return date.toISOString();
          }
          return new Date(date);
        });
        controller.$formatters.push(function(modelValue) {
          var date;
          if (angular.isUndefined(modelValue) || modelValue === null) {
            date = NaN;
          } else if (angular.isDate(modelValue)) {
            date = modelValue;
          } else if (options.timeType === 'string') {
            date = dateParser.parse(modelValue, null, options.modelTimeFormat);
          } else if (options.timeType === 'unix') {
            date = new Date(modelValue * 1e3);
          } else {
            date = new Date(modelValue);
          }
          controller.$dateValue = dateParser.timezoneOffsetAdjust(date, options.timezone);
          return getTimeFormattedString();
        });
        controller.$render = function() {
          element.val(getTimeFormattedString());
        };
        function getTimeFormattedString() {
          return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.timeFormat);
        }
        scope.$on('$destroy', function() {
          if (timepicker) timepicker.destroy();
          options = null;
          timepicker = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.tab', []).provider('$tab', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      template: 'tab/tab.tpl.html',
      navClass: 'nav-tabs',
      activeClass: 'active'
    };
    var controller = this.controller = function($scope, $element, $attrs) {
      var self = this;
      self.$options = angular.copy(defaults);
      angular.forEach([ 'animation', 'navClass', 'activeClass' ], function(key) {
        if (angular.isDefined($attrs[key])) self.$options[key] = $attrs[key];
      });
      $scope.$navClass = self.$options.navClass;
      $scope.$activeClass = self.$options.activeClass;
      self.$panes = $scope.$panes = [];
      self.$activePaneChangeListeners = self.$viewChangeListeners = [];
      self.$push = function(pane) {
        if (angular.isUndefined(self.$panes.$active)) {
          $scope.$setActive(pane.name || 0);
        }
        self.$panes.push(pane);
      };
      self.$remove = function(pane) {
        var index = self.$panes.indexOf(pane);
        var active = self.$panes.$active;
        var activeIndex;
        if (angular.isString(active)) {
          activeIndex = self.$panes.map(function(pane) {
            return pane.name;
          }).indexOf(active);
        } else {
          activeIndex = self.$panes.$active;
        }
        self.$panes.splice(index, 1);
        if (index < activeIndex) {
          activeIndex--;
        } else if (index === activeIndex && activeIndex === self.$panes.length) {
          activeIndex--;
        }
        if (activeIndex >= 0 && activeIndex < self.$panes.length) {
          self.$setActive(self.$panes[activeIndex].name || activeIndex);
        } else {
          self.$setActive();
        }
      };
      self.$setActive = $scope.$setActive = function(value) {
        self.$panes.$active = value;
        self.$activePaneChangeListeners.forEach(function(fn) {
          fn();
        });
      };
      self.$isActive = $scope.$isActive = function($pane, $index) {
        return self.$panes.$active === $pane.name || self.$panes.$active === $index;
      };
    };
    this.$get = function() {
      var $tab = {};
      $tab.defaults = defaults;
      $tab.controller = controller;
      return $tab;
    };
  }).directive('bsTabs', [ '$window', '$animate', '$tab', '$parse', function($window, $animate, $tab, $parse) {
    var defaults = $tab.defaults;
    return {
      require: [ '?ngModel', 'bsTabs' ],
      transclude: true,
      scope: true,
      controller: [ '$scope', '$element', '$attrs', $tab.controller ],
      templateUrl: function(element, attr) {
        return attr.template || defaults.template;
      },
      link: function postLink(scope, element, attrs, controllers) {
        var ngModelCtrl = controllers[0];
        var bsTabsCtrl = controllers[1];
        if (ngModelCtrl) {
          bsTabsCtrl.$activePaneChangeListeners.push(function() {
            ngModelCtrl.$setViewValue(bsTabsCtrl.$panes.$active);
          });
          ngModelCtrl.$formatters.push(function(modelValue) {
            bsTabsCtrl.$setActive(modelValue);
            return modelValue;
          });
        }
        if (attrs.bsActivePane) {
          var parsedBsActivePane = $parse(attrs.bsActivePane);
          bsTabsCtrl.$activePaneChangeListeners.push(function() {
            parsedBsActivePane.assign(scope, bsTabsCtrl.$panes.$active);
          });
          scope.$watch(attrs.bsActivePane, function(newValue, oldValue) {
            bsTabsCtrl.$setActive(newValue);
          }, true);
        }
      }
    };
  } ]).directive('bsPane', [ '$window', '$animate', '$sce', function($window, $animate, $sce) {
    return {
      require: [ '^?ngModel', '^bsTabs' ],
      scope: true,
      link: function postLink(scope, element, attrs, controllers) {
        var bsTabsCtrl = controllers[1];
        element.addClass('tab-pane');
        attrs.$observe('title', function(newValue, oldValue) {
          scope.title = $sce.trustAsHtml(newValue);
        });
        scope.name = attrs.name;
        if (bsTabsCtrl.$options.animation) {
          element.addClass(bsTabsCtrl.$options.animation);
        }
        attrs.$observe('disabled', function(newValue, oldValue) {
          scope.disabled = scope.$eval(newValue);
        });
        bsTabsCtrl.$push(scope);
        scope.$on('$destroy', function() {
          bsTabsCtrl.$remove(scope);
        });
        function render() {
          var index = bsTabsCtrl.$panes.indexOf(scope);
          $animate[bsTabsCtrl.$isActive(scope, index) ? 'addClass' : 'removeClass'](element, bsTabsCtrl.$options.activeClass);
        }
        bsTabsCtrl.$activePaneChangeListeners.push(function() {
          render();
        });
        render();
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.select', [ 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.helpers.parseOptions' ]).provider('$select', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'select',
      prefixEvent: '$select',
      placement: 'bottom-left',
      templateUrl: 'select/select.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      multiple: false,
      allNoneButtons: false,
      sort: true,
      caretHtml: '&nbsp;<span class="caret"></span>',
      placeholder: 'Choose among the following...',
      allText: 'All',
      noneText: 'None',
      maxLength: 3,
      maxLengthHtml: 'selected',
      iconCheckmark: 'glyphicon glyphicon-ok'
    };
    this.$get = [ '$window', '$document', '$rootScope', '$tooltip', '$timeout', function($window, $document, $rootScope, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      function SelectFactory(element, controller, config) {
        var $select = {};
        var options = angular.extend({}, defaults, config);
        $select = $tooltip(element, options);
        var scope = $select.$scope;
        scope.$matches = [];
        if (options.multiple) {
          scope.$activeIndex = [];
        } else {
          scope.$activeIndex = -1;
        }
        scope.$isMultiple = options.multiple;
        scope.$showAllNoneButtons = options.allNoneButtons && options.multiple;
        scope.$iconCheckmark = options.iconCheckmark;
        scope.$allText = options.allText;
        scope.$noneText = options.noneText;
        scope.$activate = function(index) {
          scope.$$postDigest(function() {
            $select.activate(index);
          });
        };
        scope.$select = function(index, evt) {
          scope.$$postDigest(function() {
            $select.select(index);
          });
        };
        scope.$isVisible = function() {
          return $select.$isVisible();
        };
        scope.$isActive = function(index) {
          return $select.$isActive(index);
        };
        scope.$selectAll = function() {
          for (var i = 0; i < scope.$matches.length; i++) {
            if (!scope.$isActive(i)) {
              scope.$select(i);
            }
          }
        };
        scope.$selectNone = function() {
          for (var i = 0; i < scope.$matches.length; i++) {
            if (scope.$isActive(i)) {
              scope.$select(i);
            }
          }
        };
        $select.update = function(matches) {
          scope.$matches = matches;
          $select.$updateActiveIndex();
        };
        $select.activate = function(index) {
          if (options.multiple) {
            if ($select.$isActive(index)) {
              scope.$activeIndex.splice(scope.$activeIndex.indexOf(index), 1);
            } else {
              scope.$activeIndex.push(index);
            }
            if (options.sort) scope.$activeIndex.sort(function(a, b) {
              return a - b;
            });
          } else {
            scope.$activeIndex = index;
          }
          return scope.$activeIndex;
        };
        $select.select = function(index) {
          var value = scope.$matches[index].value;
          scope.$apply(function() {
            $select.activate(index);
            if (options.multiple) {
              controller.$setViewValue(scope.$activeIndex.map(function(index) {
                if (angular.isUndefined(scope.$matches[index])) {
                  return null;
                }
                return scope.$matches[index].value;
              }));
            } else {
              controller.$setViewValue(value);
              $select.hide();
            }
          });
          scope.$emit(options.prefixEvent + '.select', value, index, $select);
        };
        $select.$updateActiveIndex = function() {
          if (options.multiple) {
            if (angular.isArray(controller.$modelValue)) {
              scope.$activeIndex = controller.$modelValue.map(function(value) {
                return $select.$getIndex(value);
              });
            } else {
              scope.$activeIndex = [];
            }
          } else {
            if (angular.isDefined(controller.$modelValue) && scope.$matches.length) {
              scope.$activeIndex = $select.$getIndex(controller.$modelValue);
            } else {
              scope.$activeIndex = -1;
            }
          }
        };
        $select.$isVisible = function() {
          if (!options.minLength || !controller) {
            return scope.$matches.length;
          }
          return scope.$matches.length && controller.$viewValue.length >= options.minLength;
        };
        $select.$isActive = function(index) {
          if (options.multiple) {
            return scope.$activeIndex.indexOf(index) !== -1;
          }
          return scope.$activeIndex === index;
        };
        $select.$getIndex = function(value) {
          var index;
          for (index = scope.$matches.length; index--; ) {
            if (angular.equals(scope.$matches[index].value, value)) break;
          }
          return index;
        };
        $select.$onMouseDown = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          if (isTouch) {
            var targetEl = angular.element(evt.target);
            targetEl.triggerHandler('click');
          }
        };
        $select.$onKeyDown = function(evt) {
          if (!/(9|13|38|40)/.test(evt.keyCode)) return;
          if (evt.keyCode !== 9) {
            evt.preventDefault();
            evt.stopPropagation();
          }
          if (options.multiple && evt.keyCode === 9) {
            return $select.hide();
          }
          if (!options.multiple && (evt.keyCode === 13 || evt.keyCode === 9)) {
            return $select.select(scope.$activeIndex);
          }
          if (!options.multiple) {
            if (evt.keyCode === 38 && scope.$activeIndex > 0) scope.$activeIndex--; else if (evt.keyCode === 38 && scope.$activeIndex < 0) scope.$activeIndex = scope.$matches.length - 1; else if (evt.keyCode === 40 && scope.$activeIndex < scope.$matches.length - 1) scope.$activeIndex++; else if (angular.isUndefined(scope.$activeIndex)) scope.$activeIndex = 0;
            scope.$digest();
          }
        };
        $select.$isIE = function() {
          var ua = $window.navigator.userAgent;
          return ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0;
        };
        $select.$selectScrollFix = function(e) {
          if ($document[0].activeElement.tagName === 'UL') {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.target.focus();
          }
        };
        var _show = $select.show;
        $select.show = function() {
          _show();
          if (options.multiple) {
            $select.$element.addClass('select-multiple');
          }
          $timeout(function() {
            $select.$element.on(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
            if (options.keyboard) {
              element.on('keydown', $select.$onKeyDown);
            }
          }, 0, false);
        };
        var _hide = $select.hide;
        $select.hide = function() {
          if (!options.multiple && angular.isUndefined(controller.$modelValue)) {
            scope.$activeIndex = -1;
          }
          $select.$element.off(isTouch ? 'touchstart' : 'mousedown', $select.$onMouseDown);
          if (options.keyboard) {
            element.off('keydown', $select.$onKeyDown);
          }
          _hide(true);
        };
        return $select;
      }
      SelectFactory.defaults = defaults;
      return SelectFactory;
    } ];
  }).directive('bsSelect', [ '$window', '$parse', '$q', '$select', '$parseOptions', function($window, $parse, $q, $select, $parseOptions) {
    var defaults = $select.defaults;
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope,
          placeholder: defaults.placeholder
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'placeholder', 'allNoneButtons', 'maxLength', 'maxLengthHtml', 'allText', 'noneText', 'iconCheckmark', 'autoClose', 'id', 'sort', 'caretHtml', 'prefixClass', 'prefixEvent' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'allNoneButtons', 'sort' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
            options[key] = false;
          }
        });
        var dataMultiple = element.attr('data-multiple');
        if (angular.isDefined(dataMultiple)) {
          if (falseValueRegExp.test(dataMultiple)) {
            options.multiple = false;
          } else {
            options.multiple = dataMultiple;
          }
        }
        if (element[0].nodeName.toLowerCase() === 'select') {
          var inputEl = element;
          inputEl.css('display', 'none');
          element = angular.element('<button type="button" class="btn btn-default"></button>');
          inputEl.after(element);
        }
        var parsedOptions = $parseOptions(attr.bsOptions);
        var select = $select(element, controller, options);
        if (select.$isIE()) {
          element[0].addEventListener('blur', select.$selectScrollFix);
        }
        var watchedOptions = parsedOptions.$match[7].replace(/\|.+/, '').trim();
        scope.$watch(watchedOptions, function(newValue, oldValue) {
          parsedOptions.valuesFn(scope, controller).then(function(values) {
            select.update(values);
            controller.$render();
          });
        }, true);
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          select.$updateActiveIndex();
          controller.$render();
        }, true);
        controller.$render = function() {
          var selected;
          var index;
          if (options.multiple && angular.isArray(controller.$modelValue)) {
            selected = controller.$modelValue.map(function(value) {
              index = select.$getIndex(value);
              return index !== -1 ? select.$scope.$matches[index].label : false;
            }).filter(angular.isDefined);
            if (selected.length > (options.maxLength || defaults.maxLength)) {
              selected = selected.length + ' ' + (options.maxLengthHtml || defaults.maxLengthHtml);
            } else {
              selected = selected.join(', ');
            }
          } else {
            index = select.$getIndex(controller.$modelValue);
            selected = index !== -1 ? select.$scope.$matches[index].label : false;
          }
          element.html((selected || options.placeholder) + (options.caretHtml || defaults.caretHtml));
        };
        if (options.multiple) {
          controller.$isEmpty = function(value) {
            return !value || value.length === 0;
          };
        }
        scope.$on('$destroy', function() {
          if (select) select.destroy();
          options = null;
          select = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.scrollspy', [ 'mgcrea.ngStrap.helpers.debounce', 'mgcrea.ngStrap.helpers.dimensions' ]).provider('$scrollspy', function() {
    var spies = this.$$spies = {};
    var defaults = this.defaults = {
      debounce: 150,
      throttle: 100,
      offset: 100
    };
    this.$get = [ '$window', '$document', '$rootScope', 'dimensions', 'debounce', 'throttle', function($window, $document, $rootScope, dimensions, debounce, throttle) {
      var windowEl = angular.element($window);
      var docEl = angular.element($document.prop('documentElement'));
      var bodyEl = angular.element($window.document.body);
      function nodeName(element, name) {
        return element[0].nodeName && element[0].nodeName.toLowerCase() === name.toLowerCase();
      }
      function ScrollSpyFactory(config) {
        var options = angular.extend({}, defaults, config);
        if (!options.element) options.element = bodyEl;
        var isWindowSpy = nodeName(options.element, 'body');
        var scrollEl = isWindowSpy ? windowEl : options.element;
        var scrollId = isWindowSpy ? 'window' : options.id;
        if (spies[scrollId]) {
          spies[scrollId].$$count++;
          return spies[scrollId];
        }
        var $scrollspy = {};
        var unbindViewContentLoaded;
        var unbindIncludeContentLoaded;
        var trackedElements = $scrollspy.$trackedElements = [];
        var sortedElements = [];
        var activeTarget;
        var debouncedCheckPosition;
        var throttledCheckPosition;
        var debouncedCheckOffsets;
        var viewportHeight;
        var scrollTop;
        $scrollspy.init = function() {
          this.$$count = 1;
          debouncedCheckPosition = debounce(this.checkPosition, options.debounce);
          throttledCheckPosition = throttle(this.checkPosition, options.throttle);
          scrollEl.on('click', this.checkPositionWithEventLoop);
          windowEl.on('resize', debouncedCheckPosition);
          scrollEl.on('scroll', throttledCheckPosition);
          debouncedCheckOffsets = debounce(this.checkOffsets, options.debounce);
          unbindViewContentLoaded = $rootScope.$on('$viewContentLoaded', debouncedCheckOffsets);
          unbindIncludeContentLoaded = $rootScope.$on('$includeContentLoaded', debouncedCheckOffsets);
          debouncedCheckOffsets();
          if (scrollId) {
            spies[scrollId] = $scrollspy;
          }
        };
        $scrollspy.destroy = function() {
          this.$$count--;
          if (this.$$count > 0) {
            return;
          }
          scrollEl.off('click', this.checkPositionWithEventLoop);
          windowEl.off('resize', debouncedCheckPosition);
          scrollEl.off('scroll', throttledCheckPosition);
          unbindViewContentLoaded();
          unbindIncludeContentLoaded();
          if (scrollId) {
            delete spies[scrollId];
          }
        };
        $scrollspy.checkPosition = function() {
          if (!sortedElements.length) return;
          scrollTop = (isWindowSpy ? $window.pageYOffset : scrollEl.prop('scrollTop')) || 0;
          viewportHeight = Math.max($window.innerHeight, docEl.prop('clientHeight'));
          if (scrollTop < sortedElements[0].offsetTop && activeTarget !== sortedElements[0].target) {
            return $scrollspy.$activateElement(sortedElements[0]);
          }
          for (var i = sortedElements.length; i--; ) {
            if (angular.isUndefined(sortedElements[i].offsetTop) || sortedElements[i].offsetTop === null) continue;
            if (activeTarget === sortedElements[i].target) continue;
            if (scrollTop < sortedElements[i].offsetTop) continue;
            if (sortedElements[i + 1] && scrollTop > sortedElements[i + 1].offsetTop) continue;
            return $scrollspy.$activateElement(sortedElements[i]);
          }
        };
        $scrollspy.checkPositionWithEventLoop = function() {
          setTimeout($scrollspy.checkPosition, 1);
        };
        $scrollspy.$activateElement = function(element) {
          if (activeTarget) {
            var activeElement = $scrollspy.$getTrackedElement(activeTarget);
            if (activeElement) {
              activeElement.source.removeClass('active');
              if (nodeName(activeElement.source, 'li') && nodeName(activeElement.source.parent().parent(), 'li')) {
                activeElement.source.parent().parent().removeClass('active');
              }
            }
          }
          activeTarget = element.target;
          element.source.addClass('active');
          if (nodeName(element.source, 'li') && nodeName(element.source.parent().parent(), 'li')) {
            element.source.parent().parent().addClass('active');
          }
        };
        $scrollspy.$getTrackedElement = function(target) {
          return trackedElements.filter(function(obj) {
            return obj.target === target;
          })[0];
        };
        $scrollspy.checkOffsets = function() {
          angular.forEach(trackedElements, function(trackedElement) {
            var targetElement = document.querySelector(trackedElement.target);
            trackedElement.offsetTop = targetElement ? dimensions.offset(targetElement).top : null;
            if (options.offset && trackedElement.offsetTop !== null) trackedElement.offsetTop -= options.offset * 1;
          });
          sortedElements = trackedElements.filter(function(el) {
            return el.offsetTop !== null;
          }).sort(function(a, b) {
            return a.offsetTop - b.offsetTop;
          });
          debouncedCheckPosition();
        };
        $scrollspy.trackElement = function(target, source) {
          trackedElements.push({
            target: target,
            source: source
          });
        };
        $scrollspy.untrackElement = function(target, source) {
          var toDelete;
          for (var i = trackedElements.length; i--; ) {
            if (trackedElements[i].target === target && trackedElements[i].source === source) {
              toDelete = i;
              break;
            }
          }
          trackedElements.splice(toDelete, 1);
        };
        $scrollspy.activate = function(i) {
          trackedElements[i].addClass('active');
        };
        $scrollspy.init();
        return $scrollspy;
      }
      return ScrollSpyFactory;
    } ];
  }).directive('bsScrollspy', [ '$rootScope', 'debounce', 'dimensions', '$scrollspy', function($rootScope, debounce, dimensions, $scrollspy) {
    return {
      restrict: 'EAC',
      link: function postLink(scope, element, attr) {
        var options = {
          scope: scope
        };
        angular.forEach([ 'offset', 'target' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var scrollspy = $scrollspy(options);
        scrollspy.trackElement(options.target, element);
        scope.$on('$destroy', function() {
          if (scrollspy) {
            scrollspy.untrackElement(options.target, element);
            scrollspy.destroy();
          }
          options = null;
          scrollspy = null;
        });
      }
    };
  } ]).directive('bsScrollspyList', [ '$rootScope', 'debounce', 'dimensions', '$scrollspy', function($rootScope, debounce, dimensions, $scrollspy) {
    return {
      restrict: 'A',
      compile: function postLink(element, attr) {
        var children = element[0].querySelectorAll('li > a[href]');
        angular.forEach(children, function(child) {
          var childEl = angular.element(child);
          childEl.parent().attr('bs-scrollspy', '').attr('data-target', childEl.attr('href'));
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.popover', [ 'mgcrea.ngStrap.tooltip' ]).provider('$popover', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      container: false,
      target: false,
      placement: 'right',
      templateUrl: 'popover/popover.tpl.html',
      contentTemplate: false,
      trigger: 'click',
      keyboard: true,
      html: false,
      title: '',
      content: '',
      delay: 0,
      autoClose: false
    };
    this.$get = [ '$tooltip', function($tooltip) {
      function PopoverFactory(element, config) {
        var options = angular.extend({}, defaults, config);
        var $popover = $tooltip(element, options);
        if (options.content) {
          $popover.$scope.content = options.content;
        }
        return $popover;
      }
      return PopoverFactory;
    } ];
  }).directive('bsPopover', [ '$window', '$sce', '$popover', function($window, $sce, $popover) {
    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr) {
        var popover;
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'customClass', 'autoClose', 'id', 'prefixClass', 'prefixEvent' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoClose' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        var dataTarget = element.attr('data-target');
        if (angular.isDefined(dataTarget)) {
          if (falseValueRegExp.test(dataTarget)) {
            options.target = false;
          } else {
            options.target = dataTarget;
          }
        }
        angular.forEach([ 'title', 'content' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
              if (angular.isDefined(oldValue)) {
                requestAnimationFrame(function() {
                  if (popover) popover.$applyPlacement();
                });
              }
            });
          }
        });
        if (attr.bsPopover) {
          scope.$watch(attr.bsPopover, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
            if (angular.isDefined(oldValue)) {
              requestAnimationFrame(function() {
                if (popover) popover.$applyPlacement();
              });
            }
          }, true);
        }
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!popover || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(popover),?/i);
            if (newValue === true) {
              popover.show();
            } else {
              popover.hide();
            }
          });
        }
        if (attr.viewport) {
          scope.$watch(attr.viewport, function(newValue) {
            if (!popover || !angular.isDefined(newValue)) return;
            popover.setViewport(newValue);
          });
        }
        popover = $popover(element, options);
        scope.$on('$destroy', function() {
          if (popover) popover.destroy();
          options = null;
          popover = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.navbar', []).provider('$navbar', function() {
    var defaults = this.defaults = {
      activeClass: 'active',
      routeAttr: 'data-match-route',
      strict: false
    };
    this.$get = function() {
      return {
        defaults: defaults
      };
    };
  }).directive('bsNavbar', [ '$window', '$location', '$navbar', function($window, $location, $navbar) {
    var defaults = $navbar.defaults;
    return {
      restrict: 'A',
      link: function postLink(scope, element, attr, controller) {
        var options = angular.copy(defaults);
        angular.forEach(Object.keys(defaults), function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        scope.$watch(function() {
          return $location.path();
        }, function(newValue, oldValue) {
          var liElements = element[0].querySelectorAll('li[' + options.routeAttr + ']');
          angular.forEach(liElements, function(li) {
            var liElement = angular.element(li);
            var pattern = liElement.attr(options.routeAttr).replace('/', '\\/');
            if (options.strict) {
              pattern = '^' + pattern + '$';
            }
            var regexp = new RegExp(pattern, 'i');
            if (regexp.test(newValue)) {
              liElement.addClass(options.activeClass);
            } else {
              liElement.removeClass(options.activeClass);
            }
          });
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.dropdown', [ 'mgcrea.ngStrap.tooltip' ]).provider('$dropdown', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'dropdown',
      prefixEvent: 'dropdown',
      placement: 'bottom-left',
      templateUrl: 'dropdown/dropdown.tpl.html',
      trigger: 'click',
      container: false,
      keyboard: true,
      html: false,
      delay: 0
    };
    this.$get = [ '$window', '$rootScope', '$tooltip', '$timeout', function($window, $rootScope, $tooltip, $timeout) {
      var bodyEl = angular.element($window.document.body);
      var matchesSelector = Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector;
      function DropdownFactory(element, config) {
        var $dropdown = {};
        var options = angular.extend({}, defaults, config);
        $dropdown.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        $dropdown = $tooltip(element, options);
        var parentEl = element.parent();
        $dropdown.$onKeyDown = function(evt) {
          if (!/(38|40)/.test(evt.keyCode)) return;
          evt.preventDefault();
          evt.stopPropagation();
          var items = angular.element($dropdown.$element[0].querySelectorAll('li:not(.divider) a'));
          if (!items.length) return;
          var index;
          angular.forEach(items, function(el, i) {
            if (matchesSelector && matchesSelector.call(el, ':focus')) index = i;
          });
          if (evt.keyCode === 38 && index > 0) index--; else if (evt.keyCode === 40 && index < items.length - 1) index++; else if (angular.isUndefined(index)) index = 0;
          items.eq(index)[0].focus();
        };
        var show = $dropdown.show;
        $dropdown.show = function() {
          show();
          $timeout(function() {
            if (options.keyboard && $dropdown.$element) $dropdown.$element.on('keydown', $dropdown.$onKeyDown);
            bodyEl.on('click', onBodyClick);
          }, 0, false);
          if (parentEl.hasClass('dropdown')) parentEl.addClass('open');
        };
        var hide = $dropdown.hide;
        $dropdown.hide = function() {
          if (!$dropdown.$isShown) return;
          if (options.keyboard && $dropdown.$element) $dropdown.$element.off('keydown', $dropdown.$onKeyDown);
          bodyEl.off('click', onBodyClick);
          if (parentEl.hasClass('dropdown')) parentEl.removeClass('open');
          hide();
        };
        var destroy = $dropdown.destroy;
        $dropdown.destroy = function() {
          bodyEl.off('click', onBodyClick);
          destroy();
        };
        function onBodyClick(evt) {
          if (evt.target === element[0]) return;
          return evt.target !== element[0] && $dropdown.hide();
        }
        return $dropdown;
      }
      return DropdownFactory;
    } ];
  }).directive('bsDropdown', [ '$window', '$sce', '$dropdown', function($window, $sce, $dropdown) {
    return {
      restrict: 'EAC',
      scope: true,
      compile: function(tElement, tAttrs) {
        if (!tAttrs.bsDropdown) {
          var nextSibling = tElement[0].nextSibling;
          while (nextSibling && nextSibling.nodeType !== 1) {
            nextSibling = nextSibling.nextSibling;
          }
          if (nextSibling && nextSibling.className.split(' ').indexOf('dropdown-menu') >= 0) {
            tAttrs.template = nextSibling.outerHTML;
            tAttrs.templateUrl = undefined;
            nextSibling.parentNode.removeChild(nextSibling);
          }
        }
        return function postLink(scope, element, attr) {
          var options = {
            scope: scope
          };
          angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'id', 'autoClose' ], function(key) {
            if (angular.isDefined(tAttrs[key])) options[key] = tAttrs[key];
          });
          var falseValueRegExp = /^(false|0|)$/i;
          angular.forEach([ 'html', 'container' ], function(key) {
            if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
          });
          if (attr.bsDropdown) {
            scope.$watch(attr.bsDropdown, function(newValue, oldValue) {
              scope.content = newValue;
            }, true);
          }
          var dropdown = $dropdown(element, options);
          if (attr.bsShow) {
            scope.$watch(attr.bsShow, function(newValue, oldValue) {
              if (!dropdown || !angular.isDefined(newValue)) return;
              if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(dropdown),?/i);
              if (newValue === true) {
                dropdown.show();
              } else {
                dropdown.hide();
              }
            });
          }
          scope.$on('$destroy', function() {
            if (dropdown) dropdown.destroy();
            options = null;
            dropdown = null;
          });
        };
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.modal', [ 'mgcrea.ngStrap.core', 'mgcrea.ngStrap.helpers.dimensions' ]).provider('$modal', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      backdropAnimation: 'am-fade',
      customClass: '',
      prefixClass: 'modal',
      prefixEvent: 'modal',
      placement: 'top',
      templateUrl: 'modal/modal.tpl.html',
      template: '',
      contentTemplate: false,
      container: false,
      element: null,
      backdrop: true,
      keyboard: true,
      html: false,
      show: true,
      size: null
    };
    this.$get = [ '$window', '$rootScope', '$bsCompiler', '$animate', '$timeout', '$sce', 'dimensions', function($window, $rootScope, $bsCompiler, $animate, $timeout, $sce, dimensions) {
      var forEach = angular.forEach;
      var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
      var bodyElement = angular.element($window.document.body);
      var backdropCount = 0;
      var dialogBaseZindex = 1050;
      var backdropBaseZindex = 1040;
      var validSizes = {
        lg: 'modal-lg',
        sm: 'modal-sm'
      };
      function ModalFactory(config) {
        var $modal = {};
        var options = $modal.$options = angular.extend({}, defaults, config);
        var promise = $modal.$promise = $bsCompiler.compile(options);
        var scope = $modal.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        if (!options.element && !options.container) {
          options.container = 'body';
        }
        $modal.$id = options.id || options.element && options.element.attr('id') || '';
        forEach([ 'title', 'content' ], function(key) {
          if (options[key]) scope[key] = $sce.trustAsHtml(options[key]);
        });
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $modal.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $modal.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $modal.toggle();
          });
        };
        $modal.$isShown = scope.$isShown = false;
        var compileData;
        var modalElement;
        var modalScope;
        var backdropElement = angular.element('<div class="' + options.prefixClass + '-backdrop"/>');
        backdropElement.css({
          position: 'fixed',
          top: '0px',
          left: '0px',
          bottom: '0px',
          right: '0px'
        });
        promise.then(function(data) {
          compileData = data;
          $modal.init();
        });
        $modal.init = function() {
          if (options.show) {
            scope.$$postDigest(function() {
              $modal.show();
            });
          }
        };
        $modal.destroy = function() {
          destroyModalElement();
          if (backdropElement) {
            backdropElement.remove();
            backdropElement = null;
          }
          scope.$destroy();
        };
        $modal.show = function() {
          if ($modal.$isShown) return;
          var parent;
          var after;
          if (angular.isElement(options.container)) {
            parent = options.container;
            after = options.container[0].lastChild ? angular.element(options.container[0].lastChild) : null;
          } else {
            if (options.container) {
              parent = findElement(options.container);
              after = parent[0] && parent[0].lastChild ? angular.element(parent[0].lastChild) : null;
            } else {
              parent = null;
              after = options.element;
            }
          }
          if (modalElement) destroyModalElement();
          modalScope = $modal.$scope.$new();
          modalElement = $modal.$element = compileData.link(modalScope, function(clonedElement, scope) {});
          if (options.backdrop) {
            modalElement.css({
              'z-index': dialogBaseZindex + backdropCount * 20
            });
            backdropElement.css({
              'z-index': backdropBaseZindex + backdropCount * 20
            });
            backdropCount++;
          }
          if (scope.$emit(options.prefixEvent + '.show.before', $modal).defaultPrevented) {
            return;
          }
          modalElement.css({
            display: 'block'
          }).addClass(options.placement);
          if (options.customClass) {
            modalElement.addClass(options.customClass);
          }
          if (options.size && validSizes[options.size]) {
            angular.element(findElement('.modal-dialog', modalElement[0])).addClass(validSizes[options.size]);
          }
          if (options.animation) {
            if (options.backdrop) {
              backdropElement.addClass(options.backdropAnimation);
            }
            modalElement.addClass(options.animation);
          }
          if (options.backdrop) {
            $animate.enter(backdropElement, bodyElement, null);
          }
          if (angular.version.minor <= 2) {
            $animate.enter(modalElement, parent, after, enterAnimateCallback);
          } else {
            $animate.enter(modalElement, parent, after).then(enterAnimateCallback);
          }
          $modal.$isShown = scope.$isShown = true;
          safeDigest(scope);
          var el = modalElement[0];
          requestAnimationFrame(function() {
            el.focus();
          });
          bodyElement.addClass(options.prefixClass + '-open');
          if (options.animation) {
            bodyElement.addClass(options.prefixClass + '-with-' + options.animation);
          }
          bindBackdropEvents();
          bindKeyboardEvents();
        };
        function enterAnimateCallback() {
          scope.$emit(options.prefixEvent + '.show', $modal);
        }
        $modal.hide = function() {
          if (!$modal.$isShown) return;
          if (options.backdrop) {
            backdropCount--;
          }
          if (scope.$emit(options.prefixEvent + '.hide.before', $modal).defaultPrevented) {
            return;
          }
          if (angular.version.minor <= 2) {
            $animate.leave(modalElement, leaveAnimateCallback);
          } else {
            $animate.leave(modalElement).then(leaveAnimateCallback);
          }
          if (options.backdrop) {
            $animate.leave(backdropElement);
          }
          $modal.$isShown = scope.$isShown = false;
          safeDigest(scope);
          unbindBackdropEvents();
          unbindKeyboardEvents();
        };
        function leaveAnimateCallback() {
          scope.$emit(options.prefixEvent + '.hide', $modal);
          bodyElement.removeClass(options.prefixClass + '-open');
          if (options.animation) {
            bodyElement.removeClass(options.prefixClass + '-with-' + options.animation);
          }
        }
        $modal.toggle = function() {
          if ($modal.$isShown) {
            $modal.hide();
          } else {
            $modal.show();
          }
        };
        $modal.focus = function() {
          modalElement[0].focus();
        };
        $modal.$onKeyUp = function(evt) {
          if (evt.which === 27 && $modal.$isShown) {
            $modal.hide();
            evt.stopPropagation();
          }
        };
        function bindBackdropEvents() {
          if (options.backdrop) {
            modalElement.on('click', hideOnBackdropClick);
            backdropElement.on('click', hideOnBackdropClick);
            backdropElement.on('wheel', preventEventDefault);
          }
        }
        function unbindBackdropEvents() {
          if (options.backdrop) {
            modalElement.off('click', hideOnBackdropClick);
            backdropElement.off('click', hideOnBackdropClick);
            backdropElement.off('wheel', preventEventDefault);
          }
        }
        function bindKeyboardEvents() {
          if (options.keyboard) {
            modalElement.on('keyup', $modal.$onKeyUp);
          }
        }
        function unbindKeyboardEvents() {
          if (options.keyboard) {
            modalElement.off('keyup', $modal.$onKeyUp);
          }
        }
        function hideOnBackdropClick(evt) {
          if (evt.target !== evt.currentTarget) return;
          if (options.backdrop === 'static') {
            $modal.focus();
          } else {
            $modal.hide();
          }
        }
        function preventEventDefault(evt) {
          evt.preventDefault();
        }
        function destroyModalElement() {
          if ($modal.$isShown && modalElement !== null) {
            unbindBackdropEvents();
            unbindKeyboardEvents();
          }
          if (modalScope) {
            modalScope.$destroy();
            modalScope = null;
          }
          if (modalElement) {
            modalElement.remove();
            modalElement = $modal.$element = null;
          }
        }
        return $modal;
      }
      function safeDigest(scope) {
        scope.$$phase || scope.$root && scope.$root.$$phase || scope.$digest();
      }
      function findElement(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      }
      return ModalFactory;
    } ];
  }).directive('bsModal', [ '$window', '$sce', '$modal', function($window, $sce, $modal) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'backdrop', 'keyboard', 'html', 'container', 'animation', 'backdropAnimation', 'id', 'prefixEvent', 'prefixClass', 'customClass', 'modalClass', 'size' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        if (options.modalClass) {
          options.customClass = options.modalClass;
        }
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'backdrop', 'keyboard', 'html', 'container' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        angular.forEach([ 'title', 'content' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
            });
          }
        });
        if (attr.bsModal) {
          scope.$watch(attr.bsModal, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
          }, true);
        }
        var modal = $modal(options);
        element.on(attr.trigger || 'click', modal.toggle);
        scope.$on('$destroy', function() {
          if (modal) modal.destroy();
          options = null;
          modal = null;
        });
      }
    };
  } ]);
  if (angular.version.minor < 3 && angular.version.dot < 14) {
    angular.module('ng').factory('$$rAF', [ '$window', '$timeout', function($window, $timeout) {
      var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame;
      var cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.mozCancelAnimationFrame || $window.webkitCancelRequestAnimationFrame;
      var rafSupported = !!requestAnimationFrame;
      var raf = rafSupported ? function(fn) {
        var id = requestAnimationFrame(fn);
        return function() {
          cancelAnimationFrame(id);
        };
      } : function(fn) {
        var timer = $timeout(fn, 16.66, false);
        return function() {
          $timeout.cancel(timer);
        };
      };
      raf.supported = rafSupported;
      return raf;
    } ]);
  }
  angular.module('mgcrea.ngStrap.helpers.parseOptions', []).provider('$parseOptions', function() {
    var defaults = this.defaults = {
      regexp: /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/
    };
    this.$get = [ '$parse', '$q', function($parse, $q) {
      function ParseOptionsFactory(attr, config) {
        var $parseOptions = {};
        var options = angular.extend({}, defaults, config);
        $parseOptions.$values = [];
        var match;
        var displayFn;
        var valueName;
        var keyName;
        var groupByFn;
        var valueFn;
        var valuesFn;
        $parseOptions.init = function() {
          $parseOptions.$match = match = attr.match(options.regexp);
          displayFn = $parse(match[2] || match[1]);
          valueName = match[4] || match[6];
          keyName = match[5];
          groupByFn = $parse(match[3] || '');
          valueFn = $parse(match[2] ? match[1] : valueName);
          valuesFn = $parse(match[7]);
        };
        $parseOptions.valuesFn = function(scope, controller) {
          return $q.when(valuesFn(scope, controller)).then(function(values) {
            if (!angular.isArray(values)) {
              values = [];
            }
            $parseOptions.$values = values.length ? parseValues(values, scope) : [];
            return $parseOptions.$values;
          });
        };
        $parseOptions.displayValue = function(modelValue) {
          var scope = {};
          scope[valueName] = modelValue;
          return displayFn(scope);
        };
        function parseValues(values, scope) {
          return values.map(function(match, index) {
            var locals = {};
            var label;
            var value;
            locals[valueName] = match;
            label = displayFn(scope, locals);
            value = valueFn(scope, locals);
            return {
              label: label,
              value: value,
              index: index
            };
          });
        }
        $parseOptions.init();
        return $parseOptions;
      }
      return ParseOptionsFactory;
    } ];
  });
  angular.module('mgcrea.ngStrap.helpers.dimensions', []).factory('dimensions', function() {
    var fn = {};
    var nodeName = fn.nodeName = function(element, name) {
      return element.nodeName && element.nodeName.toLowerCase() === name.toLowerCase();
    };
    fn.css = function(element, prop, extra) {
      var value;
      if (element.currentStyle) {
        value = element.currentStyle[prop];
      } else if (window.getComputedStyle) {
        value = window.getComputedStyle(element)[prop];
      } else {
        value = element.style[prop];
      }
      return extra === true ? parseFloat(value) || 0 : value;
    };
    fn.offset = function(element) {
      var boxRect = element.getBoundingClientRect();
      var docElement = element.ownerDocument;
      return {
        width: boxRect.width || element.offsetWidth,
        height: boxRect.height || element.offsetHeight,
        top: boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
        left: boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
      };
    };
    fn.setOffset = function(element, options, i) {
      var curPosition;
      var curLeft;
      var curCSSTop;
      var curTop;
      var curOffset;
      var curCSSLeft;
      var calculatePosition;
      var position = fn.css(element, 'position');
      var curElem = angular.element(element);
      var props = {};
      if (position === 'static') {
        element.style.position = 'relative';
      }
      curOffset = fn.offset(element);
      curCSSTop = fn.css(element, 'top');
      curCSSLeft = fn.css(element, 'left');
      calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop + curCSSLeft).indexOf('auto') > -1;
      if (calculatePosition) {
        curPosition = fn.position(element);
        curTop = curPosition.top;
        curLeft = curPosition.left;
      } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
      }
      if (angular.isFunction(options)) {
        options = options.call(element, i, curOffset);
      }
      if (options.top !== null) {
        props.top = options.top - curOffset.top + curTop;
      }
      if (options.left !== null) {
        props.left = options.left - curOffset.left + curLeft;
      }
      if ('using' in options) {
        options.using.call(curElem, props);
      } else {
        curElem.css({
          top: props.top + 'px',
          left: props.left + 'px'
        });
      }
    };
    fn.position = function(element) {
      var offsetParentRect = {
        top: 0,
        left: 0
      };
      var offsetParentEl;
      var offset;
      if (fn.css(element, 'position') === 'fixed') {
        offset = element.getBoundingClientRect();
      } else {
        offsetParentEl = offsetParentElement(element);
        offset = fn.offset(element);
        if (!nodeName(offsetParentEl, 'html')) {
          offsetParentRect = fn.offset(offsetParentEl);
        }
        offsetParentRect.top += fn.css(offsetParentEl, 'borderTopWidth', true);
        offsetParentRect.left += fn.css(offsetParentEl, 'borderLeftWidth', true);
      }
      return {
        width: element.offsetWidth,
        height: element.offsetHeight,
        top: offset.top - offsetParentRect.top - fn.css(element, 'marginTop', true),
        left: offset.left - offsetParentRect.left - fn.css(element, 'marginLeft', true)
      };
    };
    function offsetParentElement(element) {
      var docElement = element.ownerDocument;
      var offsetParent = element.offsetParent || docElement;
      if (nodeName(offsetParent, '#document')) return docElement.documentElement;
      while (offsetParent && !nodeName(offsetParent, 'html') && fn.css(offsetParent, 'position') === 'static') {
        offsetParent = offsetParent.offsetParent;
      }
      return offsetParent || docElement.documentElement;
    }
    fn.height = function(element, outer) {
      var value = element.offsetHeight;
      if (outer) {
        value += fn.css(element, 'marginTop', true) + fn.css(element, 'marginBottom', true);
      } else {
        value -= fn.css(element, 'paddingTop', true) + fn.css(element, 'paddingBottom', true) + fn.css(element, 'borderTopWidth', true) + fn.css(element, 'borderBottomWidth', true);
      }
      return value;
    };
    fn.width = function(element, outer) {
      var value = element.offsetWidth;
      if (outer) {
        value += fn.css(element, 'marginLeft', true) + fn.css(element, 'marginRight', true);
      } else {
        value -= fn.css(element, 'paddingLeft', true) + fn.css(element, 'paddingRight', true) + fn.css(element, 'borderLeftWidth', true) + fn.css(element, 'borderRightWidth', true);
      }
      return value;
    };
    return fn;
  });
  angular.module('mgcrea.ngStrap.helpers.debounce', []).factory('debounce', [ '$timeout', function($timeout) {
    return function(func, wait, immediate) {
      var timeout = null;
      return function() {
        var context = this;
        var args = arguments;
        var callNow = immediate && !timeout;
        if (timeout) {
          $timeout.cancel(timeout);
        }
        timeout = $timeout(function later() {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        }, wait, false);
        if (callNow) {
          func.apply(context, args);
        }
        return timeout;
      };
    };
  } ]).factory('throttle', [ '$timeout', function($timeout) {
    return function(func, wait, options) {
      var timeout = null;
      if (!options) options = {};
      return function() {
        var context = this;
        var args = arguments;
        if (!timeout) {
          if (options.leading !== false) {
            func.apply(context, args);
          }
          timeout = $timeout(function later() {
            timeout = null;
            if (options.trailing !== false) {
              func.apply(context, args);
            }
          }, wait, false);
        }
      };
    };
  } ]);
  angular.module('mgcrea.ngStrap.helpers.dateParser', []).provider('$dateParser', [ '$localeProvider', function($localeProvider) {
    function ParseDate() {
      this.year = 1970;
      this.month = 0;
      this.day = 1;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.milliseconds = 0;
    }
    ParseDate.prototype.setMilliseconds = function(value) {
      this.milliseconds = value;
    };
    ParseDate.prototype.setSeconds = function(value) {
      this.seconds = value;
    };
    ParseDate.prototype.setMinutes = function(value) {
      this.minutes = value;
    };
    ParseDate.prototype.setHours = function(value) {
      this.hours = value;
    };
    ParseDate.prototype.getHours = function() {
      return this.hours;
    };
    ParseDate.prototype.setDate = function(value) {
      this.day = value;
    };
    ParseDate.prototype.setMonth = function(value) {
      this.month = value;
    };
    ParseDate.prototype.setFullYear = function(value) {
      this.year = value;
    };
    ParseDate.prototype.fromDate = function(value) {
      this.year = value.getFullYear();
      this.month = value.getMonth();
      this.day = value.getDate();
      this.hours = value.getHours();
      this.minutes = value.getMinutes();
      this.seconds = value.getSeconds();
      this.milliseconds = value.getMilliseconds();
      return this;
    };
    ParseDate.prototype.toDate = function() {
      return new Date(this.year, this.month, this.day, this.hours, this.minutes, this.seconds, this.milliseconds);
    };
    var proto = ParseDate.prototype;
    function noop() {}
    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function indexOfCaseInsensitive(array, value) {
      var len = array.length;
      var str = value.toString().toLowerCase();
      for (var i = 0; i < len; i++) {
        if (array[i].toLowerCase() === str) {
          return i;
        }
      }
      return -1;
    }
    var defaults = this.defaults = {
      format: 'shortDate',
      strict: false
    };
    this.$get = [ '$locale', 'dateFilter', function($locale, dateFilter) {
      var DateParserFactory = function(config) {
        var options = angular.extend({}, defaults, config);
        var $dateParser = {};
        var regExpMap = {
          sss: '[0-9]{3}',
          ss: '[0-5][0-9]',
          s: options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
          mm: '[0-5][0-9]',
          m: options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
          HH: '[01][0-9]|2[0-3]',
          H: options.strict ? '1?[0-9]|2[0-3]' : '[01]?[0-9]|2[0-3]',
          hh: '[0][1-9]|[1][012]',
          h: options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
          a: 'AM|PM',
          EEEE: $locale.DATETIME_FORMATS.DAY.join('|'),
          EEE: $locale.DATETIME_FORMATS.SHORTDAY.join('|'),
          dd: '0[1-9]|[12][0-9]|3[01]',
          d: options.strict ? '[1-9]|[1-2][0-9]|3[01]' : '0?[1-9]|[1-2][0-9]|3[01]',
          MMMM: $locale.DATETIME_FORMATS.MONTH.join('|'),
          MMM: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
          MM: '0[1-9]|1[012]',
          M: options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
          yyyy: '[1]{1}[0-9]{3}|[2]{1}[0-9]{3}',
          yy: '[0-9]{2}',
          y: options.strict ? '-?(0|[1-9][0-9]{0,3})' : '-?0*[0-9]{1,4}'
        };
        var setFnMap = {
          sss: proto.setMilliseconds,
          ss: proto.setSeconds,
          s: proto.setSeconds,
          mm: proto.setMinutes,
          m: proto.setMinutes,
          HH: proto.setHours,
          H: proto.setHours,
          hh: proto.setHours,
          h: proto.setHours,
          EEEE: noop,
          EEE: noop,
          dd: proto.setDate,
          d: proto.setDate,
          a: function(value) {
            var hours = this.getHours() % 12;
            return this.setHours(value.match(/pm/i) ? hours + 12 : hours);
          },
          MMMM: function(value) {
            return this.setMonth(indexOfCaseInsensitive($locale.DATETIME_FORMATS.MONTH, value));
          },
          MMM: function(value) {
            return this.setMonth(indexOfCaseInsensitive($locale.DATETIME_FORMATS.SHORTMONTH, value));
          },
          MM: function(value) {
            return this.setMonth(1 * value - 1);
          },
          M: function(value) {
            return this.setMonth(1 * value - 1);
          },
          yyyy: proto.setFullYear,
          yy: function(value) {
            return this.setFullYear(2e3 + 1 * value);
          },
          y: function(value) {
            return 1 * value <= 50 && value.length === 2 ? this.setFullYear(2e3 + 1 * value) : this.setFullYear(1 * value);
          }
        };
        var regex;
        var setMap;
        $dateParser.init = function() {
          $dateParser.$format = $locale.DATETIME_FORMATS[options.format] || options.format;
          regex = regExpForFormat($dateParser.$format);
          setMap = setMapForFormat($dateParser.$format);
        };
        $dateParser.isValid = function(date) {
          if (angular.isDate(date)) return !isNaN(date.getTime());
          return regex.test(date);
        };
        $dateParser.parse = function(value, baseDate, format, timezone) {
          if (format) format = $locale.DATETIME_FORMATS[format] || format;
          if (angular.isDate(value)) value = dateFilter(value, format || $dateParser.$format, timezone);
          var formatRegex = format ? regExpForFormat(format) : regex;
          var formatSetMap = format ? setMapForFormat(format) : setMap;
          var matches = formatRegex.exec(value);
          if (!matches) return false;
          var date = baseDate && !isNaN(baseDate.getTime()) ? new ParseDate().fromDate(baseDate) : new ParseDate().fromDate(new Date(1970, 0, 1, 0));
          for (var i = 0; i < matches.length - 1; i++) {
            if (formatSetMap[i]) formatSetMap[i].call(date, matches[i + 1]);
          }
          var newDate = date.toDate();
          if (parseInt(date.day, 10) !== newDate.getDate()) {
            return false;
          }
          return newDate;
        };
        $dateParser.getDateForAttribute = function(key, value) {
          var date;
          if (value === 'today') {
            var today = new Date();
            date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (key === 'maxDate' ? 1 : 0), 0, 0, 0, key === 'minDate' ? 0 : -1);
          } else if (angular.isString(value) && value.match(/^".+"$/)) {
            date = new Date(value.substr(1, value.length - 2));
          } else if (isNumeric(value)) {
            date = new Date(parseInt(value, 10));
          } else if (angular.isString(value) && value.length === 0) {
            date = key === 'minDate' ? -Infinity : +Infinity;
          } else {
            date = new Date(value);
          }
          return date;
        };
        $dateParser.getTimeForAttribute = function(key, value) {
          var time;
          if (value === 'now') {
            time = new Date().setFullYear(1970, 0, 1);
          } else if (angular.isString(value) && value.match(/^".+"$/)) {
            time = new Date(value.substr(1, value.length - 2)).setFullYear(1970, 0, 1);
          } else if (isNumeric(value)) {
            time = new Date(parseInt(value, 10)).setFullYear(1970, 0, 1);
          } else if (angular.isString(value) && value.length === 0) {
            time = key === 'minTime' ? -Infinity : +Infinity;
          } else {
            time = $dateParser.parse(value, new Date(1970, 0, 1, 0));
          }
          return time;
        };
        $dateParser.daylightSavingAdjust = function(date) {
          if (!date) {
            return null;
          }
          date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
          return date;
        };
        $dateParser.timezoneOffsetAdjust = function(date, timezone, undo) {
          if (!date) {
            return null;
          }
          if (timezone && timezone === 'UTC') {
            date = new Date(date.getTime());
            date.setMinutes(date.getMinutes() + (undo ? -1 : 1) * date.getTimezoneOffset());
          }
          return date;
        };
        function regExpForFormat(format) {
          var re = buildDateAbstractRegex(format);
          return buildDateParseRegex(re);
        }
        function buildDateAbstractRegex(format) {
          var escapedFormat = escapeReservedSymbols(format);
          var escapedLiteralFormat = escapedFormat.replace(/''/g, '\\\'');
          var literalRegex = /('(?:\\'|.)*?')/;
          var formatParts = escapedLiteralFormat.split(literalRegex);
          var dateElements = Object.keys(regExpMap);
          var dateRegexParts = [];
          angular.forEach(formatParts, function(part) {
            if (isFormatStringLiteral(part)) {
              part = trimLiteralEscapeChars(part);
            } else {
              for (var i = 0; i < dateElements.length; i++) {
                part = part.split(dateElements[i]).join('${' + i + '}');
              }
            }
            dateRegexParts.push(part);
          });
          return dateRegexParts.join('');
        }
        function escapeReservedSymbols(text) {
          return text.replace(/\\/g, '[\\\\]').replace(/-/g, '[-]').replace(/\./g, '[.]').replace(/\*/g, '[*]').replace(/\+/g, '[+]').replace(/\?/g, '[?]').replace(/\$/g, '[$]').replace(/\^/g, '[^]').replace(/\//g, '[/]').replace(/\\s/g, '[\\s]');
        }
        function isFormatStringLiteral(text) {
          return /^'.*'$/.test(text);
        }
        function trimLiteralEscapeChars(text) {
          return text.replace(/^'(.*)'$/, '$1');
        }
        function buildDateParseRegex(abstractRegex) {
          var dateElements = Object.keys(regExpMap);
          var re = abstractRegex;
          for (var i = 0; i < dateElements.length; i++) {
            re = re.split('${' + i + '}').join('(' + regExpMap[dateElements[i]] + ')');
          }
          return new RegExp('^' + re + '$', [ 'i' ]);
        }
        function setMapForFormat(format) {
          var re = buildDateAbstractRegex(format);
          return buildDateParseValuesMap(re);
        }
        function buildDateParseValuesMap(abstractRegex) {
          var dateElements = Object.keys(regExpMap);
          var valuesRegex = new RegExp('\\${(\\d+)}', 'g');
          var valuesMatch;
          var keyIndex;
          var valueKey;
          var valueFunction;
          var valuesFunctionMap = [];
          while ((valuesMatch = valuesRegex.exec(abstractRegex)) !== null) {
            keyIndex = valuesMatch[1];
            valueKey = dateElements[keyIndex];
            valueFunction = setFnMap[valueKey];
            valuesFunctionMap.push(valueFunction);
          }
          return valuesFunctionMap;
        }
        $dateParser.init();
        return $dateParser;
      };
      return DateParserFactory;
    } ];
  } ]);
  angular.module('mgcrea.ngStrap.helpers.dateFormatter', []).service('$dateFormatter', [ '$locale', 'dateFilter', function($locale, dateFilter) {
    this.getDefaultLocale = function() {
      return $locale.id;
    };
    this.getDatetimeFormat = function(format, lang) {
      return $locale.DATETIME_FORMATS[format] || format;
    };
    this.weekdaysShort = function(lang) {
      return $locale.DATETIME_FORMATS.SHORTDAY;
    };
    function splitTimeFormat(format) {
      return /(h+)([:\.])?(m+)([:\.])?(s*)[ ]?(a?)/i.exec(format).slice(1);
    }
    this.hoursFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[0];
    };
    this.minutesFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[2];
    };
    this.secondsFormat = function(timeFormat) {
      return splitTimeFormat(timeFormat)[4];
    };
    this.timeSeparator = function(timeFormat) {
      return splitTimeFormat(timeFormat)[1];
    };
    this.showSeconds = function(timeFormat) {
      return !!splitTimeFormat(timeFormat)[4];
    };
    this.showAM = function(timeFormat) {
      return !!splitTimeFormat(timeFormat)[5];
    };
    this.formatDate = function(date, format, lang, timezone) {
      return dateFilter(date, format, timezone);
    };
  } ]);
  angular.module('mgcrea.ngStrap.core', []).service('$bsCompiler', bsCompilerService);
  function bsCompilerService($q, $http, $injector, $compile, $controller, $templateCache) {
    this.compile = function(options) {
      if (options.template && /\.html$/.test(options.template)) {
        console.warn('Deprecated use of `template` option to pass a file. Please use the `templateUrl` option instead.');
        options.templateUrl = options.template;
        options.template = '';
      }
      var templateUrl = options.templateUrl;
      var template = options.template || '';
      var controller = options.controller;
      var controllerAs = options.controllerAs;
      var resolve = angular.copy(options.resolve || {});
      var locals = angular.copy(options.locals || {});
      var transformTemplate = options.transformTemplate || angular.identity;
      var bindToController = options.bindToController;
      angular.forEach(resolve, function(value, key) {
        if (angular.isString(value)) {
          resolve[key] = $injector.get(value);
        } else {
          resolve[key] = $injector.invoke(value);
        }
      });
      angular.extend(resolve, locals);
      if (template) {
        resolve.$template = $q.when(template);
      } else if (templateUrl) {
        resolve.$template = fetchTemplate(templateUrl);
      } else {
        throw new Error('Missing `template` / `templateUrl` option.');
      }
      if (options.titleTemplate) {
        resolve.$template = $q.all([ resolve.$template, fetchTemplate(options.titleTemplate) ]).then(function(templates) {
          var templateEl = angular.element(templates[0]);
          findElement('[ng-bind="title"]', templateEl[0]).removeAttr('ng-bind').html(templates[1]);
          return templateEl[0].outerHTML;
        });
      }
      if (options.contentTemplate) {
        resolve.$template = $q.all([ resolve.$template, fetchTemplate(options.contentTemplate) ]).then(function(templates) {
          var templateEl = angular.element(templates[0]);
          var contentEl = findElement('[ng-bind="content"]', templateEl[0]).removeAttr('ng-bind').html(templates[1]);
          if (!options.templateUrl) contentEl.next().remove();
          return templateEl[0].outerHTML;
        });
      }
      return $q.all(resolve).then(function(locals) {
        var template = transformTemplate(locals.$template);
        if (options.html) {
          template = template.replace(/ng-bind="/gi, 'ng-bind-html="');
        }
        var element = angular.element('<div>').html(template.trim()).contents();
        var linkFn = $compile(element);
        return {
          locals: locals,
          element: element,
          link: function link(scope) {
            locals.$scope = scope;
            if (controller) {
              var invokeCtrl = $controller(controller, locals, true);
              if (bindToController) {
                angular.extend(invokeCtrl.instance, locals);
              }
              var ctrl = angular.isObject(invokeCtrl) ? invokeCtrl : invokeCtrl();
              element.data('$ngControllerController', ctrl);
              element.children().data('$ngControllerController', ctrl);
              if (controllerAs) {
                scope[controllerAs] = ctrl;
              }
            }
            return linkFn.apply(null, arguments);
          }
        };
      });
    };
    function findElement(query, element) {
      return angular.element((element || document).querySelectorAll(query));
    }
    var fetchPromises = {};
    function fetchTemplate(template) {
      if (fetchPromises[template]) return fetchPromises[template];
      return fetchPromises[template] = $http.get(template, {
        cache: $templateCache
      }).then(function(res) {
        return res.data;
      });
    }
  }
  angular.module('mgcrea.ngStrap.datepicker', [ 'mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.helpers.dateFormatter', 'mgcrea.ngStrap.tooltip' ]).provider('$datepicker', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'datepicker',
      placement: 'bottom-left',
      templateUrl: 'datepicker/datepicker.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      useNative: false,
      dateType: 'date',
      dateFormat: 'shortDate',
      timezone: null,
      modelDateFormat: null,
      dayFormat: 'dd',
      monthFormat: 'MMM',
      yearFormat: 'yyyy',
      monthTitleFormat: 'MMMM yyyy',
      yearTitleFormat: 'yyyy',
      strictFormat: false,
      autoclose: false,
      minDate: -Infinity,
      maxDate: +Infinity,
      startView: 0,
      minView: 0,
      startWeek: 0,
      daysOfWeekDisabled: '',
      iconLeft: 'glyphicon glyphicon-chevron-left',
      iconRight: 'glyphicon glyphicon-chevron-right'
    };
    this.$get = [ '$window', '$document', '$rootScope', '$sce', '$dateFormatter', 'datepickerViews', '$tooltip', '$timeout', function($window, $document, $rootScope, $sce, $dateFormatter, datepickerViews, $tooltip, $timeout) {
      var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
      var isTouch = 'createTouch' in $window.document && isNative;
      if (!defaults.lang) defaults.lang = $dateFormatter.getDefaultLocale();
      function DatepickerFactory(element, controller, config) {
        var $datepicker = $tooltip(element, angular.extend({}, defaults, config));
        var parentScope = config.scope;
        var options = $datepicker.$options;
        var scope = $datepicker.$scope;
        if (options.startView) options.startView -= options.minView;
        var pickerViews = datepickerViews($datepicker);
        $datepicker.$views = pickerViews.views;
        var viewDate = pickerViews.viewDate;
        scope.$mode = options.startView;
        scope.$iconLeft = options.iconLeft;
        scope.$iconRight = options.iconRight;
        var $picker = $datepicker.$views[scope.$mode];
        scope.$select = function(date) {
          $datepicker.select(date);
        };
        scope.$selectPane = function(value) {
          $datepicker.$selectPane(value);
        };
        scope.$toggleMode = function() {
          $datepicker.setMode((scope.$mode + 1) % $datepicker.$views.length);
        };
        $datepicker.update = function(date) {
          if (angular.isDate(date) && !isNaN(date.getTime())) {
            $datepicker.$date = date;
            $picker.update.call($picker, date);
          }
          $datepicker.$build(true);
        };
        $datepicker.updateDisabledDates = function(dateRanges) {
          options.disabledDateRanges = dateRanges;
          for (var i = 0, l = scope.rows.length; i < l; i++) {
            angular.forEach(scope.rows[i], $datepicker.$setDisabledEl);
          }
        };
        $datepicker.select = function(date, keep) {
          if (!angular.isDate(controller.$dateValue)) controller.$dateValue = new Date(date);
          if (!scope.$mode || keep) {
            controller.$setViewValue(angular.copy(date));
            controller.$render();
            if (options.autoclose && !keep) {
              $timeout(function() {
                $datepicker.hide(true);
              });
            }
          } else {
            angular.extend(viewDate, {
              year: date.getFullYear(),
              month: date.getMonth(),
              date: date.getDate()
            });
            $datepicker.setMode(scope.$mode - 1);
            $datepicker.$build();
          }
        };
        $datepicker.setMode = function(mode) {
          scope.$mode = mode;
          $picker = $datepicker.$views[scope.$mode];
          $datepicker.$build();
        };
        $datepicker.$build = function(pristine) {
          if (pristine === true && $picker.built) return;
          if (pristine === false && !$picker.built) return;
          $picker.build.call($picker);
        };
        $datepicker.$updateSelected = function() {
          for (var i = 0, l = scope.rows.length; i < l; i++) {
            angular.forEach(scope.rows[i], updateSelected);
          }
        };
        $datepicker.$isSelected = function(date) {
          return $picker.isSelected(date);
        };
        $datepicker.$setDisabledEl = function(el) {
          el.disabled = $picker.isDisabled(el.date);
        };
        $datepicker.$selectPane = function(value) {
          var steps = $picker.steps;
          var targetDate = new Date(Date.UTC(viewDate.year + (steps.year || 0) * value, viewDate.month + (steps.month || 0) * value, 1));
          angular.extend(viewDate, {
            year: targetDate.getUTCFullYear(),
            month: targetDate.getUTCMonth(),
            date: targetDate.getUTCDate()
          });
          $datepicker.$build();
        };
        $datepicker.$onMouseDown = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          if (isTouch) {
            var targetEl = angular.element(evt.target);
            if (targetEl[0].nodeName.toLowerCase() !== 'button') {
              targetEl = targetEl.parent();
            }
            targetEl.triggerHandler('click');
          }
        };
        $datepicker.$onKeyDown = function(evt) {
          if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) return;
          evt.preventDefault();
          evt.stopPropagation();
          if (evt.keyCode === 13) {
            if (!scope.$mode) {
              $datepicker.hide(true);
            } else {
              scope.$apply(function() {
                $datepicker.setMode(scope.$mode - 1);
              });
            }
            return;
          }
          $picker.onKeyDown(evt);
          parentScope.$digest();
        };
        function updateSelected(el) {
          el.selected = $datepicker.$isSelected(el.date);
        }
        function focusElement() {
          element[0].focus();
        }
        var _init = $datepicker.init;
        $datepicker.init = function() {
          if (isNative && options.useNative) {
            element.prop('type', 'date');
            element.css('-webkit-appearance', 'textfield');
            return;
          } else if (isTouch) {
            element.prop('type', 'text');
            element.attr('readonly', 'true');
            element.on('click', focusElement);
          }
          _init();
        };
        var _destroy = $datepicker.destroy;
        $datepicker.destroy = function() {
          if (isNative && options.useNative) {
            element.off('click', focusElement);
          }
          _destroy();
        };
        var _show = $datepicker.show;
        $datepicker.show = function() {
          if (!isTouch && element.attr('readonly') || element.attr('disabled')) return;
          _show();
          $timeout(function() {
            if (!$datepicker.$isShown) return;
            $datepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
            if (options.keyboard) {
              element.on('keydown', $datepicker.$onKeyDown);
            }
          }, 0, false);
        };
        var _hide = $datepicker.hide;
        $datepicker.hide = function(blur) {
          if (!$datepicker.$isShown) return;
          $datepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
          if (options.keyboard) {
            element.off('keydown', $datepicker.$onKeyDown);
          }
          _hide(blur);
        };
        return $datepicker;
      }
      DatepickerFactory.defaults = defaults;
      return DatepickerFactory;
    } ];
  }).directive('bsDatepicker', [ '$window', '$parse', '$q', '$dateFormatter', '$dateParser', '$datepicker', function($window, $parse, $q, $dateFormatter, $dateParser, $datepicker) {
    var isNative = /(ip[ao]d|iphone|android)/gi.test($window.navigator.userAgent);
    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = {
          scope: scope
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'autoclose', 'dateType', 'dateFormat', 'timezone', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'startView', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled', 'id', 'prefixClass', 'prefixEvent' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'html', 'container', 'autoclose', 'useNative' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) {
            options[key] = false;
          }
        });
        var datepicker = $datepicker(element, controller, options);
        options = datepicker.$options;
        if (isNative && options.useNative) options.dateFormat = 'yyyy-MM-dd';
        var lang = options.lang;
        var formatDate = function(date, format) {
          return $dateFormatter.formatDate(date, format, lang);
        };
        var dateParser = $dateParser({
          format: options.dateFormat,
          lang: lang,
          strict: options.strictFormat
        });
        if (attr.bsShow) {
          scope.$watch(attr.bsShow, function(newValue, oldValue) {
            if (!datepicker || !angular.isDefined(newValue)) return;
            if (angular.isString(newValue)) newValue = !!newValue.match(/true|,?(datepicker),?/i);
            if (newValue === true) {
              datepicker.show();
            } else {
              datepicker.hide();
            }
          });
        }
        angular.forEach([ 'minDate', 'maxDate' ], function(key) {
          if (angular.isDefined(attr[key])) {
            attr.$observe(key, function(newValue) {
              datepicker.$options[key] = dateParser.getDateForAttribute(key, newValue);
              if (!isNaN(datepicker.$options[key])) datepicker.$build(false);
              validateAgainstMinMaxDate(controller.$dateValue);
            });
          }
        });
        if (angular.isDefined(attr.dateFormat)) {
          attr.$observe('dateFormat', function(newValue) {
            datepicker.$options.dateFormat = newValue;
          });
        }
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          datepicker.update(controller.$dateValue);
        }, true);
        function normalizeDateRanges(ranges) {
          if (!ranges || !ranges.length) return null;
          return ranges;
        }
        if (angular.isDefined(attr.disabledDates)) {
          scope.$watch(attr.disabledDates, function(disabledRanges, previousValue) {
            disabledRanges = normalizeDateRanges(disabledRanges);
            previousValue = normalizeDateRanges(previousValue);
            if (disabledRanges) {
              datepicker.updateDisabledDates(disabledRanges);
            }
          });
        }
        function validateAgainstMinMaxDate(parsedDate) {
          if (!angular.isDate(parsedDate)) return;
          var isMinValid = isNaN(datepicker.$options.minDate) || parsedDate.getTime() >= datepicker.$options.minDate;
          var isMaxValid = isNaN(datepicker.$options.maxDate) || parsedDate.getTime() <= datepicker.$options.maxDate;
          var isValid = isMinValid && isMaxValid;
          controller.$setValidity('date', isValid);
          controller.$setValidity('min', isMinValid);
          controller.$setValidity('max', isMaxValid);
          if (isValid) controller.$dateValue = parsedDate;
        }
        controller.$parsers.unshift(function(viewValue) {
          var date;
          if (!viewValue) {
            controller.$setValidity('date', true);
            return null;
          }
          var parsedDate = dateParser.parse(viewValue, controller.$dateValue);
          if (!parsedDate || isNaN(parsedDate.getTime())) {
            controller.$setValidity('date', false);
            return;
          }
          validateAgainstMinMaxDate(parsedDate);
          if (options.dateType === 'string') {
            date = dateParser.timezoneOffsetAdjust(parsedDate, options.timezone, true);
            return formatDate(date, options.modelDateFormat || options.dateFormat);
          }
          date = dateParser.timezoneOffsetAdjust(controller.$dateValue, options.timezone, true);
          if (options.dateType === 'number') {
            return date.getTime();
          } else if (options.dateType === 'unix') {
            return date.getTime() / 1e3;
          } else if (options.dateType === 'iso') {
            return date.toISOString();
          }
          return new Date(date);
        });
        controller.$formatters.push(function(modelValue) {
          var date;
          if (angular.isUndefined(modelValue) || modelValue === null) {
            date = NaN;
          } else if (angular.isDate(modelValue)) {
            date = modelValue;
          } else if (options.dateType === 'string') {
            date = dateParser.parse(modelValue, null, options.modelDateFormat);
          } else if (options.dateType === 'unix') {
            date = new Date(modelValue * 1e3);
          } else {
            date = new Date(modelValue);
          }
          controller.$dateValue = dateParser.timezoneOffsetAdjust(date, options.timezone);
          return getDateFormattedString();
        });
        controller.$render = function() {
          element.val(getDateFormattedString());
        };
        function getDateFormattedString() {
          return !controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : formatDate(controller.$dateValue, options.dateFormat);
        }
        scope.$on('$destroy', function() {
          if (datepicker) datepicker.destroy();
          options = null;
          datepicker = null;
        });
      }
    };
  } ]).provider('datepickerViews', function() {
    function split(arr, size) {
      var arrays = [];
      while (arr.length > 0) {
        arrays.push(arr.splice(0, size));
      }
      return arrays;
    }
    function mod(n, m) {
      return (n % m + m) % m;
    }
    this.$get = [ '$dateFormatter', '$dateParser', '$sce', function($dateFormatter, $dateParser, $sce) {
      return function(picker) {
        var scope = picker.$scope;
        var options = picker.$options;
        var lang = options.lang;
        var formatDate = function(date, format) {
          return $dateFormatter.formatDate(date, format, lang);
        };
        var dateParser = $dateParser({
          format: options.dateFormat,
          lang: lang,
          strict: options.strictFormat
        });
        var weekDaysMin = $dateFormatter.weekdaysShort(lang);
        var weekDaysLabels = weekDaysMin.slice(options.startWeek).concat(weekDaysMin.slice(0, options.startWeek));
        var weekDaysLabelsHtml = $sce.trustAsHtml('<th class="dow text-center">' + weekDaysLabels.join('</th><th class="dow text-center">') + '</th>');
        var startDate = picker.$date || (options.startDate ? dateParser.getDateForAttribute('startDate', options.startDate) : new Date());
        var viewDate = {
          year: startDate.getFullYear(),
          month: startDate.getMonth(),
          date: startDate.getDate()
        };
        var views = [ {
          format: options.dayFormat,
          split: 7,
          steps: {
            month: 1
          },
          update: function(date, force) {
            if (!this.built || force || date.getFullYear() !== viewDate.year || date.getMonth() !== viewDate.month) {
              angular.extend(viewDate, {
                year: picker.$date.getFullYear(),
                month: picker.$date.getMonth(),
                date: picker.$date.getDate()
              });
              picker.$build();
            } else if (date.getDate() !== viewDate.date || date.getDate() === 1) {
              viewDate.date = picker.$date.getDate();
              picker.$updateSelected();
            }
          },
          build: function() {
            var firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1);
            var firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
            var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5);
            var firstDateOffset = firstDate.getTimezoneOffset();
            var today = dateParser.timezoneOffsetAdjust(new Date(), options.timezone).toDateString();
            if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 6e4);
            var days = [];
            var day;
            for (var i = 0; i < 42; i++) {
              day = dateParser.daylightSavingAdjust(new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i));
              days.push({
                date: day,
                isToday: day.toDateString() === today,
                label: formatDate(day, this.format),
                selected: picker.$date && this.isSelected(day),
                muted: day.getMonth() !== viewDate.month,
                disabled: this.isDisabled(day)
              });
            }
            scope.title = formatDate(firstDayOfMonth, options.monthTitleFormat);
            scope.showLabels = true;
            scope.labels = weekDaysLabelsHtml;
            scope.rows = split(days, this.split);
            this.built = true;
          },
          isSelected: function(date) {
            return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth() && date.getDate() === picker.$date.getDate();
          },
          isDisabled: function(date) {
            var time = date.getTime();
            if (time < options.minDate || time > options.maxDate) return true;
            if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) return true;
            if (options.disabledDateRanges) {
              for (var i = 0; i < options.disabledDateRanges.length; i++) {
                if (time >= options.disabledDateRanges[i].start && time <= options.disabledDateRanges[i].end) {
                  return true;
                }
              }
            }
            return false;
          },
          onKeyDown: function(evt) {
            if (!picker.$date) {
              return;
            }
            var actualTime = picker.$date.getTime();
            var newDate;
            if (evt.keyCode === 37) newDate = new Date(actualTime - 1 * 864e5); else if (evt.keyCode === 38) newDate = new Date(actualTime - 7 * 864e5); else if (evt.keyCode === 39) newDate = new Date(actualTime + 1 * 864e5); else if (evt.keyCode === 40) newDate = new Date(actualTime + 7 * 864e5);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
          }
        }, {
          name: 'month',
          format: options.monthFormat,
          split: 4,
          steps: {
            year: 1
          },
          update: function(date, force) {
            if (!this.built || date.getFullYear() !== viewDate.year) {
              angular.extend(viewDate, {
                year: picker.$date.getFullYear(),
                month: picker.$date.getMonth(),
                date: picker.$date.getDate()
              });
              picker.$build();
            } else if (date.getMonth() !== viewDate.month) {
              angular.extend(viewDate, {
                month: picker.$date.getMonth(),
                date: picker.$date.getDate()
              });
              picker.$updateSelected();
            }
          },
          build: function() {
            var months = [];
            var month;
            for (var i = 0; i < 12; i++) {
              month = new Date(viewDate.year, i, 1);
              months.push({
                date: month,
                label: formatDate(month, this.format),
                selected: picker.$isSelected(month),
                disabled: this.isDisabled(month)
              });
            }
            scope.title = formatDate(month, options.yearTitleFormat);
            scope.showLabels = false;
            scope.rows = split(months, this.split);
            this.built = true;
          },
          isSelected: function(date) {
            return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth();
          },
          isDisabled: function(date) {
            var lastDate = +new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return lastDate < options.minDate || date.getTime() > options.maxDate;
          },
          onKeyDown: function(evt) {
            if (!picker.$date) {
              return;
            }
            var actualMonth = picker.$date.getMonth();
            var newDate = new Date(picker.$date);
            if (evt.keyCode === 37) newDate.setMonth(actualMonth - 1); else if (evt.keyCode === 38) newDate.setMonth(actualMonth - 4); else if (evt.keyCode === 39) newDate.setMonth(actualMonth + 1); else if (evt.keyCode === 40) newDate.setMonth(actualMonth + 4);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
          }
        }, {
          name: 'year',
          format: options.yearFormat,
          split: 4,
          steps: {
            year: 12
          },
          update: function(date, force) {
            if (!this.built || force || parseInt(date.getFullYear() / 20, 10) !== parseInt(viewDate.year / 20, 10)) {
              angular.extend(viewDate, {
                year: picker.$date.getFullYear(),
                month: picker.$date.getMonth(),
                date: picker.$date.getDate()
              });
              picker.$build();
            } else if (date.getFullYear() !== viewDate.year) {
              angular.extend(viewDate, {
                year: picker.$date.getFullYear(),
                month: picker.$date.getMonth(),
                date: picker.$date.getDate()
              });
              picker.$updateSelected();
            }
          },
          build: function() {
            var firstYear = viewDate.year - viewDate.year % (this.split * 3);
            var years = [];
            var year;
            for (var i = 0; i < 12; i++) {
              year = new Date(firstYear + i, 0, 1);
              years.push({
                date: year,
                label: formatDate(year, this.format),
                selected: picker.$isSelected(year),
                disabled: this.isDisabled(year)
              });
            }
            scope.title = years[0].label + '-' + years[years.length - 1].label;
            scope.showLabels = false;
            scope.rows = split(years, this.split);
            this.built = true;
          },
          isSelected: function(date) {
            return picker.$date && date.getFullYear() === picker.$date.getFullYear();
          },
          isDisabled: function(date) {
            var lastDate = +new Date(date.getFullYear() + 1, 0, 0);
            return lastDate < options.minDate || date.getTime() > options.maxDate;
          },
          onKeyDown: function(evt) {
            if (!picker.$date) {
              return;
            }
            var actualYear = picker.$date.getFullYear();
            var newDate = new Date(picker.$date);
            if (evt.keyCode === 37) newDate.setYear(actualYear - 1); else if (evt.keyCode === 38) newDate.setYear(actualYear - 4); else if (evt.keyCode === 39) newDate.setYear(actualYear + 1); else if (evt.keyCode === 40) newDate.setYear(actualYear + 4);
            if (!this.isDisabled(newDate)) picker.select(newDate, true);
          }
        } ];
        return {
          views: options.minView ? Array.prototype.slice.call(views, options.minView) : views,
          viewDate: viewDate
        };
      };
    } ];
  });
  angular.module('mgcrea.ngStrap.collapse', []).provider('$collapse', function() {
    var defaults = this.defaults = {
      animation: 'am-collapse',
      disallowToggle: false,
      activeClass: 'in',
      startCollapsed: false,
      allowMultiple: false
    };
    var controller = this.controller = function($scope, $element, $attrs) {
      var self = this;
      self.$options = angular.copy(defaults);
      angular.forEach([ 'animation', 'disallowToggle', 'activeClass', 'startCollapsed', 'allowMultiple' ], function(key) {
        if (angular.isDefined($attrs[key])) self.$options[key] = $attrs[key];
      });
      var falseValueRegExp = /^(false|0|)$/i;
      angular.forEach([ 'disallowToggle', 'startCollapsed', 'allowMultiple' ], function(key) {
        if (angular.isDefined($attrs[key]) && falseValueRegExp.test($attrs[key])) {
          self.$options[key] = false;
        }
      });
      self.$toggles = [];
      self.$targets = [];
      self.$viewChangeListeners = [];
      self.$registerToggle = function(element) {
        self.$toggles.push(element);
      };
      self.$registerTarget = function(element) {
        self.$targets.push(element);
      };
      self.$unregisterToggle = function(element) {
        var index = self.$toggles.indexOf(element);
        self.$toggles.splice(index, 1);
      };
      self.$unregisterTarget = function(element) {
        var index = self.$targets.indexOf(element);
        self.$targets.splice(index, 1);
        if (self.$options.allowMultiple) {
          deactivateItem(element);
        }
        fixActiveItemIndexes(index);
        self.$viewChangeListeners.forEach(function(fn) {
          fn();
        });
      };
      self.$targets.$active = !self.$options.startCollapsed ? [ 0 ] : [];
      self.$setActive = $scope.$setActive = function(value) {
        if (angular.isArray(value)) {
          self.$targets.$active = value;
        } else if (!self.$options.disallowToggle && isActive(value)) {
          deactivateItem(value);
        } else {
          activateItem(value);
        }
        self.$viewChangeListeners.forEach(function(fn) {
          fn();
        });
      };
      self.$activeIndexes = function() {
        if (self.$options.allowMultiple) {
          return self.$targets.$active;
        }
        return self.$targets.$active.length === 1 ? self.$targets.$active[0] : -1;
      };
      function fixActiveItemIndexes(index) {
        var activeIndexes = self.$targets.$active;
        for (var i = 0; i < activeIndexes.length; i++) {
          if (index < activeIndexes[i]) {
            activeIndexes[i] = activeIndexes[i] - 1;
          }
          if (activeIndexes[i] === self.$targets.length) {
            activeIndexes[i] = self.$targets.length - 1;
          }
        }
      }
      function isActive(value) {
        var activeItems = self.$targets.$active;
        return activeItems.indexOf(value) !== -1;
      }
      function deactivateItem(value) {
        var index = self.$targets.$active.indexOf(value);
        if (index !== -1) {
          self.$targets.$active.splice(index, 1);
        }
      }
      function activateItem(value) {
        if (!self.$options.allowMultiple) {
          self.$targets.$active.splice(0, 1);
        }
        if (self.$targets.$active.indexOf(value) === -1) {
          self.$targets.$active.push(value);
        }
      }
    };
    this.$get = function() {
      var $collapse = {};
      $collapse.defaults = defaults;
      $collapse.controller = controller;
      return $collapse;
    };
  }).directive('bsCollapse', [ '$window', '$animate', '$collapse', function($window, $animate, $collapse) {
    return {
      require: [ '?ngModel', 'bsCollapse' ],
      controller: [ '$scope', '$element', '$attrs', $collapse.controller ],
      link: function postLink(scope, element, attrs, controllers) {
        var ngModelCtrl = controllers[0];
        var bsCollapseCtrl = controllers[1];
        if (ngModelCtrl) {
          bsCollapseCtrl.$viewChangeListeners.push(function() {
            ngModelCtrl.$setViewValue(bsCollapseCtrl.$activeIndexes());
          });
          ngModelCtrl.$formatters.push(function(modelValue) {
            if (angular.isArray(modelValue)) {
              bsCollapseCtrl.$setActive(modelValue);
            } else {
              var activeIndexes = bsCollapseCtrl.$activeIndexes();
              if (angular.isArray(activeIndexes)) {
                if (activeIndexes.indexOf(modelValue * 1) === -1) {
                  bsCollapseCtrl.$setActive(modelValue * 1);
                }
              } else if (activeIndexes !== modelValue * 1) {
                bsCollapseCtrl.$setActive(modelValue * 1);
              }
            }
            return modelValue;
          });
        }
      }
    };
  } ]).directive('bsCollapseToggle', function() {
    return {
      require: [ '^?ngModel', '^bsCollapse' ],
      link: function postLink(scope, element, attrs, controllers) {
        var bsCollapseCtrl = controllers[1];
        element.attr('data-toggle', 'collapse');
        bsCollapseCtrl.$registerToggle(element);
        scope.$on('$destroy', function() {
          bsCollapseCtrl.$unregisterToggle(element);
        });
        element.on('click', function() {
          if (!attrs.disabled) {
            var index = attrs.bsCollapseToggle && attrs.bsCollapseToggle !== 'bs-collapse-toggle' ? attrs.bsCollapseToggle : bsCollapseCtrl.$toggles.indexOf(element);
            bsCollapseCtrl.$setActive(index * 1);
            scope.$apply();
          }
        });
      }
    };
  }).directive('bsCollapseTarget', [ '$animate', function($animate) {
    return {
      require: [ '^?ngModel', '^bsCollapse' ],
      link: function postLink(scope, element, attrs, controllers) {
        var bsCollapseCtrl = controllers[1];
        element.addClass('collapse');
        if (bsCollapseCtrl.$options.animation) {
          element.addClass(bsCollapseCtrl.$options.animation);
        }
        bsCollapseCtrl.$registerTarget(element);
        scope.$on('$destroy', function() {
          bsCollapseCtrl.$unregisterTarget(element);
        });
        function render() {
          var index = bsCollapseCtrl.$targets.indexOf(element);
          var active = bsCollapseCtrl.$activeIndexes();
          var action = 'removeClass';
          if (angular.isArray(active)) {
            if (active.indexOf(index) !== -1) {
              action = 'addClass';
            }
          } else if (index === active) {
            action = 'addClass';
          }
          $animate[action](element, bsCollapseCtrl.$options.activeClass);
        }
        bsCollapseCtrl.$viewChangeListeners.push(function() {
          render();
        });
        render();
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.button', []).provider('$button', function() {
    var defaults = this.defaults = {
      activeClass: 'active',
      toggleEvent: 'click'
    };
    this.$get = function() {
      return {
        defaults: defaults
      };
    };
  }).directive('bsCheckboxGroup', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      compile: function postLink(element, attr) {
        element.attr('data-toggle', 'buttons');
        element.removeAttr('ng-model');
        var children = element[0].querySelectorAll('input[type="checkbox"]');
        angular.forEach(children, function(child) {
          var childEl = angular.element(child);
          childEl.attr('bs-checkbox', '');
          childEl.attr('ng-model', attr.ngModel + '.' + childEl.attr('value'));
        });
      }
    };
  }).directive('bsCheckbox', [ '$button', '$$rAF', function($button, $$rAF) {
    var defaults = $button.defaults;
    var constantValueRegExp = /^(true|false|\d+)$/;
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = defaults;
        var isInput = element[0].nodeName === 'INPUT';
        var activeElement = isInput ? element.parent() : element;
        var trueValue = angular.isDefined(attr.trueValue) ? attr.trueValue : true;
        if (constantValueRegExp.test(attr.trueValue)) {
          trueValue = scope.$eval(attr.trueValue);
        }
        var falseValue = angular.isDefined(attr.falseValue) ? attr.falseValue : false;
        if (constantValueRegExp.test(attr.falseValue)) {
          falseValue = scope.$eval(attr.falseValue);
        }
        var hasExoticValues = typeof trueValue !== 'boolean' || typeof falseValue !== 'boolean';
        if (hasExoticValues) {
          controller.$parsers.push(function(viewValue) {
            return viewValue ? trueValue : falseValue;
          });
          controller.$formatters.push(function(modelValue) {
            return angular.equals(modelValue, trueValue);
          });
          scope.$watch(attr.ngModel, function(newValue, oldValue) {
            controller.$render();
          });
        }
        controller.$render = function() {
          var isActive = angular.equals(controller.$modelValue, trueValue);
          $$rAF(function() {
            if (isInput) element[0].checked = isActive;
            activeElement.toggleClass(options.activeClass, isActive);
          });
        };
        element.bind(options.toggleEvent, function() {
          scope.$apply(function() {
            if (!isInput) {
              controller.$setViewValue(!activeElement.hasClass('active'));
            }
            if (!hasExoticValues) {
              controller.$render();
            }
          });
        });
      }
    };
  } ]).directive('bsRadioGroup', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      compile: function postLink(element, attr) {
        element.attr('data-toggle', 'buttons');
        element.removeAttr('ng-model');
        var children = element[0].querySelectorAll('input[type="radio"]');
        angular.forEach(children, function(child) {
          angular.element(child).attr('bs-radio', '');
          angular.element(child).attr('ng-model', attr.ngModel);
        });
      }
    };
  }).directive('bsRadio', [ '$button', '$$rAF', function($button, $$rAF) {
    var defaults = $button.defaults;
    var constantValueRegExp = /^(true|false|\d+)$/;
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {
        var options = defaults;
        var isInput = element[0].nodeName === 'INPUT';
        var activeElement = isInput ? element.parent() : element;
        var value;
        attr.$observe('value', function(v) {
          if (typeof v !== 'boolean' && constantValueRegExp.test(v)) {
            value = scope.$eval(v);
          } else {
            value = v;
          }
          controller.$render();
        });
        controller.$render = function() {
          var isActive = angular.equals(controller.$modelValue, value);
          $$rAF(function() {
            if (isInput) element[0].checked = isActive;
            activeElement.toggleClass(options.activeClass, isActive);
          });
        };
        element.bind(options.toggleEvent, function() {
          scope.$apply(function() {
            controller.$setViewValue(value);
            controller.$render();
          });
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.alert', [ 'mgcrea.ngStrap.modal' ]).provider('$alert', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'alert',
      prefixEvent: 'alert',
      placement: null,
      templateUrl: 'alert/alert.tpl.html',
      container: false,
      element: null,
      backdrop: false,
      keyboard: true,
      show: true,
      duration: false,
      type: false,
      dismissable: true
    };
    this.$get = [ '$modal', '$timeout', function($modal, $timeout) {
      function AlertFactory(config) {
        var $alert = {};
        var options = angular.extend({}, defaults, config);
        $alert = $modal(options);
        $alert.$scope.dismissable = !!options.dismissable;
        if (options.type) {
          $alert.$scope.type = options.type;
        }
        var show = $alert.show;
        if (options.duration) {
          $alert.show = function() {
            show();
            $timeout(function() {
              $alert.hide();
            }, options.duration * 1e3);
          };
        }
        return $alert;
      }
      return AlertFactory;
    } ];
  }).directive('bsAlert', [ '$window', '$sce', '$alert', function($window, $sce, $alert) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'keyboard', 'html', 'container', 'animation', 'duration', 'dismissable' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'keyboard', 'html', 'container', 'dismissable' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        if (!scope.hasOwnProperty('title')) {
          scope.title = '';
        }
        angular.forEach([ 'title', 'content', 'type' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
            });
          }
        });
        if (attr.bsAlert) {
          scope.$watch(attr.bsAlert, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
          }, true);
        }
        var alert = $alert(options);
        element.on(attr.trigger || 'click', alert.toggle);
        scope.$on('$destroy', function() {
          if (alert) alert.destroy();
          options = null;
          alert = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.aside', [ 'mgcrea.ngStrap.modal' ]).provider('$aside', function() {
    var defaults = this.defaults = {
      animation: 'am-fade-and-slide-right',
      prefixClass: 'aside',
      prefixEvent: 'aside',
      placement: 'right',
      templateUrl: 'aside/aside.tpl.html',
      contentTemplate: false,
      container: false,
      element: null,
      backdrop: true,
      keyboard: true,
      html: false,
      show: true
    };
    this.$get = [ '$modal', function($modal) {
      function AsideFactory(config) {
        var $aside = {};
        var options = angular.extend({}, defaults, config);
        $aside = $modal(options);
        return $aside;
      }
      return AsideFactory;
    } ];
  }).directive('bsAside', [ '$window', '$sce', '$aside', function($window, $sce, $aside) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {
          scope: scope,
          element: element,
          show: false
        };
        angular.forEach([ 'template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'backdrop', 'keyboard', 'html', 'container', 'animation' ], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach([ 'backdrop', 'keyboard', 'html', 'container' ], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });
        angular.forEach([ 'title', 'content' ], function(key) {
          if (attr[key]) {
            attr.$observe(key, function(newValue, oldValue) {
              scope[key] = $sce.trustAsHtml(newValue);
            });
          }
        });
        if (attr.bsAside) {
          scope.$watch(attr.bsAside, function(newValue, oldValue) {
            if (angular.isObject(newValue)) {
              angular.extend(scope, newValue);
            } else {
              scope.content = newValue;
            }
          }, true);
        }
        var aside = $aside(options);
        element.on(attr.trigger || 'click', aside.toggle);
        scope.$on('$destroy', function() {
          if (aside) aside.destroy();
          options = null;
          aside = null;
        });
      }
    };
  } ]);
  angular.module('mgcrea.ngStrap.affix', [ 'mgcrea.ngStrap.helpers.dimensions', 'mgcrea.ngStrap.helpers.debounce' ]).provider('$affix', function() {
    var defaults = this.defaults = {
      offsetTop: 'auto',
      inlineStyles: true
    };
    this.$get = [ '$window', 'debounce', 'dimensions', function($window, debounce, dimensions) {
      var bodyEl = angular.element($window.document.body);
      var windowEl = angular.element($window);
      function AffixFactory(element, config) {
        var $affix = {};
        var options = angular.extend({}, defaults, config);
        var targetEl = options.target;
        var reset = 'affix affix-top affix-bottom';
        var setWidth = false;
        var initialAffixTop = 0;
        var initialOffsetTop = 0;
        var offsetTop = 0;
        var offsetBottom = 0;
        var affixed = null;
        var unpin = null;
        var parent = element.parent();
        if (options.offsetParent) {
          if (options.offsetParent.match(/^\d+$/)) {
            for (var i = 0; i < options.offsetParent * 1 - 1; i++) {
              parent = parent.parent();
            }
          } else {
            parent = angular.element(options.offsetParent);
          }
        }
        $affix.init = function() {
          this.$parseOffsets();
          initialOffsetTop = dimensions.offset(element[0]).top + initialAffixTop;
          setWidth = !element[0].style.width;
          targetEl.on('scroll', this.checkPosition);
          targetEl.on('click', this.checkPositionWithEventLoop);
          windowEl.on('resize', this.$debouncedOnResize);
          this.checkPosition();
          this.checkPositionWithEventLoop();
        };
        $affix.destroy = function() {
          targetEl.off('scroll', this.checkPosition);
          targetEl.off('click', this.checkPositionWithEventLoop);
          windowEl.off('resize', this.$debouncedOnResize);
        };
        $affix.checkPositionWithEventLoop = function() {
          setTimeout($affix.checkPosition, 1);
        };
        $affix.checkPosition = function() {
          var scrollTop = getScrollTop();
          var position = dimensions.offset(element[0]);
          var elementHeight = dimensions.height(element[0]);
          var affix = getRequiredAffixClass(unpin, position, elementHeight);
          if (affixed === affix) return;
          affixed = affix;
          if (affix === 'top') {
            unpin = null;
            if (setWidth) {
              element.css('width', '');
            }
            if (options.inlineStyles) {
              element.css('position', options.offsetParent ? '' : 'relative');
              element.css('top', '');
            }
          } else if (affix === 'bottom') {
            if (options.offsetUnpin) {
              unpin = -(options.offsetUnpin * 1);
            } else {
              unpin = position.top - scrollTop;
            }
            if (setWidth) {
              element.css('width', '');
            }
            if (options.inlineStyles) {
              element.css('position', options.offsetParent ? '' : 'relative');
              element.css('top', options.offsetParent ? '' : bodyEl[0].offsetHeight - offsetBottom - elementHeight - initialOffsetTop + 'px');
            }
          } else {
            unpin = null;
            if (setWidth) {
              element.css('width', element[0].offsetWidth + 'px');
            }
            if (options.inlineStyles) {
              element.css('position', 'fixed');
              element.css('top', initialAffixTop + 'px');
            }
          }
          element.removeClass(reset).addClass('affix' + (affix !== 'middle' ? '-' + affix : ''));
        };
        $affix.$onResize = function() {
          $affix.$parseOffsets();
          $affix.checkPosition();
        };
        $affix.$debouncedOnResize = debounce($affix.$onResize, 50);
        $affix.$parseOffsets = function() {
          var initialPosition = element.css('position');
          if (options.inlineStyles) {
            element.css('position', options.offsetParent ? '' : 'relative');
          }
          if (options.offsetTop) {
            if (options.offsetTop === 'auto') {
              options.offsetTop = '+0';
            }
            if (options.offsetTop.match(/^[-+]\d+$/)) {
              initialAffixTop = -options.offsetTop * 1;
              if (options.offsetParent) {
                offsetTop = dimensions.offset(parent[0]).top + options.offsetTop * 1;
              } else {
                offsetTop = dimensions.offset(element[0]).top - dimensions.css(element[0], 'marginTop', true) + options.offsetTop * 1;
              }
            } else {
              offsetTop = options.offsetTop * 1;
            }
          }
          if (options.offsetBottom) {
            if (options.offsetParent && options.offsetBottom.match(/^[-+]\d+$/)) {
              offsetBottom = getScrollHeight() - (dimensions.offset(parent[0]).top + dimensions.height(parent[0])) + options.offsetBottom * 1 + 1;
            } else {
              offsetBottom = options.offsetBottom * 1;
            }
          }
          if (options.inlineStyles) {
            element.css('position', initialPosition);
          }
        };
        function getRequiredAffixClass(_unpin, position, elementHeight) {
          var scrollTop = getScrollTop();
          var scrollHeight = getScrollHeight();
          if (scrollTop <= offsetTop) {
            return 'top';
          } else if (_unpin !== null && scrollTop + _unpin <= position.top) {
            return 'middle';
          } else if (offsetBottom !== null && position.top + elementHeight + initialAffixTop >= scrollHeight - offsetBottom) {
            return 'bottom';
          }
          return 'middle';
        }
        function getScrollTop() {
          return targetEl[0] === $window ? $window.pageYOffset : targetEl[0].scrollTop;
        }
        function getScrollHeight() {
          return targetEl[0] === $window ? $window.document.body.scrollHeight : targetEl[0].scrollHeight;
        }
        $affix.init();
        return $affix;
      }
      return AffixFactory;
    } ];
  }).directive('bsAffix', [ '$affix', '$window', function($affix, $window) {
    return {
      restrict: 'EAC',
      require: '^?bsAffixTarget',
      link: function postLink(scope, element, attr, affixTarget) {
        var options = {
          scope: scope,
          target: affixTarget ? affixTarget.$element : angular.element($window)
        };
        angular.forEach([ 'offsetTop', 'offsetBottom', 'offsetParent', 'offsetUnpin', 'inlineStyles' ], function(key) {
          if (angular.isDefined(attr[key])) {
            var option = attr[key];
            if (/true/i.test(option)) option = true;
            if (/false/i.test(option)) option = false;
            options[key] = option;
          }
        });
        var affix = $affix(element, options);
        scope.$on('$destroy', function() {
          if (affix) affix.destroy();
          options = null;
          affix = null;
        });
      }
    };
  } ]).directive('bsAffixTarget', function() {
    return {
      controller: [ '$element', function($element) {
        this.$element = $element;
      } ]
    };
  });
  angular.module('mgcrea.ngStrap', [ 'mgcrea.ngStrap.modal', 'mgcrea.ngStrap.aside', 'mgcrea.ngStrap.alert', 'mgcrea.ngStrap.button', 'mgcrea.ngStrap.select', 'mgcrea.ngStrap.datepicker', 'mgcrea.ngStrap.timepicker', 'mgcrea.ngStrap.navbar', 'mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.popover', 'mgcrea.ngStrap.dropdown', 'mgcrea.ngStrap.typeahead', 'mgcrea.ngStrap.scrollspy', 'mgcrea.ngStrap.affix', 'mgcrea.ngStrap.tab', 'mgcrea.ngStrap.collapse' ]);
})(window, document);
/* jshint ignore:end */
/**
 * angular-strap
 * @version v2.3.8 - 2016-03-31
 * @link http://mgcrea.github.io/angular-strap
 * @author Olivier Louvignes <olivier@mg-crea.com> (https://github.com/mgcrea)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, document, undefined) {
  'use strict';
  angular.module('mgcrea.ngStrap.aside').run([ '$templateCache', function($templateCache) {
    $templateCache.put('aside/aside.tpl.html', '<div class="aside" tabindex="-1" role="dialog"><div class="aside-dialog"><div class="aside-content"><div class="aside-header" ng-show="title"><button type="button" class="close" ng-click="$hide()">&times;</button><h4 class="aside-title" ng-bind="title"></h4></div><div class="aside-body" ng-bind="content"></div><div class="aside-footer"><button type="button" class="btn btn-default" ng-click="$hide()">Close</button></div></div></div></div>');
  } ]);
  angular.module('mgcrea.ngStrap.alert').run([ '$templateCache', function($templateCache) {
    $templateCache.put('alert/alert.tpl.html', '<div class="alert" ng-class="[type ? \'alert-\' + type : null]"><button type="button" class="close" ng-if="dismissable" ng-click="$hide()">&times;</button> <strong ng-bind="title"></strong>&nbsp;<span ng-bind-html="content"></span></div>');
  } ]);
  angular.module('mgcrea.ngStrap.datepicker').run([ '$templateCache', function($templateCache) {
    $templateCache.put('datepicker/datepicker.tpl.html', '<div class="dropdown-menu datepicker" ng-class="\'datepicker-mode-\' + $mode" style="max-width: 320px"><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$selectPane(-1)"><i class="{{$iconLeft}}"></i></button></th><th colspan="{{ rows[0].length - 2 }}"><button tabindex="-1" type="button" class="btn btn-default btn-block text-strong" ng-click="$toggleMode()"><strong style="text-transform: capitalize" ng-bind="title"></strong></button></th><th><button tabindex="-1" type="button" class="btn btn-default pull-right" ng-click="$selectPane(+1)"><i class="{{$iconRight}}"></i></button></th></tr><tr ng-if="showLabels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows" height="{{ 100 / rows.length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-default" style="width: 100%" ng-class="{\'btn-primary\': el.selected, \'btn-info btn-today\': el.isToday && !el.selected}" ng-click="$select(el.date)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div>');
  } ]);
  angular.module('mgcrea.ngStrap.modal').run([ '$templateCache', function($templateCache) {
    $templateCache.put('modal/modal.tpl.html', '<div class="modal" tabindex="-1" role="dialog" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><button type="button" class="close" aria-label="Close" ng-click="$hide()"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body" ng-bind="content"></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="$hide()">Close</button></div></div></div></div>');
  } ]);
  angular.module('mgcrea.ngStrap.dropdown').run([ '$templateCache', function($templateCache) {
    $templateCache.put('dropdown/dropdown.tpl.html', '<ul tabindex="-1" class="dropdown-menu" role="menu" ng-show="content && content.length"><li role="presentation" ng-class="{divider: item.divider, active: item.active}" ng-repeat="item in content"><a role="menuitem" tabindex="-1" ng-href="{{item.href}}" ng-if="!item.divider && item.href" target="{{item.target || \'\'}}" ng-bind="item.text"></a> <a role="menuitem" tabindex="-1" href="javascript:void(0)" ng-if="!item.divider && item.click" ng-click="$eval(item.click);$hide()" ng-bind="item.text"></a></li></ul>');
  } ]);
  angular.module('mgcrea.ngStrap.popover').run([ '$templateCache', function($templateCache) {
    $templateCache.put('popover/popover.tpl.html', '<div class="popover" tabindex="-1"><div class="arrow"></div><h3 class="popover-title" ng-bind="title" ng-show="title"></h3><div class="popover-content" ng-bind="content"></div></div>');
  } ]);
  angular.module('mgcrea.ngStrap.select').run([ '$templateCache', function($templateCache) {
    $templateCache.put('select/select.tpl.html', '<ul tabindex="-1" class="select dropdown-menu" ng-show="$isVisible()" role="select"><li ng-if="$showAllNoneButtons"><div class="btn-group" style="margin-bottom: 5px; margin-left: 5px"><button type="button" class="btn btn-default btn-xs" ng-click="$selectAll()">{{$allText}}</button> <button type="button" class="btn btn-default btn-xs" ng-click="$selectNone()">{{$noneText}}</button></div></li><li role="presentation" ng-repeat="match in $matches" ng-class="{active: $isActive($index)}"><a style="cursor: default" role="menuitem" tabindex="-1" ng-click="$select($index, $event)"><i class="{{$iconCheckmark}} pull-right" ng-if="$isMultiple && $isActive($index)"></i> <span ng-bind="match.label"></span></a></li></ul>');
  } ]);
  angular.module('mgcrea.ngStrap.tab').run([ '$templateCache', function($templateCache) {
    $templateCache.put('tab/tab.tpl.html', '<ul class="nav" ng-class="$navClass" role="tablist"><li role="presentation" ng-repeat="$pane in $panes track by $index" ng-class="[ $isActive($pane, $index) ? $activeClass : \'\', $pane.disabled ? \'disabled\' : \'\' ]"><a role="tab" data-toggle="tab" ng-click="!$pane.disabled && $setActive($pane.name || $index)" data-index="{{ $index }}" ng-bind-html="$pane.title" aria-controls="$pane.title"></a></li></ul><div ng-transclude class="tab-content"></div>');
  } ]);
  angular.module('mgcrea.ngStrap.timepicker').run([ '$templateCache', function($templateCache) {
    $templateCache.put('timepicker/timepicker.tpl.html', '<div class="dropdown-menu timepicker" style="min-width: 0px;width: auto"><table height="100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 0)"><i class="{{ $iconUp }}"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 1)"><i class="{{ $iconUp }}"></i></button></th><th ng-if="showSeconds">&nbsp;</th><th ng-if="showSeconds"><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 2)"><i class="{{ $iconUp }}"></i></button></th></tr></thead><tbody><tr ng-repeat="(i, row) in rows"><td class="text-center"><button tabindex="-1" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[0].selected}" ng-click="$select(row[0].date, 0)" ng-disabled="row[0].disabled"><span ng-class="{\'text-muted\': row[0].muted}" ng-bind="row[0].label"></span></button></td><td><span ng-bind="i == midIndex ? timeSeparator : \' \'"></span></td><td class="text-center"><button tabindex="-1" ng-if="row[1].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[1].selected}" ng-click="$select(row[1].date, 1)" ng-disabled="row[1].disabled"><span ng-class="{\'text-muted\': row[1].muted}" ng-bind="row[1].label"></span></button></td><td ng-if="showSeconds"><span ng-bind="i == midIndex ? timeSeparator : \' \'"></span></td><td ng-if="showSeconds" class="text-center"><button tabindex="-1" ng-if="row[2].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[2].selected}" ng-click="$select(row[2].date, 2)" ng-disabled="row[2].disabled"><span ng-class="{\'text-muted\': row[2].muted}" ng-bind="row[2].label"></span></button></td><td ng-if="showAM">&nbsp;</td><td ng-if="showAM"><button tabindex="-1" ng-show="i == midIndex - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !!isAM}" class="btn btn-default" ng-click="$switchMeridian()" ng-disabled="el.disabled">AM</button> <button tabindex="-1" ng-show="i == midIndex + 1 - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !isAM}" class="btn btn-default" ng-click="$switchMeridian()" ng-disabled="el.disabled">PM</button></td></tr></tbody><tfoot><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 0)"><i class="{{ $iconDown }}"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 1)"><i class="{{ $iconDown }}"></i></button></th><th ng-if="showSeconds">&nbsp;</th><th ng-if="showSeconds"><button ng-if="showSeconds" tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 2)"><i class="{{ $iconDown }}"></i></button></th></tr></tfoot></table></div>');
  } ]);
  angular.module('mgcrea.ngStrap.typeahead').run([ '$templateCache', function($templateCache) {
    $templateCache.put('typeahead/typeahead.tpl.html', '<ul tabindex="-1" class="typeahead dropdown-menu" ng-show="$isVisible()" role="select"><li role="presentation" ng-repeat="match in $matches" ng-class="{active: $index == $activeIndex}"><a role="menuitem" tabindex="-1" ng-click="$select($index, $event)" ng-bind="match.label"></a></li></ul>');
  } ]);
  angular.module('mgcrea.ngStrap.tooltip').run([ '$templateCache', function($templateCache) {
    $templateCache.put('tooltip/tooltip.tpl.html', '<div class="tooltip in" ng-show="title"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="title"></div></div>');
  } ]);
})(window, document);
/**
 * @license Angular UI Tree v2.15.0
 * (c) 2010-2016. https://github.com/angular-ui-tree/angular-ui-tree
 * License: MIT
 */
(function () {
  'use strict';

  angular.module('ui.tree', [])
    .constant('treeConfig', {
      treeClass: 'angular-ui-tree',
      emptyTreeClass: 'angular-ui-tree-empty',
      hiddenClass: 'angular-ui-tree-hidden',
      nodesClass: 'angular-ui-tree-nodes',
      nodeClass: 'angular-ui-tree-node',
      handleClass: 'angular-ui-tree-handle',
      placeholderClass: 'angular-ui-tree-placeholder',
      dragClass: 'angular-ui-tree-drag',
      dragThreshold: 3,
      levelThreshold: 30,
      defaultCollapsed: false
    });

})();

(function () {
  'use strict';

  angular.module('ui.tree')

    .controller('TreeHandleController', ['$scope', '$element',
      function ($scope, $element) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$nodeScope = null;
        $scope.$type = 'uiTreeHandle';

      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')
    .controller('TreeNodeController', ['$scope', '$element',
      function ($scope, $element) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$modelValue = null; // Model value for node;
        $scope.$parentNodeScope = null; // uiTreeNode Scope of parent node;
        $scope.$childNodesScope = null; // uiTreeNodes Scope of child nodes.
        $scope.$parentNodesScope = null; // uiTreeNodes Scope of parent nodes.
        $scope.$treeScope = null; // uiTree scope
        $scope.$handleScope = null; // it's handle scope
        $scope.$type = 'uiTreeNode';
        $scope.$$allowNodeDrop = false;
        $scope.collapsed = false;

        $scope.init = function (controllersArr) {
          var treeNodesCtrl = controllersArr[0];
          $scope.$treeScope = controllersArr[1] ? controllersArr[1].scope : null;

          // find the scope of it's parent node
          $scope.$parentNodeScope = treeNodesCtrl.scope.$nodeScope;
          // modelValue for current node
          $scope.$modelValue = treeNodesCtrl.scope.$modelValue[$scope.$index];
          $scope.$parentNodesScope = treeNodesCtrl.scope;
          treeNodesCtrl.scope.initSubNode($scope); // init sub nodes

          $element.on('$destroy', function () {
            treeNodesCtrl.scope.destroySubNode($scope); // destroy sub nodes
          });
        };

        $scope.index = function () {
          return $scope.$parentNodesScope.$modelValue.indexOf($scope.$modelValue);
        };

        $scope.dragEnabled = function () {
          return !($scope.$treeScope && !$scope.$treeScope.dragEnabled);
        };

        $scope.isSibling = function (targetNode) {
          return $scope.$parentNodesScope === targetNode.$parentNodesScope;
        };

        $scope.isChild = function (targetNode) {
          var nodes = $scope.childNodes();
          return nodes && nodes.indexOf(targetNode) > -1;
        };

        $scope.prev = function () {
          var index = $scope.index();
          if (index > 0) {
            return $scope.siblings()[index - 1];
          }
          return null;
        };

        $scope.siblings = function () {
          return $scope.$parentNodesScope.childNodes();
        };

        $scope.childNodesCount = function () {
          return $scope.childNodes() ? $scope.childNodes().length : 0;
        };

        $scope.hasChild = function () {
          return $scope.childNodesCount() > 0;
        };

        $scope.childNodes = function () {
          return $scope.$childNodesScope && $scope.$childNodesScope.$modelValue ?
            $scope.$childNodesScope.childNodes() :
            null;
        };

        $scope.accept = function (sourceNode, destIndex) {
          return $scope.$childNodesScope &&
            $scope.$childNodesScope.$modelValue &&
            $scope.$childNodesScope.accept(sourceNode, destIndex);
        };

        $scope.remove = function () {
          return $scope.$parentNodesScope.removeNode($scope);
        };

        $scope.toggle = function () {
          $scope.collapsed = !$scope.collapsed;
        };

        $scope.collapse = function () {
          $scope.collapsed = true;
        };

        $scope.expand = function () {
          $scope.collapsed = false;
        };

        $scope.depth = function () {
          var parentNode = $scope.$parentNodeScope;
          if (parentNode) {
            return parentNode.depth() + 1;
          }
          return 1;
        };

        /**
        * Returns the depth of the deepest subtree under this node
        * @param scope a TreeNodesController scope object
        * @returns Depth of all nodes *beneath* this node. If scope belongs to a leaf node, the
        *   result is 0 (it has no subtree).
        */
        function countSubTreeDepth(scope) {
          var thisLevelDepth = 0,
              childNodes = scope.childNodes(),
              //childNode,
              //childDepth,
              i;
          if (!childNodes || childNodes.length === 0) {
            return 0;
          }
          for (i = childNodes.length - 1; i >= 0 ; i--) {
                thisLevelDepth = Math.max(thisLevelDepth, 1 + countSubTreeDepth(childNodes[i]));
              //childNode = childNodes[i],
            //childDepth = 1 + countSubTreeDepth(childNode);
            //thisLevelDepth = Math.max(thisLevelDepth, childDepth);
          }
          return thisLevelDepth;
        }

        $scope.maxSubDepth = function () {
          return $scope.$childNodesScope ? countSubTreeDepth($scope.$childNodesScope) : 0;
        };
      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')

    .controller('TreeNodesController', ['$scope', '$element',
      function ($scope, $element) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$modelValue = null;
        $scope.$nodeScope = null; // the scope of node which the nodes belongs to
        $scope.$treeScope = null;
        $scope.$type = 'uiTreeNodes';
        $scope.$nodesMap = {};

        $scope.nodropEnabled = false;
        $scope.maxDepth = 0;
        $scope.cloneEnabled = false;

        $scope.initSubNode = function (subNode) {
          if (!subNode.$modelValue) {
            return null;
          }
          $scope.$nodesMap[subNode.$modelValue.$$hashKey] = subNode;
        };

        $scope.destroySubNode = function (subNode) {
          if (!subNode.$modelValue) {
            return null;
          }
          $scope.$nodesMap[subNode.$modelValue.$$hashKey] = null;
        };

        $scope.accept = function (sourceNode, destIndex) {
          return $scope.$treeScope.$callbacks.accept(sourceNode, $scope, destIndex);
        };

        $scope.beforeDrag = function (sourceNode) {
          return $scope.$treeScope.$callbacks.beforeDrag(sourceNode);
        };

        $scope.isParent = function (node) {
          return node.$parentNodesScope === $scope;
        };

        $scope.hasChild = function () {
          return $scope.$modelValue.length > 0;
        };

        $scope.safeApply = function (fn) {
          var phase = this.$root.$$phase;
          if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof (fn) === 'function')) {
              fn();
            }
          } else {
            this.$apply(fn);
          }
        };

        $scope.removeNode = function (node) {
          var index = $scope.$modelValue.indexOf(node.$modelValue);
          if (index > -1) {
            $scope.safeApply(function () {
             // $scope.$modelValue.splice(index, 1)[0];
                $scope.$modelValue.splice(index, 1);
            });
            return $scope.$treeScope.$callbacks.removed(node);
          }
          return null;
        };

        $scope.insertNode = function (index, nodeData) {
          $scope.safeApply(function () {
            $scope.$modelValue.splice(index, 0, nodeData);
          });
        };

        $scope.childNodes = function () {
          var i, nodes = [];
          if ($scope.$modelValue) {
            for (i = 0; i < $scope.$modelValue.length; i++) {
              nodes.push($scope.$nodesMap[$scope.$modelValue[i].$$hashKey]);
            }
          }
          return nodes;
        };

        $scope.depth = function () {
          if ($scope.$nodeScope) {
            return $scope.$nodeScope.depth();
          }
          return 0; // if it has no $nodeScope, it's root
        };

        // check if depth limit has reached
        $scope.outOfDepth = function (sourceNode) {
          var maxDepth = $scope.maxDepth || $scope.$treeScope.maxDepth;
          if (maxDepth > 0) {
            return $scope.depth() + sourceNode.maxSubDepth() + 1 > maxDepth;
          }
          return false;
        };

      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')

    .controller('TreeController', ['$scope', '$element',
      function ($scope, $element) {
        this.scope = $scope;

        $scope.$element = $element;
        $scope.$nodesScope = null; // root nodes
        $scope.$type = 'uiTree';
        $scope.$emptyElm = null;
        $scope.$callbacks = null;

        $scope.dragEnabled = true;
        $scope.emptyPlaceholderEnabled = true;
        $scope.maxDepth = 0;
        $scope.dragDelay = 0;
        $scope.cloneEnabled = false;
        $scope.nodropEnabled = false;

        // Check if it's a empty tree
        $scope.isEmpty = function () {
          return ($scope.$nodesScope && $scope.$nodesScope.$modelValue && $scope.$nodesScope.$modelValue.length === 0);
        };

        // add placeholder to empty tree
        $scope.place = function (placeElm) {
          $scope.$nodesScope.$element.append(placeElm);
          $scope.$emptyElm.remove();
        };

        this.resetEmptyElement = function () {
          if ((!$scope.$nodesScope.$modelValue || $scope.$nodesScope.$modelValue.length === 0) &&
            $scope.emptyPlaceholderEnabled) {
            $element.append($scope.$emptyElm);
          } else {
            $scope.$emptyElm.remove();
          }
        };

        $scope.resetEmptyElement = this.resetEmptyElement;
      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')
    .directive('uiTree', ['treeConfig', '$window',
      function (treeConfig, $window) {
        return {
          restrict: 'A',
          scope: true,
          controller: 'TreeController',
          link: function (scope, element, attrs, ctrl) {
            var callbacks = {
              accept: null,
              beforeDrag: null
            },
              config = {},
              tdElm,
              $trElm,
              emptyElmColspan;

            angular.extend(config, treeConfig);
            if (config.treeClass) {
              element.addClass(config.treeClass);
            }

            if (element.prop('tagName').toLowerCase() === 'table') {
              scope.$emptyElm = angular.element($window.document.createElement('tr'));
              $trElm = element.find('tr');
              // If we can find a tr, then we can use its td children as the empty element colspan.
              if ($trElm.length > 0) {
                emptyElmColspan = angular.element($trElm).children().length;
              } else {
                // If not, by setting a huge colspan we make sure it takes full width.
                emptyElmColspan = 1000000;
              }
              tdElm = angular.element($window.document.createElement('td'))
                .attr('colspan', emptyElmColspan);
              scope.$emptyElm.append(tdElm);
            } else {
              scope.$emptyElm = angular.element($window.document.createElement('div'));
            }

            if (config.emptyTreeClass) {
              scope.$emptyElm.addClass(config.emptyTreeClass);
            }

            scope.$watch('$nodesScope.$modelValue.length', function (val) {
              if (!angular.isNumber(val)) {
                return;
              }

              ctrl.resetEmptyElement();
            }, true);

            scope.$watch(attrs.dragEnabled, function (val) {
              if ((typeof val) === 'boolean') {
                scope.dragEnabled = val;
              }
            });

            scope.$watch(attrs.emptyPlaceholderEnabled, function (val) {
              if ((typeof val) === 'boolean') {
                scope.emptyPlaceholderEnabled = val;
                ctrl.resetEmptyElement();
              }
            });

            scope.$watch(attrs.nodropEnabled, function (val) {
              if ((typeof val) === 'boolean') {
                scope.nodropEnabled = val;
              }
            });

            scope.$watch(attrs.cloneEnabled, function (val) {
              if ((typeof val) === 'boolean') {
                scope.cloneEnabled = val;
              }
            });

            scope.$watch(attrs.maxDepth, function (val) {
              if ((typeof val) === 'number') {
                scope.maxDepth = val;
              }
            });

            scope.$watch(attrs.dragDelay, function (val) {
              if ((typeof val) === 'number') {
                scope.dragDelay = val;
              }
            });

            /**
             * Callback checks if the destination node can accept the dragged node.
             * By default, ui-tree will check that 'data-nodrop-enabled' is not set for the
             * destination ui-tree-nodes, and that the 'max-depth' attribute will not be exceeded
             * if it is set on the ui-tree or ui-tree-nodes.
             * This callback can be overridden, but callers must manually enforce nodrop and max-depth
             * themselves if they need those to be enforced.
             * @param sourceNodeScope Scope of the ui-tree-node being dragged
             * @param destNodesScope Scope of the ui-tree-nodes where the node is hovering
             * @param destIndex Index in the destination nodes array where the source node will drop
             * @returns {boolean} True if the node is permitted to be dropped here
             */
            callbacks.accept = function (sourceNodeScope, destNodesScope, destIndex) {
              return !(destNodesScope.nodropEnabled || destNodesScope.$treeScope.nodropEnabled || destNodesScope.outOfDepth(sourceNodeScope));
            };

            callbacks.beforeDrag = function (sourceNodeScope) {
              return true;
            };

            callbacks.removed = function (node) {

            };

            /**
             * Callback is fired when a node is successfully dropped in a new location
             * @param event
             */
            callbacks.dropped = function (event) {

            };

            /**
             * Callback is fired each time the user starts dragging a node
             * @param event
             */
            callbacks.dragStart = function (event) {

            };

            /**
             * Callback is fired each time a dragged node is moved with the mouse/touch.
             * @param event
             */
            callbacks.dragMove = function (event) {

            };

            /**
             * Callback is fired when the tree exits drag mode. If the user dropped a node, the drop may have been
             * accepted or reverted.
             * @param event
             */
            callbacks.dragStop = function (event) {

            };

            /**
             * Callback is fired when a user drops a node (but prior to processing the drop action)
             * beforeDrop can return a Promise, truthy, or falsy (returning nothing is falsy).
             * If it returns falsy, or a resolve Promise, the node move is accepted
             * If it returns truthy, or a rejected Promise, the node move is reverted
             * @param event
             * @returns {Boolean|Promise} Truthy (or rejected Promise) to cancel node move; falsy (or resolved promise)
             */
            callbacks.beforeDrop = function (event) {

            };

            scope.$watch(attrs.uiTree, function (newVal, oldVal) {
              angular.forEach(newVal, function (value, key) {
                if (callbacks[key]) {
                  if (typeof value === 'function') {
                    callbacks[key] = value;
                  }
                }
              });

              scope.$callbacks = callbacks;
            }, true);


          }
        };
      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')
    .directive('uiTreeHandle', ['treeConfig',
      function (treeConfig) {
        return {
          require: '^uiTreeNode',
          restrict: 'A',
          scope: true,
          controller: 'TreeHandleController',
          link: function (scope, element, attrs, treeNodeCtrl) {
            var config = {};
            angular.extend(config, treeConfig);
            if (config.handleClass) {
              element.addClass(config.handleClass);
            }
            // connect with the tree node.
            if (scope !== treeNodeCtrl.scope) {
              scope.$nodeScope = treeNodeCtrl.scope;
              treeNodeCtrl.scope.$handleScope = scope;
            }
          }
        };
      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')

    .directive('uiTreeNode', ['treeConfig', 'UiTreeHelper', '$window', '$document', '$timeout', '$q', '$rootElement',
      function (treeConfig, UiTreeHelper, $window, $document, $timeout, $q, $rootElement) {
        return {
          require: ['^uiTreeNodes', '^uiTree'],
          restrict: 'A',
          controller: 'TreeNodeController',
          link: function (scope, element, attrs, controllersArr) {
            // todo startPos is unused
            var config = {},
              hasTouch = 'ontouchstart' in window,
              startPos, firstMoving, dragInfo, pos,
              placeElm, hiddenPlaceElm, dragElm,
              treeScope = null,
              elements, // As a parameter for callbacks
              dragDelaying = true,
              dragStarted = false,
              dragTimer = null,
              body = document.body,
              html = document.documentElement,
              document_height,
              document_width,
              dragStart,
              tagName,
              dragMove,
              dragEnd,
              dragStartEvent,
              dragMoveEvent,
              dragEndEvent,
              dragCancelEvent,
              dragDelay,
              bindDragStartEvents,
              bindDragMoveEvents,
              unbindDragMoveEvents,
              keydownHandler,
              outOfBounds,
              isHandleChild,
              el;

            angular.extend(config, treeConfig);
            if (config.nodeClass) {
              element.addClass(config.nodeClass);
            }
            scope.init(controllersArr);

            scope.collapsed = !!UiTreeHelper.getNodeAttribute(scope, 'collapsed') || treeConfig.defaultCollapsed;
            scope.sourceOnly = scope.nodropEnabled || scope.$treeScope.nodropEnabled;

            scope.$watch(attrs.collapsed, function (val) {
              if ((typeof val) === 'boolean') {
                scope.collapsed = val;
              }
            });

            scope.$watch('collapsed', function (val) {
              UiTreeHelper.setNodeAttribute(scope, 'collapsed', val);
              attrs.$set('collapsed', val);
            });

            scope.$on('angular-ui-tree:collapse-all', function () {
              scope.collapsed = true;
            });

            scope.$on('angular-ui-tree:expand-all', function () {
              scope.collapsed = false;
            });

            /**
             * Called when the user has grabbed a node and started dragging it
             * @param e
             */
            dragStart = function (e) {
              // disable right click
              if (!hasTouch && (e.button === 2 || e.which === 3)) {
                return;
              }

              // event has already fired in other scope
              if (e.uiTreeDragging || (e.originalEvent && e.originalEvent.uiTreeDragging)) {
                return;
              }

              // the node being dragged
              var eventElm = angular.element(e.target),
                isHandleChild, cloneElm, eventElmTagName, tagName,
                eventObj, tdElm, hStyle,
                isTreeNode,
                isTreeNodeHandle;

              // if the target element is a child element of a ui-tree-handle,
              // use the containing handle element as target element
              isHandleChild = UiTreeHelper.treeNodeHandlerContainerOfElement(eventElm);
              if (isHandleChild) {
                eventElm = angular.element(isHandleChild);
              }

              cloneElm = element.clone();
              isTreeNode = UiTreeHelper.elementIsTreeNode(eventElm);
              isTreeNodeHandle = UiTreeHelper.elementIsTreeNodeHandle(eventElm);

              if (!isTreeNode && !isTreeNodeHandle) {
                return;
              }

              if (isTreeNode && UiTreeHelper.elementContainsTreeNodeHandler(eventElm)) {
                return;
              }

              eventElmTagName = eventElm.prop('tagName').toLowerCase();
              if (eventElmTagName === 'input' ||
                eventElmTagName === 'textarea' ||
                eventElmTagName === 'button' ||
                eventElmTagName === 'select') { // if it's a input or button, ignore it
                return;
              }

              // check if it or it's parents has a 'data-nodrag' attribute
              el = angular.element(e.target);
              while (el && el[0] && el[0] !== element) {
                if (UiTreeHelper.nodrag(el)) { // if the node mark as `nodrag`, DONOT drag it.
                  return;
                }
                el = el.parent();
              }

              if (!scope.beforeDrag(scope)) {
                return;
              }

              e.uiTreeDragging = true; // stop event bubbling
              if (e.originalEvent) {
                e.originalEvent.uiTreeDragging = true;
              }
              e.preventDefault();
              eventObj = UiTreeHelper.eventObj(e);

              firstMoving = true;
              dragInfo = UiTreeHelper.dragInfo(scope);

              tagName = element.prop('tagName');

              if (tagName.toLowerCase() === 'tr') {
                placeElm = angular.element($window.document.createElement(tagName));
                tdElm = angular.element($window.document.createElement('td'))
                  .addClass(config.placeholderClass)
                  .attr('colspan', element[0].children.length);
                placeElm.append(tdElm);
              } else {
                placeElm = angular.element($window.document.createElement(tagName))
                  .addClass(config.placeholderClass);
              }
              hiddenPlaceElm = angular.element($window.document.createElement(tagName));
              if (config.hiddenClass) {
                hiddenPlaceElm.addClass(config.hiddenClass);
              }

              pos = UiTreeHelper.positionStarted(eventObj, element);
              placeElm.css('height', UiTreeHelper.height(element) + 'px');

              dragElm = angular.element($window.document.createElement(scope.$parentNodesScope.$element.prop('tagName')))
                .addClass(scope.$parentNodesScope.$element.attr('class')).addClass(config.dragClass);
              dragElm.css('width', UiTreeHelper.width(element) + 'px');
              dragElm.css('z-index', 9999);

              // Prevents cursor to change rapidly in Opera 12.16 and IE when dragging an element
              hStyle = (element[0].querySelector('.angular-ui-tree-handle') || element[0]).currentStyle;
              if (hStyle) {
                document.body.setAttribute('ui-tree-cursor', $document.find('body').css('cursor') || '');
                $document.find('body').css({'cursor': hStyle.cursor + '!important'});
              }

              if (scope.sourceOnly) {
                placeElm.css('display', 'none');
              }
              element.after(placeElm);
              element.after(hiddenPlaceElm);
              if (dragInfo.isClone() && scope.sourceOnly) {
                dragElm.append(cloneElm);
              } else {
                dragElm.append(element);
              }

              $rootElement.append(dragElm);

              dragElm.css({
                'left': eventObj.pageX - pos.offsetX + 'px',
                'top': eventObj.pageY - pos.offsetY + 'px'
              });
              elements = {
                placeholder: placeElm,
                dragging: dragElm
              };

              bindDragMoveEvents();
              // Fire dragStart callback
              scope.$apply(function () {
                scope.$treeScope.$callbacks.dragStart(dragInfo.eventArgs(elements, pos));
              });

              document_height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
              document_width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
            };

            dragMove = function (e) {
              var eventObj = UiTreeHelper.eventObj(e),
                prev,
                next,
                leftElmPos,
                topElmPos,
                top_scroll,
                bottom_scroll,
                target,
                decrease,
                targetX,
                targetY,
                displayElm,
                targetNode,
                targetElm,
                isEmpty,
                targetOffset,
                targetBefore;

              if (dragElm) {
                e.preventDefault();

                if ($window.getSelection) {
                  $window.getSelection().removeAllRanges();
                } else if ($window.document.selection) {
                  $window.document.selection.empty();
                }

                leftElmPos = eventObj.pageX - pos.offsetX;
                topElmPos = eventObj.pageY - pos.offsetY;

                //dragElm can't leave the screen on the left
                if (leftElmPos < 0) {
                  leftElmPos = 0;
                }

                //dragElm can't leave the screen on the top
                if (topElmPos < 0) {
                  topElmPos = 0;
                }

                //dragElm can't leave the screen on the bottom
                if ((topElmPos + 10) > document_height) {
                  topElmPos = document_height - 10;
                }

                //dragElm can't leave the screen on the right
                if ((leftElmPos + 10) > document_width) {
                  leftElmPos = document_width - 10;
                }

                dragElm.css({
                  'left': leftElmPos + 'px',
                  'top': topElmPos + 'px'
                });

                top_scroll = window.pageYOffset || $window.document.documentElement.scrollTop;
                bottom_scroll = top_scroll + (window.innerHeight || $window.document.clientHeight || $window.document.clientHeight);

                // to scroll down if cursor y-position is greater than the bottom position the vertical scroll
                if (bottom_scroll < eventObj.pageY && bottom_scroll <= document_height) {
                  window.scrollBy(0, 10);
                }

                // to scroll top if cursor y-position is less than the top position the vertical scroll
                if (top_scroll > eventObj.pageY) {
                  window.scrollBy(0, -10);
                }

                UiTreeHelper.positionMoved(e, pos, firstMoving);
                if (firstMoving) {
                  firstMoving = false;
                  return;
                }

                // check if add it as a child node first
                // todo decrease is unused
                decrease = (UiTreeHelper.offset(dragElm).left - UiTreeHelper.offset(placeElm).left) >= config.threshold;

                targetX = eventObj.pageX - ($window.pageXOffset ||
                  $window.document.body.scrollLeft ||
                  $window.document.documentElement.scrollLeft) -
                  ($window.document.documentElement.clientLeft || 0);

                targetY = eventObj.pageY - ($window.pageYOffset ||
                  $window.document.body.scrollTop ||
                  $window.document.documentElement.scrollTop) -
                  ($window.document.documentElement.clientTop || 0);

                // Select the drag target. Because IE does not support CSS 'pointer-events: none', it will always
                // pick the drag element itself as the target. To prevent this, we hide the drag element while
                // selecting the target.
                if (angular.isFunction(dragElm.hide)) {
                  dragElm.hide();
                } else {
                  displayElm = dragElm[0].style.display;
                  dragElm[0].style.display = 'none';
                }

                // when using elementFromPoint() inside an iframe, you have to call
                // elementFromPoint() twice to make sure IE8 returns the correct value
                $window.document.elementFromPoint(targetX, targetY);

                targetElm = angular.element($window.document.elementFromPoint(targetX, targetY));

                // if the target element is a child element of a ui-tree-handle,
                // use the containing handle element as target element
                isHandleChild = UiTreeHelper.treeNodeHandlerContainerOfElement(targetElm);
                if (isHandleChild) {
                  targetElm = angular.element(isHandleChild);
                }

                if (angular.isFunction(dragElm.show)) {
                  dragElm.show();
                } else {
                  dragElm[0].style.display = displayElm;
                }

                outOfBounds = !UiTreeHelper.elementIsTreeNodeHandle(targetElm) &&
                              !UiTreeHelper.elementIsTreeNode(targetElm) &&
                              !UiTreeHelper.elementIsTreeNodes(targetElm) &&
                              !UiTreeHelper.elementIsTree(targetElm) &&
                              !UiTreeHelper.elementIsPlaceholder(targetElm);

                // Detect out of bounds condition, update drop target display, and prevent drop
                if (outOfBounds) {

                  // Remove the placeholder
                  placeElm.remove();

                  // If the target was an empty tree, replace the empty element placeholder
                  if (treeScope) {
                    treeScope.resetEmptyElement();
                    treeScope = null;
                  }
                }

                // move horizontal
                if (pos.dirAx && pos.distAxX >= config.levelThreshold) {
                  pos.distAxX = 0;

                  // increase horizontal level if previous sibling exists and is not collapsed
                  if (pos.distX > 0) {
                    prev = dragInfo.prev();
                    if (prev && !prev.collapsed && prev.accept(scope, prev.childNodesCount())) {
                      prev.$childNodesScope.$element.append(placeElm);
                      dragInfo.moveTo(prev.$childNodesScope, prev.childNodes(), prev.childNodesCount());
                    }
                  }

                  // decrease horizontal level
                  if (pos.distX < 0) {
                    // we can't decrease a level if an item preceeds the current one
                    next = dragInfo.next();
                    if (!next) {
                      target = dragInfo.parentNode(); // As a sibling of it's parent node
                      if (target && target.$parentNodesScope.accept(scope, target.index() + 1)) {
                        target.$element.after(placeElm);
                        dragInfo.moveTo(target.$parentNodesScope, target.siblings(), target.index() + 1);
                      }
                    }
                  }
                }

                // move vertical
                if (!pos.dirAx) {
                  if (UiTreeHelper.elementIsTree(targetElm)) {
                    targetNode = targetElm.controller('uiTree').scope;
                  } else if (UiTreeHelper.elementIsTreeNodeHandle(targetElm)) {
                    targetNode = targetElm.controller('uiTreeHandle').scope;
                  } else if (UiTreeHelper.elementIsTreeNode(targetElm)) {
                    targetNode = targetElm.controller('uiTreeNode').scope;
                  } else if (UiTreeHelper.elementIsTreeNodes(targetElm)) {
                    targetNode = targetElm.controller('uiTreeNodes').scope;
                  } else if (UiTreeHelper.elementIsPlaceholder(targetElm)) {
                    targetNode = targetElm.controller('uiTreeNodes').scope;
                  } else if (targetElm.controller('uiTreeNode')) {
                    // is a child element of a node
                    targetNode = targetElm.controller('uiTreeNode').scope;
                  }

                  // check it's new position
                  isEmpty = false;
                  if (!targetNode) {
                    return;
                  }

                  // Show the placeholder if it was hidden for nodrop-enabled and this is a new tree
                  if (targetNode.$treeScope && !targetNode.$parent.nodropEnabled && !targetNode.$treeScope.nodropEnabled) {
                    placeElm.css('display', '');
                  }

                  if (targetNode.$type === 'uiTree' && targetNode.dragEnabled) {
                    isEmpty = targetNode.isEmpty(); // Check if it's empty tree
                  }

                  if (targetNode.$type === 'uiTreeHandle') {
                    targetNode = targetNode.$nodeScope;
                  }

                  if (targetNode.$type !== 'uiTreeNode' && !isEmpty) { // Check if it is a uiTreeNode or it's an empty tree
                    return;
                  }

                  // if placeholder move from empty tree, reset it.
                  if (treeScope && placeElm.parent()[0] !== treeScope.$element[0]) {
                    treeScope.resetEmptyElement();
                    treeScope = null;
                  }

                  if (isEmpty) { // it's an empty tree
                    treeScope = targetNode;
                    if (targetNode.$nodesScope.accept(scope, 0)) {
                      targetNode.place(placeElm);
                      dragInfo.moveTo(targetNode.$nodesScope, targetNode.$nodesScope.childNodes(), 0);
                    }
                  } else if (targetNode.dragEnabled()) { // drag enabled
                    targetElm = targetNode.$element; // Get the element of ui-tree-node
                    targetOffset = UiTreeHelper.offset(targetElm);
                    targetBefore = targetNode.horizontal ? eventObj.pageX < (targetOffset.left + UiTreeHelper.width(targetElm) / 2)
                      : eventObj.pageY < (targetOffset.top + UiTreeHelper.height(targetElm) / 2);

                    if (targetNode.$parentNodesScope.accept(scope, targetNode.index())) {
                      if (targetBefore) {
                        targetElm[0].parentNode.insertBefore(placeElm[0], targetElm[0]);
                        dragInfo.moveTo(targetNode.$parentNodesScope, targetNode.siblings(), targetNode.index());
                      } else {
                        targetElm.after(placeElm);
                        dragInfo.moveTo(targetNode.$parentNodesScope, targetNode.siblings(), targetNode.index() + 1);
                      }
                    } else if (!targetBefore && targetNode.accept(scope, targetNode.childNodesCount())) { // we have to check if it can add the dragging node as a child
                      targetNode.$childNodesScope.$element.append(placeElm);
                      dragInfo.moveTo(targetNode.$childNodesScope, targetNode.childNodes(), targetNode.childNodesCount());
                    } else {
                      outOfBounds = true;
                    }
                  }
                }

                scope.$apply(function () {
                  scope.$treeScope.$callbacks.dragMove(dragInfo.eventArgs(elements, pos));
                });
              }
            };

            dragEnd = function (e) {
              var dragEventArgs = dragInfo.eventArgs(elements, pos);
              e.preventDefault();
              unbindDragMoveEvents();

              scope.$treeScope.$apply(function () {
                $q.when(scope.$treeScope.$callbacks.beforeDrop(dragEventArgs))
                    // promise resolved (or callback didn't return false)
                    .then(function (allowDrop) {
                      if (allowDrop !== false && scope.$$allowNodeDrop && !outOfBounds) { // node drop accepted)
                        dragInfo.apply();
                        // fire the dropped callback only if the move was successful
                        scope.$treeScope.$callbacks.dropped(dragEventArgs);
                      } else { // drop canceled - revert the node to its original position
                        bindDragStartEvents();
                      }
                    })
                    // promise rejected - revert the node to its original position
                    .catch(function () {
                      bindDragStartEvents();
                    })
                    .finally(function () {
                      hiddenPlaceElm.replaceWith(scope.$element);
                      placeElm.remove();

                      if (dragElm) { // drag element is attached to the mouse pointer
                        dragElm.remove();
                        dragElm = null;
                      }
                      scope.$treeScope.$callbacks.dragStop(dragEventArgs);
                      scope.$$allowNodeDrop = false;
                      dragInfo = null;

                      // Restore cursor in Opera 12.16 and IE
                      var oldCur = document.body.getAttribute('ui-tree-cursor');
                      if (oldCur !== null) {
                        $document.find('body').css({'cursor': oldCur});
                        document.body.removeAttribute('ui-tree-cursor');
                      }
                    });
              });
            };

            dragStartEvent = function (e) {
              if (scope.dragEnabled()) {
                dragStart(e);
              }
            };

            dragMoveEvent = function (e) {
              dragMove(e);
            };

            dragEndEvent = function (e) {
              scope.$$allowNodeDrop = true;
              dragEnd(e);
            };

            dragCancelEvent = function (e) {
              dragEnd(e);
            };

            dragDelay = (function () {
              var to;

              return {
                exec: function (fn, ms) {
                  if (!ms) {
                    ms = 0;
                  }
                  this.cancel();
                  to = $timeout(fn, ms);
                },
                cancel: function () {
                  $timeout.cancel(to);
                }
              };
            })();

            /**
             * Binds the mouse/touch events to enable drag start for this node
             */
            bindDragStartEvents = function () {
              element.bind('touchstart mousedown', function (e) {
                dragDelay.exec(function () {
                  dragStartEvent(e);
                }, scope.dragDelay || 0);
              });
              element.bind('touchend touchcancel mouseup', function () {
                dragDelay.cancel();
              });
            };
            bindDragStartEvents();

            /**
             * Binds mouse/touch events that handle moving/dropping this dragged node
             */
            bindDragMoveEvents = function () {
              angular.element($document).bind('touchend', dragEndEvent);
              angular.element($document).bind('touchcancel', dragEndEvent);
              angular.element($document).bind('touchmove', dragMoveEvent);
              angular.element($document).bind('mouseup', dragEndEvent);
              angular.element($document).bind('mousemove', dragMoveEvent);
              angular.element($document).bind('mouseleave', dragCancelEvent);
            };

            /**
             * Unbinds mouse/touch events that handle moving/dropping this dragged node
             */
            unbindDragMoveEvents = function () {
              angular.element($document).unbind('touchend', dragEndEvent);
              angular.element($document).unbind('touchcancel', dragEndEvent);
              angular.element($document).unbind('touchmove', dragMoveEvent);
              angular.element($document).unbind('mouseup', dragEndEvent);
              angular.element($document).unbind('mousemove', dragMoveEvent);
              angular.element($document).unbind('mouseleave', dragCancelEvent);
            };

            keydownHandler = function (e) {
              if (e.keyCode === 27) {
                scope.$$allowNodeDrop = false;
                dragEnd(e);
              }
            };

            angular.element($window.document).bind('keydown', keydownHandler);

            //unbind handler that retains scope
            scope.$on('$destroy', function () {
              angular.element($window.document).unbind('keydown', keydownHandler);
            });
          }
        };
      }
    ]);

})();

(function () {
  'use strict';

  angular.module('ui.tree')
    .directive('uiTreeNodes', ['treeConfig', '$window',
      function (treeConfig) {
        return {
          require: ['ngModel', '?^uiTreeNode', '^uiTree'],
          restrict: 'A',
          scope: true,
          controller: 'TreeNodesController',
          link: function (scope, element, attrs, controllersArr) {

            var config = {},
                ngModel = controllersArr[0],
                treeNodeCtrl = controllersArr[1],
                treeCtrl = controllersArr[2];

            angular.extend(config, treeConfig);
            if (config.nodesClass) {
              element.addClass(config.nodesClass);
            }

            if (treeNodeCtrl) {
              treeNodeCtrl.scope.$childNodesScope = scope;
              scope.$nodeScope = treeNodeCtrl.scope;
            } else {
              // find the root nodes if there is no parent node and have a parent ui-tree
              treeCtrl.scope.$nodesScope = scope;
            }
            scope.$treeScope = treeCtrl.scope;

            if (ngModel) {
              ngModel.$render = function () {
                scope.$modelValue = ngModel.$modelValue;
              };
            }

            scope.$watch(function () {
              return attrs.maxDepth;
            }, function (val) {
              if ((typeof val) === 'number') {
                scope.maxDepth = val;
              }
            });

            scope.$watch(function () {
              return attrs.nodropEnabled;
            }, function (newVal) {
              if ((typeof newVal) !== 'undefined') {
                scope.nodropEnabled = true;
              }
            }, true);

            attrs.$observe('horizontal', function (val) {
              scope.horizontal = ((typeof val) !== 'undefined');
            });

          }
        };
      }
    ]);
})();

(function () {
  'use strict';

  angular.module('ui.tree')

  /**
   * @ngdoc service
   * @name ui.tree.service:UiTreeHelper
   * @requires ng.$document
   * @requires ng.$window
   *
   * @description
   * angular-ui-tree.
   */
    .factory('UiTreeHelper', ['$document', '$window', 'treeConfig',
      function ($document, $window, treeConfig) {
        return {

          /**
           * A hashtable used to storage data of nodes
           * @type {Object}
           */
          nodesData: {},

          setNodeAttribute: function (scope, attrName, val) {
            if (!scope.$modelValue) {
              return null;
            }
            var data = this.nodesData[scope.$modelValue.$$hashKey];
            if (!data) {
              data = {};
              this.nodesData[scope.$modelValue.$$hashKey] = data;
            }
            data[attrName] = val;
          },

          getNodeAttribute: function (scope, attrName) {
            if (!scope.$modelValue) {
              return null;
            }
            var data = this.nodesData[scope.$modelValue.$$hashKey];
            if (data) {
              return data[attrName];
            }
            return null;
          },

          /**
           * @ngdoc method
           * @methodOf ui.tree.service:$nodrag
           * @param  {Object} targetElm angular element
           * @return {Bool} check if the node can be dragged.
           */
          nodrag: function (targetElm) {
            if (typeof targetElm.attr('data-nodrag') !== 'undefined') {
              return targetElm.attr('data-nodrag') !== 'false';
            }
            return false;
          },

          /**
           * get the event object for touches
           * @param  {[type]} e [description]
           * @return {[type]}   [description]
           */
          eventObj: function (e) {
            var obj = e;
            if (e.targetTouches !== undefined) {
              obj = e.targetTouches.item(0);
            } else if (e.originalEvent !== undefined && e.originalEvent.targetTouches !== undefined) {
              obj = e.originalEvent.targetTouches.item(0);
            }
            return obj;
          },

          dragInfo: function (node) {
            return {
              source: node,
              sourceInfo: {
                cloneModel: node.$treeScope.cloneEnabled === true ? angular.copy(node.$modelValue) : undefined,
                nodeScope: node,
                index: node.index(),
                nodesScope: node.$parentNodesScope
              },
              index: node.index(),
              siblings: node.siblings().slice(0),
              parent: node.$parentNodesScope,

              // Move the node to a new position
              moveTo: function (parent, siblings, index) {
                this.parent = parent;
                this.siblings = siblings.slice(0);

                // If source node is in the target nodes
                var i = this.siblings.indexOf(this.source);
                if (i > -1) {
                  this.siblings.splice(i, 1);
                  if (this.source.index() < index) {
                    index--;
                  }
                }

                this.siblings.splice(index, 0, this.source);
                this.index = index;
              },

              parentNode: function () {
                return this.parent.$nodeScope;
              },

              prev: function () {
                if (this.index > 0) {
                  return this.siblings[this.index - 1];
                }

                return null;
              },

              next: function () {
                if (this.index < this.siblings.length - 1) {
                  return this.siblings[this.index + 1];
                }

                return null;
              },

              isClone: function () {
                return this.source.$treeScope.cloneEnabled === true;
              },

              clonedNode: function (node) {
                return angular.copy(node);
              },

              isDirty: function () {
                return this.source.$parentNodesScope !== this.parent ||
                  this.source.index() !== this.index;
              },

              isForeign: function () {
                return this.source.$treeScope !== this.parent.$treeScope;
              },

              eventArgs: function (elements, pos) {
                return {
                  source: this.sourceInfo,
                  dest: {
                    index: this.index,
                    nodesScope: this.parent
                  },
                  elements: elements,
                  pos: pos
                };
              },

              apply: function () {

                var nodeData = this.source.$modelValue;

                // nodrop enabled on tree or parent
                if (this.parent.nodropEnabled || this.parent.$treeScope.nodropEnabled) {
                  return;
                }

                // node was dropped in the same place - do nothing
                if (!this.isDirty()) {
                  return;
                }

                // cloneEnabled and cross-tree so copy and do not remove from source
                if (this.isClone() && this.isForeign()) {
                  this.parent.insertNode(this.index, this.sourceInfo.cloneModel);
                } else { // Any other case, remove and reinsert
                  this.source.remove();
                  this.parent.insertNode(this.index, nodeData);
                }
              }
            };
          },

          /**
           * @ngdoc method
           * @name ui.tree#height
           * @methodOf ui.tree.service:UiTreeHelper
           *
           * @description
           * Get the height of an element.
           *
           * @param {Object} element Angular element.
           * @returns {String} Height
           */
          height: function (element) {
            return element.prop('scrollHeight');
          },

          /**
           * @ngdoc method
           * @name ui.tree#width
           * @methodOf ui.tree.service:UiTreeHelper
           *
           * @description
           * Get the width of an element.
           *
           * @param {Object} element Angular element.
           * @returns {String} Width
           */
          width: function (element) {
            return element.prop('scrollWidth');
          },

          /**
           * @ngdoc method
           * @name ui.tree#offset
           * @methodOf ui.nestedSortable.service:UiTreeHelper
           *
           * @description
           * Get the offset values of an element.
           *
           * @param {Object} element Angular element.
           * @returns {Object} Object with properties width, height, top and left
           */
          offset: function (element) {
            var boundingClientRect = element[0].getBoundingClientRect();

            return {
              width: element.prop('offsetWidth'),
              height: element.prop('offsetHeight'),
              top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
              left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft || $document[0].documentElement.scrollLeft)
            };
          },

          /**
           * @ngdoc method
           * @name ui.tree#positionStarted
           * @methodOf ui.tree.service:UiTreeHelper
           *
           * @description
           * Get the start position of the target element according to the provided event properties.
           *
           * @param {Object} e Event
           * @param {Object} target Target element
           * @returns {Object} Object with properties offsetX, offsetY, startX, startY, nowX and dirX.
           */
          positionStarted: function (e, target) {
            var pos = {},
              pageX = e.pageX,
              pageY = e.pageY;

            if (e.originalEvent && e.originalEvent.touches && (e.originalEvent.touches.length > 0)) {
              pageX = e.originalEvent.touches[0].pageX;
              pageY = e.originalEvent.touches[0].pageY;
            }
            pos.offsetX = pageX - this.offset(target).left;
            pos.offsetY = pageY - this.offset(target).top;
            pos.startX = pos.lastX = pageX;
            pos.startY = pos.lastY = pageY;
            pos.nowX = pos.nowY = pos.distX = pos.distY = pos.dirAx = 0;
            pos.dirX = pos.dirY = pos.lastDirX = pos.lastDirY = pos.distAxX = pos.distAxY = 0;
            return pos;
          },

          positionMoved: function (e, pos, firstMoving) {
            var pageX = e.pageX,
              pageY = e.pageY,
              newAx;
            if (e.originalEvent && e.originalEvent.touches && (e.originalEvent.touches.length > 0)) {
              pageX = e.originalEvent.touches[0].pageX;
              pageY = e.originalEvent.touches[0].pageY;
            }
            // mouse position last events
            pos.lastX = pos.nowX;
            pos.lastY = pos.nowY;

            // mouse position this events
            pos.nowX = pageX;
            pos.nowY = pageY;

            // distance mouse moved between events
            pos.distX = pos.nowX - pos.lastX;
            pos.distY = pos.nowY - pos.lastY;

            // direction mouse was moving
            pos.lastDirX = pos.dirX;
            pos.lastDirY = pos.dirY;

            // direction mouse is now moving (on both axis)
            pos.dirX = pos.distX === 0 ? 0 : pos.distX > 0 ? 1 : -1;
            pos.dirY = pos.distY === 0 ? 0 : pos.distY > 0 ? 1 : -1;

            // axis mouse is now moving on
            newAx = Math.abs(pos.distX) > Math.abs(pos.distY) ? 1 : 0;

            // do nothing on first move
            if (firstMoving) {
              pos.dirAx = newAx;
              pos.moving = true;
              return;
            }

            // calc distance moved on this axis (and direction)
            if (pos.dirAx !== newAx) {
              pos.distAxX = 0;
              pos.distAxY = 0;
            } else {
              pos.distAxX += Math.abs(pos.distX);
              if (pos.dirX !== 0 && pos.dirX !== pos.lastDirX) {
                pos.distAxX = 0;
              }

              pos.distAxY += Math.abs(pos.distY);
              if (pos.dirY !== 0 && pos.dirY !== pos.lastDirY) {
                pos.distAxY = 0;
              }
            }

            pos.dirAx = newAx;
          },

          elementIsTreeNode: function (element) {
            return typeof element.attr('ui-tree-node') !== 'undefined';
          },

          elementIsTreeNodeHandle: function (element) {
            return typeof element.attr('ui-tree-handle') !== 'undefined';
          },
          elementIsTree: function (element) {
            return typeof element.attr('ui-tree') !== 'undefined';
          },
          elementIsTreeNodes: function (element) {
            return typeof element.attr('ui-tree-nodes') !== 'undefined';
          },
          elementIsPlaceholder: function (element) {
            return element.hasClass(treeConfig.placeholderClass);
          },
          elementContainsTreeNodeHandler: function (element) {
            return element[0].querySelectorAll('[ui-tree-handle]').length >= 1;
          },
          treeNodeHandlerContainerOfElement: function (element) {
            return findFirstParentElementWithAttribute('ui-tree-handle', element[0]);
          }
        };
      }
    ]);

  // TODO: optimize this loop
  function findFirstParentElementWithAttribute(attributeName, childObj) {
    // undefined if the mouse leaves the browser window
    if (childObj === undefined) {
      return null;
    }
    var testObj = childObj.parentNode,
      count = 1,
      // check for setAttribute due to exception thrown by Firefox when a node is dragged outside the browser window
      res = (typeof testObj.setAttribute === 'function' && testObj.hasAttribute(attributeName)) ? testObj : null;
    while (testObj && typeof testObj.setAttribute === 'function' && !testObj.hasAttribute(attributeName)) {
      testObj = testObj.parentNode;
      res = testObj;
      if (testObj === document.documentElement) {
        res = null;
        break;
      }
      count++;
    }

    return res;
  }

})();

angular.module('recipes').directive('measureconverter', ["MeasureService", function (MeasureService) {
    'use strict';
    return {
        restrict: 'AE',
        scope: {
            value: '=ngModel',
            measure: '=',
            toggle: '=',
            precision: '='
        },
        require: 'ngModel',
        template: '<div ng-show="toggle">' +
                '<div class="btn-group">' +
                    '<label class="btn btn-default" ng-click="toggle=false">' +
                        '<div ng-hide="measure.step > 0">' +
                            '<i class="glyphicon glyphicon-menu-left"></i> {{measure.caption}}' +
                       '</div>' +
                        '<div ng-show="measure.step > 0">' +
                            '<i class="glyphicon glyphicon-menu-left"></i> {{value}} {{measure.caption}}' +
                       '</div>' +
                    '</label>' +
                    '<div class="btn-group" dropdown>' +
                        '<label class="btn btn-default" ng-click="apply()">' +
                                '{{newValue}} {{newCaption}} <i class="glyphicon glyphicon-retweet"></i>' +
                        '</label>' +
                        '<label class="btn btn-default" dropdown-toggle>' +
                            '<span class="caret"></span>' +
                        '</label>' +
                        '<ul class="dropdown-menu" role="menu">' +
                            '<li role="menuitem" ng-repeat="item in convertList">' +
                                '<a ng-click="selectItem($index)">' +
                                    '{{item.value}} {{item.caption}}' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
            '</div>',
        link: function (scope, iElement, iAttrs, ngModelController) {
            var precision = scope.precision || 3,
                oldValue = scope.value;
            
            scope.$watch('toggle', function (toggle, oldValue) {
                if (toggle) {
                    scope.convertList = [];
                    if (!scope.measure) {
                        return;
                    }
                    scope.convertList = scope.getConvertList();
                    if (scope.convertList.length === 0) {
                        scope.toggle = false; //measure is not convertable, so hiding directive
                        return;
                    }
                    scope.selectItem(0);
                }
            });
            
            scope.getConvertList = function () {
                if (!scope.measure.converter) {
                    return [];
                }
                return scope.measure.converter.map(function (item, i, arr) {
                    return {
                        id: item.id,
                        value: (!item.uncountable && scope.value) ? Number((scope.value * item.rate).toFixed(precision)) : undefined,
                        caption: item.caption
                    };
                });
            };
            
            scope.selectItem = function (index) {
            
                MeasureService.get(
                    {
                        measureId: scope.convertList[index].id
                    }
                ).$promise.then(function (newMeasure) {
                    if (!newMeasure) {
                        return;
                    }
                    scope.newValue = newMeasure.applyValue(scope.convertList[index].value, precision);
                    scope.newCaption = newMeasure.caption;
                    scope.newMeasure = newMeasure;
                });
            };
            
            scope.apply = function () {
                ngModelController.$setViewValue(scope.newValue);
                //scope.value = scope.newValue;
                scope.measure = scope.newMeasure;
                scope.toggle = false; //job is done, so hiding directive
            };
        }
    };
}]);
"use strict";
angular.module('recipes').directive('toggleSwitch', ['$compile', function($compile) {
	return {
		restrict: 'EA',
		replace: true,
		require:'ngModel',
		scope: {
			isDisabled: '=',
			onLabel: '@',
			offLabel: '@',
			knobLabel: '@',
			html: '=',
			onChange: '&'
		},
		template:
					'<div class="ats-switch" ng-click="toggle()" ng-keypress="onKeyPress($event)" ng-class="{ \'disabled\': isDisabled }" role="switch" aria-checked="{{!!model}}">' +
						'<div class="switch-animate" ng-class="{\'switch-off\': !model, \'switch-on\': model}">' +
							'<span class="switch-left"></span>' +
							'<span class="knob"></span>' +
							'<span class="switch-right"></span>' +
						'</div>' +
					'</div>',
		compile: function(element, attrs) {
			if (angular.isUndefined(attrs.onLabel)) {
				attrs.onLabel = 'On';
			}
			if (angular.isUndefined(attrs.offLabel)) {
				attrs.offLabel = 'Off';
			}
			if (angular.isUndefined(attrs.knobLabel)) {
				attrs.knobLabel = '\u00a0';
			}
			if (angular.isUndefined(attrs.isDisabled)) {
				attrs.isDisabled = false;
			}
			if (angular.isUndefined(attrs.html)) {
				attrs.html = false;
			}
			if (angular.isUndefined(attrs.tabindex)) {
				attrs.tabindex = 0;
			}

			return function postLink(scope, iElement, iAttrs, ngModel) {
				iElement.attr('tabindex', attrs.tabindex);

				scope.toggle = function toggle() {
					if (!scope.isDisabled) {
						scope.model = !scope.model;
						ngModel.$setViewValue(scope.model);
					}
					scope.onChange();
				};

				var spaceCharCode = 32;
				scope.onKeyPress = function onKeyPress($event) {
					if ($event.charCode === spaceCharCode && !$event.altKey && !$event.ctrlKey && !$event.metaKey) {
						scope.toggle();
						$event.preventDefault();
					}
				};

				ngModel.$formatters.push(function(modelValue) {
					return modelValue;
				});

				ngModel.$parsers.push(function(viewValue) {
					return viewValue;
				});

				ngModel.$viewChangeListeners.push(function() {
					scope.$eval(attrs.ngChange);
				});

				ngModel.$render = function() {
					scope.model = ngModel.$viewValue;
				};

				var bindSpan = function(span, html) {
					span = angular.element(span);
					var bindAttributeName = (html === true) ? 'ng-bind-html' : 'ng-bind';

					// remove old ng-bind attributes
					span.removeAttr('ng-bind-html');
					span.removeAttr('ng-bind');

					if (angular.element(span).hasClass("switch-left"))
						span.attr(bindAttributeName, 'onLabel');
					if (span.hasClass("knob"))
						span.attr(bindAttributeName, 'knobLabel');
					if (span.hasClass("switch-right"))
						span.attr(bindAttributeName, 'offLabel');

					$compile(span)(scope, function(cloned, scope) {
						span.replaceWith(cloned);
					});
				};

				// add ng-bind attribute to each span element.
				// NOTE: you need angular-sanitize to use ng-bind-html
				var bindSwitch = function(iElement, html) {
					angular.forEach(iElement[0].children[0].children, function(span, index) {
						bindSpan(span, html);
					});
				};

				scope.$watch('html', function(newValue) {
					bindSwitch(iElement, newValue);
				});
			};
		}
	};
}]);
angular.module('recipes').directive('updowninput', function () {
    'use strict';
    return {
        restrict: 'AE',
        scope: {
            value: '=ngModel',
            convertable: '=',
            min: '=',
            step: '=',
            precision: '=',
            converter: '=',
            measure: '=',
            validatable: "=",
            validator: '&',
            validationId: '='
        },
        require: 'ngModel',
        template: '<div ng-hide="converter">' +
                '<div ng-hide="(measure.step > 0) || !measure">' +
                    '<label class="btn btn-default" ng-click="converter=true">' +
                        '{{measure.caption}}' +
                    '</label>' +
                '</div>' +
                '<div ng-show="(measure.step > 0) || !measure">' +
                    '<div ng-hide="form.input">' +
                        '<div class="btn-group">' +
                            '<label ng-show="convertable" class="btn btn-default" ng-click="converter=true">' +
                                '{{measure.caption}}' +
                            '</label>' +
                            '<label class="btn btn-default" ng-click="set(-1)">' +
                                '<i class="glyphicon glyphicon-minus"></i>' +
                            '</label>' +
                            '<label class="btn btn-default" ng-click="form.input = true">' +
                                '<div ng-show="convertable">' +
                                    '{{value}}' +
                                '</div>' +
                                '<div ng-hide="convertable">' +
                                    '{{value}} {{measure.caption}}' +
                                '</div>' +
                            '</label>' +
                            '<label class="btn btn-default" ng-click="set(1)">' +
                                '<i class="glyphicon glyphicon-plus"></i>' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                    '<div ng-show="form.input">' +
                        '<div class="input-group">' +
                            '<label ng-show="measure" class="input-group-addon">' +
                                '{{measure.caption}}' +
                            '</label>' +
                            '<input name="input" min="{{min}}" type="number" ng-model="form.value" class="form-control">' +
                            '<label ng-show="form.alert" class="input-group-addon">' +
                                '{{form.alertText}}' +
                            '</label>' +
                            '<label class="input-group-addon" ng-click="set(0,form.value)">' +
                                'OK' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>',
        link: function (scope, iElement, iAttrs, ngModelController) {
            
            var min, step, precision, newValue;
            if (!scope.convertable) {
                min = (scope.min !== undefined) ? scope.min : 0;
                step = (scope.step !== undefined) ? scope.step : 1;
            }
            precision = (scope.precision !== undefined) ? scope.precision : 3;
            
            scope.$watch('measure', function (measure, oldValue) {
                if (measure) {
                    min = measure.min;
                    step = measure.step;
                    if (scope.convertable)
                        scope.convertable = measure.converter;
                }
            }, true);
            
            ngModelController.$render = function () {
                scope.form = {
                    alert: false,
                    alertText : '',
                    value: scope.value
                };
            };
            
            scope.set = function (sign, value) {
                scope.form = {
                    alert: false,
                    alertText : '',
                    value: scope.value
                };
                newValue = scope.value;
                if (value !== undefined) {
                    newValue = Number((value).toFixed(precision));
                } else if (sign < 0) {
                    newValue = Number((scope.value - step).toFixed(precision));
                } else if (sign > 0) {
                    newValue = Number((scope.value + step).toFixed(precision));
                }
                if (newValue < min) {
                    newValue = min;
                    scope.form.alert = true;
                    scope.form.alertText = '>=' + min + '!';
                }
                else {
                    if (!scope.validatable) {
                        ngModelController.$setViewValue(newValue);//TODO look at apply model view tmth
                        scope.form = {
                            alert: false,
                            alertText : '',
                            input: false,
                            value: newValue
                        };
                    } else {
                            if( scope.validator(
                            {
                                id: scope.validationId,
                                value: newValue,
                                oldValue: scope.value
                            }
                        )) {
                            ngModelController.$setViewValue(newValue);//TODO look at apply model view tmth
                            scope.form = {
                                alert: false,
                                alertText : '',
                                input: false,
                                value: newValue
                            };
                        }
                    }
                }
            };
        }
    };
});
/* jshint ignore:start */

'use strict';


angular


    .module('recipes')


    // Angular File Upload module does not include this directive
    // Only for example


    /**
    * The ng-thumb directive
    * @author: nerv
    * @version: 0.1.2, 2014-01-09
    */
    .directive('ngThumb', ['$window', function($window) {
        var helper = {
            support: !!($window.FileReader && $window.CanvasRenderingContext2D),
            isFile: function(item) {
                return angular.isObject(item) && item instanceof $window.File;
            },
            isImage: function(file) {
                var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        return {
            restrict: 'A',
            template: '<canvas/>',
            link: function(scope, element, attributes) {
                if (!helper.support) return;

                var params = scope.$eval(attributes.ngThumb);

                if (!helper.isFile(params.file)) return;
                if (!helper.isImage(params.file)) return;

                var canvas = element.find('canvas');
                var reader = new FileReader();

                reader.onload = onLoadFile;
                reader.readAsDataURL(params.file);

                function onLoadFile(event) {
                    var img = new Image();
                    img.onload = onLoadImage;
                    img.src = event.target.result;
                }

                function onLoadImage() {
                    var width = params.width || this.width / this.height * params.height;
                    var height = params.height || this.height / this.width * params.width;
                    canvas.attr({ width: width, height: height });
                    canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
                }
            }
        };
    }]);
/* jshint ignore:end */

/*! angularjs-slider - v2.13.0 - 
 (c) Rafal Zajac <rzajac@gmail.com>, Valentin Hervieu <valentin@hervieu.me>, Jussi Saarivirta <jusasi@gmail.com>, Angelin Sirbu <angelin.sirbu@gmail.com> - 
 https://github.com/angular-slider/angularjs-slider - 
 2016-04-24 */
/*jslint unparam: true */
/*global angular: false, console: false, define, module */
(function(root, factory) {
  'use strict';
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['angular'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    // to support bundler like browserify
    module.exports = factory(require('angular'));
  } else {
    // Browser globals (root is window)
    factory(root.angular);
  }

}(this, function(angular) {
  'use strict';
  var module = angular.module('rzModule', [])

  .factory('RzSliderOptions', function() {
    var defaultOptions = {
      floor: 0,
      ceil: null, //defaults to rz-slider-model
      step: 1,
      precision: 0,
      minRange: 0,
      id: null,
      translate: null,
      getLegend: null,
      stepsArray: null,
      draggableRange: false,
      draggableRangeOnly: false,
      showSelectionBar: false,
      showSelectionBarEnd: false,
      showSelectionBarFromValue: null,
      hidePointerLabels: false,
      hideLimitLabels: false,
      readOnly: false,
      disabled: false,
      interval: 350,
      showTicks: false,
      showTicksValues: false,
      ticksTooltip: null,
      ticksValuesTooltip: null,
      vertical: false,
      getSelectionBarColor: null,
      getPointerColor: null,
      keyboardSupport: true,
      scale: 1,
      enforceStep: true,
      enforceRange: false,
      noSwitching: false,
      onlyBindHandles: false,
      onStart: null,
      onChange: null,
      onEnd: null,
      rightToLeft: false
    };
    var globalOptions = {};

    var factory = {};
    /**
     * `options({})` allows global configuration of all sliders in the
     * application.
     *
     *   var app = angular.module( 'App', ['rzModule'], function( RzSliderOptions ) {
     *     // show ticks for all sliders
     *     RzSliderOptions.options( { showTicks: true } );
     *   });
     */
    factory.options = function(value) {
      angular.extend(globalOptions, value);
    };

    factory.getOptions = function(options) {
      return angular.extend({}, defaultOptions, globalOptions, options);
    };

    return factory;
  })

  .factory('rzThrottle', ['$timeout', function($timeout) {
    /**
     * rzThrottle
     *
     * Taken from underscore project
     *
     * @param {Function} func
     * @param {number} wait
     * @param {ThrottleOptions} options
     * @returns {Function}
     */
    return function(func, wait, options) {
      //'use strict';
      /* istanbul ignore next */
      var getTime = (Date.now || function() {
        return new Date().getTime();
      });
      var context, args, result;
      var timeout = null;
      var previous = 0;
      options = options || {};
      var later = function() {
        previous = getTime();
        timeout = null;
        result = func.apply(context, args);
        context = args = null;
      };
      return function() {
        var now = getTime();
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          $timeout.cancel(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = $timeout(later, remaining);
        }
        return result;
      };
    };
  }])

  .factory('RzSlider', ['$timeout', '$document', '$window', '$compile', 'RzSliderOptions', 'rzThrottle', function($timeout, $document, $window, $compile, RzSliderOptions, rzThrottle) {
    //'use strict';

    /**
     * Slider
     *
     * @param {ngScope} scope            The AngularJS scope
     * @param {Element} sliderElem The slider directive element wrapped in jqLite
     * @constructor
     */
    var Slider = function(scope, sliderElem) {
      /**
       * The slider's scope
       *
       * @type {ngScope}
       */
      this.scope = scope;

      /**
       * Slider element wrapped in jqLite
       *
       * @type {jqLite}
       */
      this.sliderElem = sliderElem;

      /**
       * Slider type
       *
       * @type {boolean} Set to true for range slider
       */
      this.range = this.scope.rzSliderModel !== undefined && this.scope.rzSliderHigh !== undefined;

      /**
       * Values recorded when first dragging the bar
       *
       * @type {Object}
       */
      this.dragging = {
        active: false,
        value: 0,
        difference: 0,
        offset: 0,
        lowLimit: 0,
        highLimit: 0
      };

      /**
       * property that handle position (defaults to left for horizontal)
       * @type {string}
       */
      this.positionProperty = 'left';

      /**
       * property that handle dimension (defaults to width for horizontal)
       * @type {string}
       */
      this.dimensionProperty = 'width';

      /**
       * Half of the width or height of the slider handles
       *
       * @type {number}
       */
      this.handleHalfDim = 0;

      /**
       * Maximum position the slider handle can have
       *
       * @type {number}
       */
      this.maxPos = 0;

      /**
       * Precision
       *
       * @type {number}
       */
      this.precision = 0;

      /**
       * Step
       *
       * @type {number}
       */
      this.step = 1;

      /**
       * The name of the handle we are currently tracking
       *
       * @type {string}
       */
      this.tracking = '';

      /**
       * Minimum value (floor) of the model
       *
       * @type {number}
       */
      this.minValue = 0;

      /**
       * Maximum value (ceiling) of the model
       *
       * @type {number}
       */
      this.maxValue = 0;


      /**
       * The delta between min and max value
       *
       * @type {number}
       */
      this.valueRange = 0;


      /**
       * If showTicks/showTicksValues options are number.
       * In this case, ticks values should be displayed below the slider.
       * @type {boolean}
       */
      this.intermediateTicks = false;

      /**
       * Set to true if init method already executed
       *
       * @type {boolean}
       */
      this.initHasRun = false;

      /**
       * Internal flag to prevent watchers to be called when the sliders value are modified internally.
       * @type {boolean}
       */
      this.internalChange = false;

      // Slider DOM elements wrapped in jqLite
      this.fullBar = null; // The whole slider bar
      this.selBar = null; // Highlight between two handles
      this.minH = null; // Left slider handle
      this.maxH = null; // Right slider handle
      this.flrLab = null; // Floor label
      this.ceilLab = null; // Ceiling label
      this.minLab = null; // Label above the low value
      this.maxLab = null; // Label above the high value
      this.cmbLab = null; // Combined label
      this.ticks = null; // The ticks

      // Initialize slider
      this.init();
    };

    // Add instance methods
    Slider.prototype = {

      /**
       * Initialize slider
       *
       * @returns {undefined}
       */
      init: function() {
        var thrLow, thrHigh,
          self = this;

        var calcDimFn = function() {
          self.calcViewDimensions();
        };

        this.applyOptions();
        this.initElemHandles();
        this.manageElementsStyle();
        this.setDisabledState();
        this.calcViewDimensions();
        this.setMinAndMax();
        this.addAccessibility();
        this.updateCeilLab();
        this.updateFloorLab();
        this.initHandles();
        this.manageEventsBindings();

        // Recalculate slider view dimensions
        this.scope.$on('reCalcViewDimensions', calcDimFn);

        // Recalculate stuff if view port dimensions have changed
        angular.element($window).on('resize', calcDimFn);

        this.initHasRun = true;

        // Watch for changes to the model
        thrLow = rzThrottle(function() {
          self.onLowHandleChange();
        }, self.options.interval);

        thrHigh = rzThrottle(function() {
          self.onHighHandleChange();
        }, self.options.interval);

        this.scope.$on('rzSliderForceRender', function() {
          self.resetLabelsValue();
          thrLow();
          if (self.range) {
            thrHigh();
          }
          self.resetSlider();
        });

        // Watchers (order is important because in case of simultaneous change,
        // watchers will be called in the same order)
        this.scope.$watch('rzSliderOptions()', function(newValue, oldValue) {
          if (newValue === oldValue)
            return;
          self.applyOptions();
          self.resetSlider();
        }, true);

        this.scope.$watch('rzSliderModel', function(newValue, oldValue) {
          if (self.internalChange)
            return;
          if (newValue === oldValue)
            return;
          thrLow();
        });

        this.scope.$watch('rzSliderHigh', function(newValue, oldValue) {
          if (self.internalChange)
            return;
          if (newValue === oldValue)
            return;
          if (newValue !== null)
            thrHigh();
          if (self.range && newValue === null || !self.range && newValue !== null) {
            self.applyOptions();
            self.resetSlider();
          }
        });

        this.scope.$on('$destroy', function() {
          self.unbindEvents();
          angular.element($window).off('resize', calcDimFn);
        });
      },

      /*
       * Reflow the slider when the low handle changes (called with throttle)
       */
      onLowHandleChange: function() {
        this.setMinAndMax();
        this.updateLowHandle(this.valueToOffset(this.scope.rzSliderModel));
        this.updateSelectionBar();
        this.updateTicksScale();
        this.updateAriaAttributes();
        if (this.range) {
          this.updateCmbLabel();
        }
      },

      /*
       * Reflow the slider when the high handle changes (called with throttle)
       */
      onHighHandleChange: function() {
        this.setMinAndMax();
        this.updateHighHandle(this.valueToOffset(this.scope.rzSliderHigh));
        this.updateSelectionBar();
        this.updateTicksScale();
        this.updateCmbLabel();
        this.updateAriaAttributes();
      },

      /**
       * Read the user options and apply them to the slider model
       */
      applyOptions: function() {
        var sliderOptions;
        if (this.scope.rzSliderOptions)
          sliderOptions = this.scope.rzSliderOptions();
        else
          sliderOptions = {};

        this.options = RzSliderOptions.getOptions(sliderOptions);

        if (this.options.step <= 0)
          this.options.step = 1;

        this.range = this.scope.rzSliderModel !== undefined && this.scope.rzSliderHigh !== undefined;
        this.options.draggableRange = this.range && this.options.draggableRange;
        this.options.draggableRangeOnly = this.range && this.options.draggableRangeOnly;
        if (this.options.draggableRangeOnly) {
          this.options.draggableRange = true;
        }

        this.options.showTicks = this.options.showTicks || this.options.showTicksValues;
        this.scope.showTicks = this.options.showTicks; //scope is used in the template
        if (angular.isNumber(this.options.showTicks))
          this.intermediateTicks = true;

        this.options.showSelectionBar = this.options.showSelectionBar || this.options.showSelectionBarEnd || this.options.showSelectionBarFromValue !== null;

        if (this.options.stepsArray) {
          this.parseStepsArray();
        } else {
          if (this.options.translate)
            this.customTrFn = this.options.translate;
          else
            this.customTrFn = function(value) {
              return String(value);
            };

          if (this.options.getLegend) {
            this.getLegend = this.options.getLegend;
          }
        }

        if (this.options.vertical) {
          this.positionProperty = 'bottom';
          this.dimensionProperty = 'height';
        }
      },

      parseStepsArray: function() {
        this.options.floor = 0;
        this.options.ceil = this.options.stepsArray.length - 1;
        this.options.step = 1;

        if (this.options.translate) {
          this.customTrFn = this.options.translate;
        }
        else {
          this.customTrFn = function(index) {
            var step = this.options.stepsArray[index];
            if (angular.isObject(step))
              return step.value;
            return step;
          };
        }

        this.getLegend = function(index) {
          var step = this.options.stepsArray[index];
          if (angular.isObject(step))
            return step.legend;
          return null;
        };
      },

      /**
       * Resets slider
       *
       * @returns {undefined}
       */
      resetSlider: function() {
        this.manageElementsStyle();
        this.addAccessibility();
        this.setMinAndMax();
        this.updateCeilLab();
        this.updateFloorLab();
        this.unbindEvents();
        this.manageEventsBindings();
        this.setDisabledState();
        this.calcViewDimensions();
      },

      /**
       * Set the slider children to variables for easy access
       *
       * Run only once during initialization
       *
       * @returns {undefined}
       */
      initElemHandles: function() {
        // Assign all slider elements to object properties for easy access
        angular.forEach(this.sliderElem.children(), function(elem, index) {
          var jElem = angular.element(elem);

          switch (index) {
            case 0:
              this.fullBar = jElem;
              break;
            case 1:
              this.selBar = jElem;
              break;
            case 2:
              this.minH = jElem;
              break;
            case 3:
              this.maxH = jElem;
              break;
            case 4:
              this.flrLab = jElem;
              break;
            case 5:
              this.ceilLab = jElem;
              break;
            case 6:
              this.minLab = jElem;
              break;
            case 7:
              this.maxLab = jElem;
              break;
            case 8:
              this.cmbLab = jElem;
              break;
            case 9:
              this.ticks = jElem;
              break;
          }

        }, this);

        // Initialize offset cache properties
        this.selBar.rzsp = 0;
        this.minH.rzsp = 0;
        this.maxH.rzsp = 0;
        this.flrLab.rzsp = 0;
        this.ceilLab.rzsp = 0;
        this.minLab.rzsp = 0;
        this.maxLab.rzsp = 0;
        this.cmbLab.rzsp = 0;
      },

      /**
       * Update each elements style based on options
       */
      manageElementsStyle: function() {

        if (!this.range)
          this.maxH.css('display', 'none');
        else
          this.maxH.css('display', '');


        this.alwaysHide(this.flrLab, this.options.showTicksValues || this.options.hideLimitLabels);
        this.alwaysHide(this.ceilLab, this.options.showTicksValues || this.options.hideLimitLabels);

        var hideLabelsForTicks = this.options.showTicksValues && !this.intermediateTicks;
        this.alwaysHide(this.minLab, hideLabelsForTicks || this.options.hidePointerLabels);
        this.alwaysHide(this.maxLab, hideLabelsForTicks || !this.range || this.options.hidePointerLabels);
        this.alwaysHide(this.cmbLab, hideLabelsForTicks || !this.range || this.options.hidePointerLabels);
        this.alwaysHide(this.selBar, !this.range && !this.options.showSelectionBar);

        if (this.options.vertical)
          this.sliderElem.addClass('rz-vertical');

        if (this.options.draggableRange)
          this.selBar.addClass('rz-draggable');
        else
          this.selBar.removeClass('rz-draggable');

        if (this.intermediateTicks && this.options.showTicksValues)
          this.ticks.addClass('rz-ticks-values-under');
      },

      alwaysHide: function(el, hide) {
        el.rzAlwaysHide = hide;
        if (hide)
          this.hideEl(el);
        else
          this.showEl(el);
      },

      /**
       * Manage the events bindings based on readOnly and disabled options
       *
       * @returns {undefined}
       */
      manageEventsBindings: function() {
        if (this.options.disabled || this.options.readOnly)
          this.unbindEvents();
        else
          this.bindEvents();
      },

      /**
       * Set the disabled state based on rzSliderDisabled
       *
       * @returns {undefined}
       */
      setDisabledState: function() {
        if (this.options.disabled) {
          this.sliderElem.attr('disabled', 'disabled');
        } else {
          this.sliderElem.attr('disabled', null);
        }
      },

      /**
       * Reset label values
       *
       * @return {undefined}
       */
      resetLabelsValue: function() {
        this.minLab.rzsv = undefined;
        this.maxLab.rzsv = undefined;
      },

      /**
       * Initialize slider handles positions and labels
       *
       * Run only once during initialization and every time view port changes size
       *
       * @returns {undefined}
       */
      initHandles: function() {
        this.updateLowHandle(this.valueToOffset(this.scope.rzSliderModel));

        /*
         the order here is important since the selection bar should be
         updated after the high handle but before the combined label
         */
        if (this.range)
          this.updateHighHandle(this.valueToOffset(this.scope.rzSliderHigh));
        this.updateSelectionBar();
        if (this.range)
          this.updateCmbLabel();

        this.updateTicksScale();
      },

      /**
       * Translate value to human readable format
       *
       * @param {number|string} value
       * @param {jqLite} label
       * @param {boolean} [useCustomTr]
       * @returns {undefined}
       */
      translateFn: function(value, label, which, useCustomTr) {
        useCustomTr = useCustomTr === undefined ? true : useCustomTr;

        var valStr = String((useCustomTr ? this.customTrFn(value, this.options.id, which) : value)),
          getDimension = false;

        if (label.rzsv === undefined || label.rzsv.length !== valStr.length || (label.rzsv.length > 0 && label.rzsd === 0)) {
          getDimension = true;
          label.rzsv = valStr;
        }

        label.html(valStr);

        // Update width only when length of the label have changed
        if (getDimension) {
          this.getDimension(label);
        }
      },

      /**
       * Set maximum and minimum values for the slider and ensure the model and high
       * value match these limits
       * @returns {undefined}
       */
      setMinAndMax: function() {

        this.step = +this.options.step;
        this.precision = +this.options.precision;

        this.minValue = this.options.floor;

        if (this.options.enforceStep) {
          this.scope.rzSliderModel = this.roundStep(this.scope.rzSliderModel);
          if (this.range)
            this.scope.rzSliderHigh = this.roundStep(this.scope.rzSliderHigh);
        }

        if (this.options.ceil !== null)
          this.maxValue = this.options.ceil;
        else
          this.maxValue = this.options.ceil = this.range ? this.scope.rzSliderHigh : this.scope.rzSliderModel;

        if (this.options.enforceRange) {
          this.scope.rzSliderModel = this.sanitizeValue(this.scope.rzSliderModel);
          if (this.range)
            this.scope.rzSliderHigh = this.sanitizeValue(this.scope.rzSliderHigh);
        }

        this.valueRange = this.maxValue - this.minValue;
      },

      /**
       * Adds accessibility attributes
       *
       * Run only once during initialization
       *
       * @returns {undefined}
       */
      addAccessibility: function() {
        this.minH.attr('role', 'slider');
        this.updateAriaAttributes();
        if (this.options.keyboardSupport && !(this.options.readOnly || this.options.disabled))
          this.minH.attr('tabindex', '0');
        else
          this.minH.attr('tabindex', '');
        if (this.options.vertical)
          this.minH.attr('aria-orientation', 'vertical');

        if (this.range) {
          this.maxH.attr('role', 'slider');
          if (this.options.keyboardSupport && !(this.options.readOnly || this.options.disabled))
            this.maxH.attr('tabindex', '0');
          else
            this.maxH.attr('tabindex', '');
          if (this.options.vertical)
            this.maxH.attr('aria-orientation', 'vertical');
        }
      },

      /**
       * Updates aria attributes according to current values
       */
      updateAriaAttributes: function() {
        this.minH.attr({
          'aria-valuenow': this.scope.rzSliderModel,
          'aria-valuetext': this.customTrFn(this.scope.rzSliderModel, this.options.id, 'model'),
          'aria-valuemin': this.minValue,
          'aria-valuemax': this.maxValue
        });
        if (this.range) {
          this.maxH.attr({
            'aria-valuenow': this.scope.rzSliderHigh,
            'aria-valuetext': this.customTrFn(this.scope.rzSliderHigh, this.options.id, 'high'),
            'aria-valuemin': this.minValue,
            'aria-valuemax': this.maxValue
          });
        }
      },

      /**
       * Calculate dimensions that are dependent on view port size
       *
       * Run once during initialization and every time view port changes size.
       *
       * @returns {undefined}
       */
      calcViewDimensions: function() {
        var handleWidth = this.getDimension(this.minH);

        this.handleHalfDim = handleWidth / 2;
        this.barDimension = this.getDimension(this.fullBar);

        this.maxPos = this.barDimension - handleWidth;

        this.getDimension(this.sliderElem);
        this.sliderElem.rzsp = this.sliderElem[0].getBoundingClientRect()[this.positionProperty];

        if (this.initHasRun) {
          this.updateFloorLab();
          this.updateCeilLab();
          this.initHandles();
        }
      },

      /**
       * Update the ticks position
       *
       * @returns {undefined}
       */
      updateTicksScale: function() {
        if (!this.options.showTicks) return;
        var step = this.step;
        if (this.intermediateTicks)
          step = this.options.showTicks;
        var ticksCount = Math.round((this.maxValue - this.minValue) / step) + 1;
        this.scope.ticks = [];
        for (var i = 0; i < ticksCount; i++) {
          var value = this.roundStep(this.minValue + i * step);
          var tick = {
            selected: this.isTickSelected(value)
          };
          if (tick.selected && this.options.getSelectionBarColor) {
            tick.style = {
              'background-color': this.getSelectionBarColor()
            };
          }
          if (this.options.ticksTooltip) {
            tick.tooltip = this.options.ticksTooltip(value);
            tick.tooltipPlacement = this.options.vertical ? 'right' : 'top';
          }
          if (this.options.showTicksValues) {
            tick.value = this.getDisplayValue(value, 'tick-value');
            if (this.options.ticksValuesTooltip) {
              tick.valueTooltip = this.options.ticksValuesTooltip(value);
              tick.valueTooltipPlacement = this.options.vertical ? 'right' : 'top';
            }
          }
          if (this.getLegend) {
            var legend = this.getLegend(value, this.options.id);
            if (legend)
              tick.legend = legend;
          }
          if (!this.options.rightToLeft) {
            this.scope.ticks.push(tick);
          } else {
            this.scope.ticks.unshift(tick);
          }
        }
      },

      isTickSelected: function(value) {
        if (!this.range) {
          if (this.options.showSelectionBarFromValue !== null) {
            var center = this.options.showSelectionBarFromValue;
            if (this.scope.rzSliderModel > center && value >= center && value <= this.scope.rzSliderModel)
              return true;
            else if (this.scope.rzSliderModel < center && value <= center && value >= this.scope.rzSliderModel)
              return true;
          }
          else if (this.options.showSelectionBarEnd) {
            if (value >= this.scope.rzSliderModel)
              return true;
          }
          else if (this.options.showSelectionBar && value <= this.scope.rzSliderModel)
            return true;
        }
        if (this.range && value >= this.scope.rzSliderModel && value <= this.scope.rzSliderHigh)
          return true;
        return false;
      },

      /**
       * Update position of the floor label
       *
       * @returns {undefined}
       */
      updateFloorLab: function() {
        this.translateFn(this.minValue, this.flrLab, 'floor');
        this.getDimension(this.flrLab);
        var position = this.options.rightToLeft ? this.barDimension - this.flrLab.rzsd : 0;
        this.setPosition(this.flrLab, position);
      },

      /**
       * Update position of the ceiling label
       *
       * @returns {undefined}
       */
      updateCeilLab: function() {
        this.translateFn(this.maxValue, this.ceilLab, 'ceil');
        this.getDimension(this.ceilLab);
        var position = this.options.rightToLeft ? 0 : this.barDimension - this.ceilLab.rzsd;
        this.setPosition(this.ceilLab, position);
      },

      /**
       * Update slider handles and label positions
       *
       * @param {string} which
       * @param {number} newOffset
       */
      updateHandles: function(which, newOffset) {
        if (which === 'rzSliderModel')
          this.updateLowHandle(newOffset);
        else
          this.updateHighHandle(newOffset);

        this.updateSelectionBar();
        this.updateTicksScale();
        if (this.range)
          this.updateCmbLabel();
      },

      /**
       * Helper function to work out the position for handle labels depending on RTL or not
       *
       * @param {string} labelName maxLab or minLab
       * @param newOffset
       *
       * @returns {number}
       */
      getHandleLabelPos: function(labelName, newOffset) {
        var labelRzsd = this[labelName].rzsd,
          nearHandlePos = newOffset - labelRzsd / 2 + this.handleHalfDim,
          endOfBarPos = this.barDimension - labelRzsd;

        if (this.options.rightToLeft && labelName === 'minLab' || !this.options.rightToLeft && labelName === 'maxLab') {
          return Math.min(nearHandlePos, endOfBarPos);
        } else {
          return Math.min(Math.max(nearHandlePos, 0), endOfBarPos);
        }
      },

      /**
       * Update low slider handle position and label
       *
       * @param {number} newOffset
       * @returns {undefined}
       */
      updateLowHandle: function(newOffset) {
        this.setPosition(this.minH, newOffset);
        this.translateFn(this.scope.rzSliderModel, this.minLab, 'model');
        this.setPosition(this.minLab, this.getHandleLabelPos('minLab', newOffset));

        if (this.options.getPointerColor) {
          var pointercolor = this.getPointerColor('min');
          this.scope.minPointerStyle = {
            backgroundColor: pointercolor
          };
        }

        this.shFloorCeil();
      },

      /**
       * Update high slider handle position and label
       *
       * @param {number} newOffset
       * @returns {undefined}
       */
      updateHighHandle: function(newOffset) {
        this.setPosition(this.maxH, newOffset);
        this.translateFn(this.scope.rzSliderHigh, this.maxLab, 'high');
        this.setPosition(this.maxLab, this.getHandleLabelPos('maxLab', newOffset));

        if (this.options.getPointerColor) {
          var pointercolor = this.getPointerColor('max');
          this.scope.maxPointerStyle = {
            backgroundColor: pointercolor
          };
        }

        this.shFloorCeil();
      },

      /**
       * Show/hide floor/ceiling label
       *
       * @returns {undefined}
       */
      shFloorCeil: function() {
        var flHidden = false,
          clHidden = false,
          isRTL = this.options.rightToLeft,
          flrLabPos = this.flrLab.rzsp,
          flrLabDim = this.flrLab.rzsd,
          minLabPos = this.minLab.rzsp,
          minLabDim = this.minLab.rzsd,
          maxLabPos = this.maxLab.rzsp,
          maxLabDim = this.maxLab.rzsd,
          ceilLabPos = this.ceilLab.rzsp,
          halfHandle = this.handleHalfDim,
          isMinLabAtFloor = isRTL ? minLabPos + minLabDim >= flrLabPos - flrLabDim - 5 : minLabPos <= flrLabPos + flrLabDim + 5,
          isMinLabAtCeil = isRTL ? minLabPos - minLabDim <= ceilLabPos + halfHandle + 10 : minLabPos + minLabDim >= ceilLabPos - halfHandle - 10,
          isMaxLabAtFloor = isRTL ? maxLabPos >= flrLabPos - flrLabDim - halfHandle : maxLabPos <= flrLabPos + flrLabDim + halfHandle,
          isMaxLabAtCeil = isRTL ? maxLabPos - maxLabDim <= ceilLabPos + 10 : maxLabPos + maxLabDim >= ceilLabPos - 10;


        if (isMinLabAtFloor) {
          flHidden = true;
          this.hideEl(this.flrLab);
        } else {
          flHidden = false;
          this.showEl(this.flrLab);
        }

        if (isMinLabAtCeil) {
          clHidden = true;
          this.hideEl(this.ceilLab);
        } else {
          clHidden = false;
          this.showEl(this.ceilLab);
        }

        if (this.range) {
          if (isMaxLabAtCeil) {
            this.hideEl(this.ceilLab);
          } else if (!clHidden) {
            this.showEl(this.ceilLab);
          }

          // Hide or show floor label
          if (isMaxLabAtFloor) {
            this.hideEl(this.flrLab);
          } else if (!flHidden) {
            this.showEl(this.flrLab);
          }
        }
      },

      /**
       * Update slider selection bar, combined label and range label
       *
       * @returns {undefined}
       */
      updateSelectionBar: function() {
        var position = 0,
          dimension = 0,
          isSelectionBarFromRight = this.options.rightToLeft ? !this.options.showSelectionBarEnd : this.options.showSelectionBarEnd,
          positionForRange = this.options.rightToLeft ? this.maxH.rzsp + this.handleHalfDim : this.minH.rzsp + this.handleHalfDim;

        if (this.range) {
          dimension = Math.abs(this.maxH.rzsp - this.minH.rzsp);
          position = positionForRange;
        }
        else {
          if (this.options.showSelectionBarFromValue !== null) {
            var center = this.options.showSelectionBarFromValue,
              centerPosition = this.valueToOffset(center),
              isModelGreaterThanCenter = this.options.rightToLeft ? this.scope.rzSliderModel <= center : this.scope.rzSliderModel > center;
            if (isModelGreaterThanCenter) {
              dimension = this.minH.rzsp - centerPosition;
              position = centerPosition + this.handleHalfDim;
            }
            else {
              dimension = centerPosition - this.minH.rzsp;
              position = this.minH.rzsp + this.handleHalfDim;
            }
          }
          else if (isSelectionBarFromRight) {
            dimension = Math.abs(this.maxPos - this.minH.rzsp) + this.handleHalfDim;
            position = this.minH.rzsp + this.handleHalfDim;
          } else {
            dimension = Math.abs(this.maxH.rzsp - this.minH.rzsp) + this.handleHalfDim;
            position = 0;
          }
        }
        this.setDimension(this.selBar, dimension);
        this.setPosition(this.selBar, position);
        if (this.options.getSelectionBarColor) {
          var color = this.getSelectionBarColor();
          this.scope.barStyle = {
            backgroundColor: color
          };
        }
      },

      /**
       * Wrapper around the getSelectionBarColor of the user to pass to
       * correct parameters
       */
      getSelectionBarColor: function() {
        if (this.range)
          return this.options.getSelectionBarColor(this.scope.rzSliderModel, this.scope.rzSliderHigh);
        return this.options.getSelectionBarColor(this.scope.rzSliderModel);
      },

      /**
       * Wrapper around the getPointerColor of the user to pass to
       * correct parameters
       */
      getPointerColor: function(pointerType) {
        if (pointerType === 'max') {
          return this.options.getPointerColor(this.scope.rzSliderHigh, pointerType);
        }
        return this.options.getPointerColor(this.scope.rzSliderModel, pointerType);
      },

      /**
       * Update combined label position and value
       *
       * @returns {undefined}
       */
      updateCmbLabel: function() {
        var isLabelOverlap = null;
        if (this.options.rightToLeft) {
          isLabelOverlap = this.minLab.rzsp - this.minLab.rzsd - 10 <= this.maxLab.rzsp;
        } else {
          isLabelOverlap = this.minLab.rzsp + this.minLab.rzsd + 10 >= this.maxLab.rzsp;
        }

        if (isLabelOverlap) {
          var lowTr = this.getDisplayValue(this.scope.rzSliderModel, 'model'),
            highTr = this.getDisplayValue(this.scope.rzSliderHigh, 'high'),
            labelVal = '';
          if (lowTr === highTr) {
            labelVal = lowTr;
          } else {
            labelVal = this.options.rightToLeft ? highTr + ' - ' + lowTr : lowTr + ' - ' + highTr;
          }

          this.translateFn(labelVal, this.cmbLab, 'cmb', false);
          var pos = Math.min(
            Math.max(
              this.selBar.rzsp + this.selBar.rzsd / 2 - this.cmbLab.rzsd / 2,
              0
            ),
            this.barDimension - this.cmbLab.rzsd
          );
          this.setPosition(this.cmbLab, pos);
          this.hideEl(this.minLab);
          this.hideEl(this.maxLab);
          this.showEl(this.cmbLab);
        } else {
          this.showEl(this.maxLab);
          this.showEl(this.minLab);
          this.hideEl(this.cmbLab);
        }
      },

      /**
       * Return the translated value if a translate function is provided else the original value
       * @param value
       * @param which if it's min or max handle
       * @returns {*}
       */
      getDisplayValue: function(value, which) {
        return this.customTrFn(value, this.options.id, which);
      },

      /**
       * Round value to step and precision based on minValue
       *
       * @param {number} value
       * @param {number} customStep a custom step to override the defined step
       * @returns {number}
       */
      roundStep: function(value, customStep) {
        var step = customStep ? customStep : this.step,
          steppedDifference = parseFloat((value - this.minValue) / step).toPrecision(12);
        steppedDifference = Math.round(+steppedDifference) * step;
        var newValue = (this.minValue + steppedDifference).toFixed(this.precision);
        return +newValue;
      },

      /**
       * Hide element
       *
       * @param element
       * @returns {jqLite} The jqLite wrapped DOM element
       */
      hideEl: function(element) {
        return element.css({
          opacity: 0
        });
      },

      /**
       * Show element
       *
       * @param element The jqLite wrapped DOM element
       * @returns {jqLite} The jqLite
       */
      showEl: function(element) {
        if (!!element.rzAlwaysHide) {
          return element;
        }

        return element.css({
          opacity: 1
        });
      },

      /**
       * Set element left/top offset depending on whether slider is horizontal or vertical
       *
       * @param {jqLite} elem The jqLite wrapped DOM element
       * @param {number} pos
       * @returns {number}
       */
      setPosition: function(elem, pos) {
        elem.rzsp = pos;
        var css = {};
        css[this.positionProperty] = pos + 'px';
        elem.css(css);
        return pos;
      },

      /**
       * Get element width/height depending on whether slider is horizontal or vertical
       *
       * @param {jqLite} elem The jqLite wrapped DOM element
       * @returns {number}
       */
      getDimension: function(elem) {
        var val = elem[0].getBoundingClientRect();
        if (this.options.vertical)
          elem.rzsd = (val.bottom - val.top) * this.options.scale;
        else
          elem.rzsd = (val.right - val.left) * this.options.scale;
        return elem.rzsd;
      },

      /**
       * Set element width/height depending on whether slider is horizontal or vertical
       *
       * @param {jqLite} elem  The jqLite wrapped DOM element
       * @param {number} dim
       * @returns {number}
       */
      setDimension: function(elem, dim) {
        elem.rzsd = dim;
        var css = {};
        css[this.dimensionProperty] = dim + 'px';
        elem.css(css);
        return dim;
      },

      /**
       * Translate value to pixel offset
       *
       * @param {number} val
       * @returns {number}
       */
      valueToOffset: function(val) {
        if (this.options.rightToLeft) {
          return (this.maxValue - this.sanitizeValue(val)) * this.maxPos / this.valueRange || 0;
        }
        return (this.sanitizeValue(val) - this.minValue) * this.maxPos / this.valueRange || 0;
      },

      /**
       * Returns a value that is within slider range
       *
       * @param {number} val
       * @returns {number}
       */
      sanitizeValue: function(val) {
        return Math.min(Math.max(val, this.minValue), this.maxValue);
      },

      /**
       * Translate offset to model value
       *
       * @param {number} offset
       * @returns {number}
       */
      offsetToValue: function(offset) {
        if (this.options.rightToLeft) {
          return (1 - (offset / this.maxPos)) * this.valueRange + this.minValue;
        }
        return (offset / this.maxPos) * this.valueRange + this.minValue;
      },

      // Events

      /**
       * Get the X-coordinate or Y-coordinate of an event
       *
       * @param {Object} event  The event
       * @returns {number}
       */
      getEventXY: function(event) {
        /* http://stackoverflow.com/a/12336075/282882 */
        //noinspection JSLint
        var clientXY = this.options.vertical ? 'clientY' : 'clientX';
        if (clientXY in event) {
          return event[clientXY];
        }

        return event.originalEvent === undefined ?
          event.touches[0][clientXY] : event.originalEvent.touches[0][clientXY];
      },

      /**
       * Compute the event position depending on whether the slider is horizontal or vertical
       * @param event
       * @returns {number}
       */
      getEventPosition: function(event) {
        var sliderPos = this.sliderElem.rzsp,
          eventPos = 0;
        if (this.options.vertical)
          eventPos = -this.getEventXY(event) + sliderPos;
        else
          eventPos = this.getEventXY(event) - sliderPos;
        return (eventPos - this.handleHalfDim) * this.options.scale;
      },

      /**
       * Get event names for move and event end
       *
       * @param {Event}    event    The event
       *
       * @return {{moveEvent: string, endEvent: string}}
       */
      getEventNames: function(event) {
        var eventNames = {
          moveEvent: '',
          endEvent: ''
        };

        if (event.touches || (event.originalEvent !== undefined && event.originalEvent.touches)) {
          eventNames.moveEvent = 'touchmove';
          eventNames.endEvent = 'touchend';
        } else {
          eventNames.moveEvent = 'mousemove';
          eventNames.endEvent = 'mouseup';
        }

        return eventNames;
      },

      /**
       * Get the handle closest to an event.
       *
       * @param event {Event} The event
       * @returns {jqLite} The handle closest to the event.
       */
      getNearestHandle: function(event) {
        if (!this.range) {
          return this.minH;
        }
        var offset = this.getEventPosition(event),
          distanceMin = Math.abs(offset - this.minH.rzsp),
          distanceMax = Math.abs(offset - this.maxH.rzsp);
        if (distanceMin < distanceMax)
          return this.minH;
        else if (distanceMin > distanceMax)
          return this.maxH;
        else if (!this.options.rightToLeft)
        //if event is at the same distance from min/max then if it's at left of minH, we return minH else maxH
          return offset < this.minH.rzsp ? this.minH : this.maxH;
        else
        //reverse in rtl
          return offset > this.minH.rzsp ? this.minH : this.maxH;
      },

      /**
       * Wrapper function to focus an angular element
       *
       * @param el {AngularElement} the element to focus
       */
      focusElement: function(el) {
        var DOM_ELEMENT = 0;
        el[DOM_ELEMENT].focus();
      },

      /**
       * Bind mouse and touch events to slider handles
       *
       * @returns {undefined}
       */
      bindEvents: function() {
        var barTracking, barStart, barMove;

        if (this.options.draggableRange) {
          barTracking = 'rzSliderDrag';
          barStart = this.onDragStart;
          barMove = this.onDragMove;
        } else {
          barTracking = 'rzSliderModel';
          barStart = this.onStart;
          barMove = this.onMove;
        }

        if (!this.options.onlyBindHandles) {
          this.selBar.on('mousedown', angular.bind(this, barStart, null, barTracking));
          this.selBar.on('mousedown', angular.bind(this, barMove, this.selBar));
        }

        if (this.options.draggableRangeOnly) {
          this.minH.on('mousedown', angular.bind(this, barStart, null, barTracking));
          this.maxH.on('mousedown', angular.bind(this, barStart, null, barTracking));
        } else {
          this.minH.on('mousedown', angular.bind(this, this.onStart, this.minH, 'rzSliderModel'));
          if (this.range) {
            this.maxH.on('mousedown', angular.bind(this, this.onStart, this.maxH, 'rzSliderHigh'));
          }
          if (!this.options.onlyBindHandles) {
            this.fullBar.on('mousedown', angular.bind(this, this.onStart, null, null));
            this.fullBar.on('mousedown', angular.bind(this, this.onMove, this.fullBar));
            this.ticks.on('mousedown', angular.bind(this, this.onStart, null, null));
            this.ticks.on('mousedown', angular.bind(this, this.onTickClick, this.ticks));
          }
        }

        if (!this.options.onlyBindHandles) {
          this.selBar.on('touchstart', angular.bind(this, barStart, null, barTracking));
          this.selBar.on('touchstart', angular.bind(this, barMove, this.selBar));
        }
        if (this.options.draggableRangeOnly) {
          this.minH.on('touchstart', angular.bind(this, barStart, null, barTracking));
          this.maxH.on('touchstart', angular.bind(this, barStart, null, barTracking));
        } else {
          this.minH.on('touchstart', angular.bind(this, this.onStart, this.minH, 'rzSliderModel'));
          if (this.range) {
            this.maxH.on('touchstart', angular.bind(this, this.onStart, this.maxH, 'rzSliderHigh'));
          }
          if (!this.options.onlyBindHandles) {
            this.fullBar.on('touchstart', angular.bind(this, this.onStart, null, null));
            this.fullBar.on('touchstart', angular.bind(this, this.onMove, this.fullBar));
            this.ticks.on('touchstart', angular.bind(this, this.onStart, null, null));
            this.ticks.on('touchstart', angular.bind(this, this.onTickClick, this.ticks));
          }
        }

        if (this.options.keyboardSupport) {
          this.minH.on('focus', angular.bind(this, this.onPointerFocus, this.minH, 'rzSliderModel'));
          if (this.range) {
            this.maxH.on('focus', angular.bind(this, this.onPointerFocus, this.maxH, 'rzSliderHigh'));
          }
        }
      },

      /**
       * Unbind mouse and touch events to slider handles
       *
       * @returns {undefined}
       */
      unbindEvents: function() {
        this.minH.off();
        this.maxH.off();
        this.fullBar.off();
        this.selBar.off();
        this.ticks.off();
      },

      /**
       * onStart event handler
       *
       * @param {?Object} pointer The jqLite wrapped DOM element; if null, the closest handle is used
       * @param {?string} ref     The name of the handle being changed; if null, the closest handle's value is modified
       * @param {Event}   event   The event
       * @returns {undefined}
       */
      onStart: function(pointer, ref, event) {
        var ehMove, ehEnd,
          eventNames = this.getEventNames(event);

        event.stopPropagation();
        event.preventDefault();

        // We have to do this in case the HTML where the sliders are on
        // have been animated into view.
        this.calcViewDimensions();

        if (pointer) {
          this.tracking = ref;
        } else {
          pointer = this.getNearestHandle(event);
          this.tracking = pointer === this.minH ? 'rzSliderModel' : 'rzSliderHigh';
        }

        pointer.addClass('rz-active');

        if (this.options.keyboardSupport)
          this.focusElement(pointer);

        ehMove = angular.bind(this, this.dragging.active ? this.onDragMove : this.onMove, pointer);
        ehEnd = angular.bind(this, this.onEnd, ehMove);

        $document.on(eventNames.moveEvent, ehMove);
        $document.one(eventNames.endEvent, ehEnd);
        this.callOnStart();
      },

      /**
       * onMove event handler
       *
       * @param {jqLite} pointer
       * @param {Event}  event The event
       * @param {boolean}  fromTick if the event occured on a tick or not
       * @returns {undefined}
       */
      onMove: function(pointer, event, fromTick) {
        var newOffset = this.getEventPosition(event),
          newValue,
          ceilValue = this.options.rightToLeft ? this.minValue : this.maxValue,
          flrValue = this.options.rightToLeft ? this.maxValue : this.minValue;

        if (newOffset <= 0) {
          newValue = flrValue;
        } else if (newOffset >= this.maxPos) {
          newValue = ceilValue;
        } else {
          newValue = this.offsetToValue(newOffset);
          if (fromTick && angular.isNumber(this.options.showTicks))
            newValue = this.roundStep(newValue, this.options.showTicks);
          else
            newValue = this.roundStep(newValue);
        }
        this.positionTrackingHandle(newValue);
      },

      /**
       * onEnd event handler
       *
       * @param {Event}    event    The event
       * @param {Function} ehMove   The the bound move event handler
       * @returns {undefined}
       */
      onEnd: function(ehMove, event) {
        var moveEventName = this.getEventNames(event).moveEvent;

        if (!this.options.keyboardSupport) {
          this.minH.removeClass('rz-active');
          this.maxH.removeClass('rz-active');
          this.tracking = '';
        }
        this.dragging.active = false;

        $document.off(moveEventName, ehMove);
        this.scope.$emit('slideEnded');
        this.callOnEnd();
      },

      onTickClick: function(pointer, event) {
        this.onMove(pointer, event, true);
      },

      onPointerFocus: function(pointer, ref) {
        this.tracking = ref;
        pointer.one('blur', angular.bind(this, this.onPointerBlur, pointer));
        pointer.on('keydown', angular.bind(this, this.onKeyboardEvent));
        pointer.addClass('rz-active');
      },

      onPointerBlur: function(pointer) {
        pointer.off('keydown');
        this.tracking = '';
        pointer.removeClass('rz-active');
      },

      /**
       * Key actions helper function
       *
       * @param {number} currentValue value of the slider
       *
       * @returns {?Object} action value mappings
       */
      getKeyActions: function(currentValue) {
        var increaseStep = currentValue + this.step,
          decreaseStep = currentValue - this.step,
          increasePage = currentValue + this.valueRange / 10,
          decreasePage = currentValue - this.valueRange / 10;

        //Left to right default actions
        var actions = {
          'UP': increaseStep,
          'DOWN': decreaseStep,
          'LEFT': decreaseStep,
          'RIGHT': increaseStep,
          'PAGEUP': increasePage,
          'PAGEDOWN': decreasePage,
          'HOME': this.minValue,
          'END': this.maxValue
        };
        //right to left means swapping right and left arrows
        if (this.options.rightToLeft) {
          actions.LEFT = increaseStep;
          actions.RIGHT = decreaseStep;
          // right to left and vertical means we also swap up and down
          if (this.options.vertical) {
            actions.UP = decreaseStep;
            actions.DOWN = increaseStep;
          }
        }
        return actions;
      },

      onKeyboardEvent: function(event) {
        var currentValue = this.scope[this.tracking],
          keyCode = event.keyCode || event.which,
          keys = {
            38: 'UP',
            40: 'DOWN',
            37: 'LEFT',
            39: 'RIGHT',
            33: 'PAGEUP',
            34: 'PAGEDOWN',
            36: 'HOME',
            35: 'END'
          },
          actions = this.getKeyActions(currentValue),
          key = keys[keyCode],
          action = actions[key];
        if (action === null || this.tracking === '') return;
        event.preventDefault();

        var newValue = this.roundStep(this.sanitizeValue(action));
        if (!this.options.draggableRangeOnly) {
          this.positionTrackingHandle(newValue);
        } else {
          var difference = this.scope.rzSliderHigh - this.scope.rzSliderModel,
            newMinValue, newMaxValue;
          if (this.tracking === 'rzSliderModel') {
            newMinValue = newValue;
            newMaxValue = newValue + difference;
            if (newMaxValue > this.maxValue) {
              newMaxValue = this.maxValue;
              newMinValue = newMaxValue - difference;
            }
          } else {
            newMaxValue = newValue;
            newMinValue = newValue - difference;
            if (newMinValue < this.minValue) {
              newMinValue = this.minValue;
              newMaxValue = newMinValue + difference;
            }
          }
          this.positionTrackingBar(newMinValue, newMaxValue);
        }
      },

      /**
       * onDragStart event handler
       *
       * Handles dragging of the middle bar.
       *
       * @param {Object} pointer The jqLite wrapped DOM element
       * @param {string} ref     One of the refLow, refHigh values
       * @param {Event}  event   The event
       * @returns {undefined}
       */
      onDragStart: function(pointer, ref, event) {
        var offset = this.getEventPosition(event);
        this.dragging = {
          active: true,
          value: this.offsetToValue(offset),
          difference: this.scope.rzSliderHigh - this.scope.rzSliderModel,
          lowLimit: this.options.rightToLeft ? this.minH.rzsp - offset : offset - this.minH.rzsp,
          highLimit: this.options.rightToLeft ? offset - this.maxH.rzsp : this.maxH.rzsp - offset
        };

        this.onStart(pointer, ref, event);
      },

      /**
       * getValue helper function
       *
       * gets max or min value depending on whether the newOffset is outOfBounds above or below the bar and rightToLeft
       *
       * @param {string} type 'max' || 'min' The value we are calculating
       * @param {number} newOffset  The new offset
       * @param {boolean} outOfBounds Is the new offset above or below the max/min?
       * @param {boolean} isAbove Is the new offset above the bar if out of bounds?
       *
       * @returns {number}
       */
      getValue: function(type, newOffset, outOfBounds, isAbove) {
        var isRTL = this.options.rightToLeft,
          value = null;

        if (type === 'min') {
          if (outOfBounds) {
            if (isAbove) {
              value = isRTL ? this.minValue : this.maxValue - this.dragging.difference;
            } else {
              value = isRTL ? this.maxValue - this.dragging.difference : this.minValue;
            }
          } else {
            value = isRTL ? this.offsetToValue(newOffset + this.dragging.lowLimit) : this.offsetToValue(newOffset - this.dragging.lowLimit);
          }
        } else {
          if (outOfBounds) {
            if (isAbove) {
              value = isRTL ? this.minValue + this.dragging.difference : this.maxValue;
            } else {
              value = isRTL ? this.maxValue : this.minValue + this.dragging.difference;
            }
          } else {
            if (isRTL) {
              value = this.offsetToValue(newOffset + this.dragging.lowLimit) + this.dragging.difference;
            } else {
              value = this.offsetToValue(newOffset - this.dragging.lowLimit) + this.dragging.difference;
            }
          }
        }
        return this.roundStep(value);
      },

      /**
       * onDragMove event handler
       *
       * Handles dragging of the middle bar.
       *
       * @param {jqLite} pointer
       * @param {Event}  event The event
       * @returns {undefined}
       */
      onDragMove: function(pointer, event) {
        var newOffset = this.getEventPosition(event),
          newMinValue, newMaxValue,
          ceilLimit, flrLimit,
          isUnderFlrLimit, isOverCeilLimit,
          flrH, ceilH;

        if (this.options.rightToLeft) {
          ceilLimit = this.dragging.lowLimit;
          flrLimit = this.dragging.highLimit;
          flrH = this.maxH;
          ceilH = this.minH;
        } else {
          ceilLimit = this.dragging.highLimit;
          flrLimit = this.dragging.lowLimit;
          flrH = this.minH;
          ceilH = this.maxH;
        }
        isUnderFlrLimit = newOffset <= flrLimit;
        isOverCeilLimit = newOffset >= this.maxPos - ceilLimit;

        if (isUnderFlrLimit) {
          if (flrH.rzsp === 0)
            return;
          newMinValue = this.getValue('min', newOffset, true, false);
          newMaxValue = this.getValue('max', newOffset, true, false);
        } else if (isOverCeilLimit) {
          if (ceilH.rzsp === this.maxPos)
            return;
          newMaxValue = this.getValue('max', newOffset, true, true);
          newMinValue = this.getValue('min', newOffset, true, true);
        } else {
          newMinValue = this.getValue('min', newOffset, false);
          newMaxValue = this.getValue('max', newOffset, false);
        }
        this.positionTrackingBar(newMinValue, newMaxValue);
      },

      /**
       * Set the new value and offset for the entire bar
       *
       * @param {number} newMinValue   the new minimum value
       * @param {number} newMaxValue   the new maximum value
       */
      positionTrackingBar: function(newMinValue, newMaxValue) {
        this.scope.rzSliderModel = newMinValue;
        this.scope.rzSliderHigh = newMaxValue;
        this.updateHandles('rzSliderModel', this.valueToOffset(newMinValue));
        this.updateHandles('rzSliderHigh', this.valueToOffset(newMaxValue));
        this.applyModel();
      },

      /**
       * Set the new value and offset to the current tracking handle
       *
       * @param {number} newValue new model value
       */
      positionTrackingHandle: function(newValue) {
        var valueChanged = false;

        if (this.range) {
          newValue = this.applyMinRange(newValue);
          /* This is to check if we need to switch the min and max handles */
          if (this.tracking === 'rzSliderModel' && newValue > this.scope.rzSliderHigh) {
            if (this.options.noSwitching && this.scope.rzSliderHigh !== this.minValue) {
              newValue = this.applyMinRange(this.scope.rzSliderHigh);
            }
            else {
              this.scope[this.tracking] = this.scope.rzSliderHigh;
              this.updateHandles(this.tracking, this.maxH.rzsp);
              this.updateAriaAttributes();
              this.tracking = 'rzSliderHigh';
              this.minH.removeClass('rz-active');
              this.maxH.addClass('rz-active');
              if (this.options.keyboardSupport)
                this.focusElement(this.maxH);
            }
            valueChanged = true;
          } else if (this.tracking === 'rzSliderHigh' && newValue < this.scope.rzSliderModel) {
            if (this.options.noSwitching && this.scope.rzSliderModel !== this.maxValue) {
              newValue = this.applyMinRange(this.scope.rzSliderModel);
            }
            else {
              this.scope[this.tracking] = this.scope.rzSliderModel;
              this.updateHandles(this.tracking, this.minH.rzsp);
              this.updateAriaAttributes();
              this.tracking = 'rzSliderModel';
              this.maxH.removeClass('rz-active');
              this.minH.addClass('rz-active');
              if (this.options.keyboardSupport)
                this.focusElement(this.minH);
            }
            valueChanged = true;
          }
        }

        if (this.scope[this.tracking] !== newValue) {
          this.scope[this.tracking] = newValue;
          this.updateHandles(this.tracking, this.valueToOffset(newValue));
          this.updateAriaAttributes();
          valueChanged = true;
        }

        if (valueChanged)
          this.applyModel();
      },

      applyMinRange: function(newValue) {
        if (this.options.minRange !== 0) {
          var oppositeValue = this.tracking === 'rzSliderModel' ? this.scope.rzSliderHigh : this.scope.rzSliderModel,
            difference = Math.abs(newValue - oppositeValue);

          if (difference < this.options.minRange) {
            if (this.tracking === 'rzSliderModel')
              return this.scope.rzSliderHigh - this.options.minRange;
            else
              return this.scope.rzSliderModel + this.options.minRange;
          }
        }
        return newValue;
      },

      /**
       * Apply the model values using scope.$apply.
       * We wrap it with the internalChange flag to avoid the watchers to be called
       */
      applyModel: function() {
        this.internalChange = true;
        this.scope.$apply();
        this.callOnChange();
        this.internalChange = false;
      },

      /**
       * Call the onStart callback if defined
       * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
       *
       * @returns {undefined}
       */
      callOnStart: function() {
        if (this.options.onStart) {
          var self = this;
          this.scope.$evalAsync(function() {
            self.options.onStart(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
          });
        }
      },

      /**
       * Call the onChange callback if defined
       * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
       *
       * @returns {undefined}
       */
      callOnChange: function() {
        if (this.options.onChange) {
          var self = this;
          this.scope.$evalAsync(function() {
            self.options.onChange(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
          });
        }
      },

      /**
       * Call the onEnd callback if defined
       * The callback call is wrapped in a $evalAsync to ensure that its result will be applied to the scope.
       *
       * @returns {undefined}
       */
      callOnEnd: function() {
        if (this.options.onEnd) {
          var self = this;
          this.scope.$evalAsync(function() {
            self.options.onEnd(self.options.id, self.scope.rzSliderModel, self.scope.rzSliderHigh);
          });
        }
      }
    };

    return Slider;
  }])

  .directive('rzslider', ['RzSlider', function(RzSlider) {
    //'use strict';

    return {
      restrict: 'E',
      scope: {
        rzSliderModel: '=?',
        rzSliderHigh: '=?',
        rzSliderOptions: '&?',
        rzSliderTplUrl: '@'
      },

      /**
       * Return template URL
       *
       * @param {jqLite} elem
       * @param {Object} attrs
       * @return {string}
       */
      templateUrl: function(elem, attrs) {
        //noinspection JSUnresolvedVariable
        return attrs.rzSliderTplUrl || 'rzSliderTpl.html';
      },

      link: function(scope, elem) {
        scope.slider = new RzSlider(scope, elem); //attach on scope so we can test it
      }
    };
  }]);

  // IDE assist

  /**
   * @name ngScope
   *
   * @property {number} rzSliderModel
   * @property {number} rzSliderHigh
   * @property {Object} rzSliderOptions
   */

  /**
   * @name jqLite
   *
   * @property {number|undefined} rzsp rzslider label position offset
   * @property {number|undefined} rzsd rzslider element dimension
   * @property {string|undefined} rzsv rzslider label value/text
   * @property {Function} css
   * @property {Function} text
   */

  /**
   * @name Event
   * @property {Array} touches
   * @property {Event} originalEvent
   */

  /**
   * @name ThrottleOptions
   *
   * @property {boolean} leading
   * @property {boolean} trailing
   */

  module.run(['$templateCache', function($templateCache) {
  //'use strict';

  $templateCache.put('rzSliderTpl.html',
    "<span class=rz-bar-wrapper><span class=rz-bar></span></span> <span class=rz-bar-wrapper><span class=\"rz-bar rz-selection\" ng-style=barStyle></span></span> <span class=\"rz-pointer rz-pointer-min\" ng-style=minPointerStyle></span> <span class=\"rz-pointer rz-pointer-max\" ng-style=maxPointerStyle></span> <span class=\"rz-bubble rz-limit\"></span> <span class=\"rz-bubble rz-limit\"></span> <span class=rz-bubble></span> <span class=rz-bubble></span> <span class=rz-bubble></span><ul ng-show=showTicks class=rz-ticks><li ng-repeat=\"t in ticks track by $index\" class=rz-tick ng-class=\"{'rz-selected': t.selected}\" ng-style=t.style ng-attr-uib-tooltip=\"{{ t.tooltip }}\" ng-attr-tooltip-placement={{t.tooltipPlacement}} ng-attr-tooltip-append-to-body=\"{{ t.tooltip ? true : undefined}}\"><span ng-if=\"t.value != null\" class=rz-tick-value ng-attr-uib-tooltip=\"{{ t.valueTooltip }}\" ng-attr-tooltip-placement={{t.valueTooltipPlacement}}>{{ t.value }}</span> <span ng-if=\"t.legend != null\" class=rz-tick-legend>{{ t.legend }}</span></li></ul>"
  );

}]);

  return module;
}));

angular.module('recipes').directive('shelfstatusbar', function () {
    'use strict';
    // progress bar settings
    const pbLimitEmpty = 10;
    const pbLimitDeficit = 20;
    const pbLengthDeficit = 20;
    const pbLimitDesired = 50;
    const pbLengthDesired = 30;
    const pbLimitMax = 80;
    const pbLenghtMax = 30;
    const pbMultyMax = 5;
    return {
        restrict: 'AE',
        scope: {
            progressbar: '=handle'
        },
        require: 'ngModel',
        template:
            '<div>' +
                '<div ng-show="progressbar">' +
                    '<progressbar class="{{progressbar.class}}" value="progressbar.value" type="{{progressbar.type}}" max="100">' +
                        '<span style="color:white; white-space:nowrap;">' + 
                            '{{progressbar.text}}' +
                        '</span>' +
                    '</progressbar>' +
                '</div>' +
                '<div ng-hide="progressbar">' +
                    '' +
                '</div>' +
            '</div>',
        link: function (scope, iElement, iAttrs, ngModelController) {
            ngModelController.$render = function () {
                scope.shelf = ngModelController.$viewValue;
                scope.progressUpdate();    
            };
            scope.$watch(function () {
                return ngModelController.$modelValue;
            }, function(newValue) {
                scope.progressUpdate();
            }, true);
            scope.progressUpdate = function() {
                if (!scope.shelf) return;
                if (scope.shelf.stored <= scope.shelf.deficit) {
                    scope.progressbar = 
                        {
                            type: 'danger',
                            text: scope.shelf.stored + " < " + scope.shelf.deficit, 
                            value: pbLimitDeficit - pbLengthDeficit + 
                                ((scope.shelf.stored / scope.shelf.deficit) * pbLengthDeficit)    
                        };
                    if (scope.progressbar.value < pbLimitEmpty) {
                        scope.progressbar.value = pbLimitEmpty;
                    }
                } else if (scope.shelf.stored < scope.shelf.desired) {
                    scope.progressbar = 
                        {
                            type: 'warning',
                            text: scope.shelf.stored,
                            value: pbLimitDesired - pbLengthDesired + 
                                ((scope.shelf.stored - scope.shelf.deficit) / (scope.shelf.desired - scope.shelf.deficit) * pbLengthDesired)
                        };
                } else if (scope.shelf.stored <= scope.shelf.max) {
                    scope.progressbar = 
                        {
                            type: 'success',
                            text: scope.shelf.stored,
                            value: pbLimitMax - pbLenghtMax + 
                                ((scope.shelf.stored - scope.shelf.desired) / (scope.shelf.max - scope.shelf.desired) * pbLenghtMax)
                        };
                } else {
                    scope.progressbar = 
                        {
                            type: 'info',
                            text: scope.shelf.stored + " > " + scope.shelf.max,
                            value: pbLimitMax - pbMultyMax + 
                                (scope.shelf.stored / scope.shelf.max) * pbMultyMax
                        };
                    if (scope.progressbar.value > 100) { // 100%
                        scope.progressbar.value = 100; // set to 100%
                    }
                }
                if(scope.shelf.isSpoiled) {
                    scope.progressbar.class = "progress-striped active";
                }
            };
        }
    };
});
'use strict';

//Ingredients service used for communicating with the Ingredients REST endpoints
angular
    .module('recipes')
    .factory('IngredientService', IngredientService);

IngredientService.$inject = ['$resource', 'ShelfService', 'MeasureService'];

function IngredientService($resource, ShelfService, MeasureService) {
    var Ingredient = $resource('api/ingredients/:ingredientId', {
        ingredientId: '@id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Ingredient.prototype, {
        createOrUpdate: function () {
            var ingredient = this;
            return createOrUpdate(ingredient);
        },
        getShelf: function () {
            var ingredient = this;
            return getShelf(ingredient);
        },
        getMeasure: function() {
            var ingredient = this;
            return getMeasure(ingredient);
        }
    });
    
    return Ingredient;
    
    function createOrUpdate(ingredient) {
        if (ingredient.id) {
            return ingredient.$update(onSuccess, onError);
        } else {
            return ingredient.$save(onSuccess, onError);
        }
    }
    
    function getShelf(ingredient) {
        return ShelfService.get(
            {
                ingredientId: ingredient.id
            }
        ).$promise;
    }
    
    function getMeasure(ingredient) {
        return MeasureService.get(
            {
                measureId: ingredient.measureDefault
            }
        ).$promise;
    }
    
    function onSuccess(ingredient) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

//Ingridients service used for communicating with the ingridients REST endpoints
angular.module('recipes').factory('Ingridients', ['$resource',
    function($resource) {
        return $resource('api/ingridients/:ingridientId', {
            ingridientId: '@id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
'use strict';

//Shelf service used for communicating with the shelf REST endpoints
angular
    .module('recipes')
    .factory('MealService', MealService);

MealService.$inject = ['$resource', 'RecipeService'];

function MealService($resource, RecipeService) {
    var Meal = $resource('api/meal/:mealId', {
        mealId: '@number'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Meal.prototype, {
        createOrUpdate: function () {
            var meal = this;
            return createOrUpdate(meal);
        },
        getRecipe: function () {
            var meal = this;
            return getRecipe(meal);
        }
    });
    
    return Meal;
    
    function createOrUpdate(meal) {
        if (meal.id) {
            return meal.$update(onSuccess, onError);
        } else {
            return meal.$save(onSuccess, onError);
        }
    }
    
    function getRecipe(meal) {
        return RecipeService.get(
            {
                recipeId: meal.recipeId
            }
        ).$promise;
    }
    
    function onSuccess(menu) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';
//FUTURE DEPRECATED
//Measures service used for communicating with the measures REST endpoints
angular.module('recipes').factory('Measures', ['$resource',
    function ($resource) {
        return $resource('api/measures/:measureId', {
            measureId: '@id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);

//Measure service used for communicating with the measure REST endpoints
angular
    .module('recipes')
    .factory('MeasureService', MeasureService);

MeasureService.$inject = ['$resource'];

function MeasureService($resource) {
    var Measure = $resource('api/measures/:measureId', {
        measureId: '@id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Measure.prototype, {
        createOrUpdate: function () {
            var measure = this;
            return createOrUpdate(measure);
        },
        applyValue: function (value, precision) {
            var measure = this;
            return applyValue(measure, value, precision);
        }
    });
    
    return Measure;
    
    function createOrUpdate(measure) {
        if (measure.id) {
            return measure.$update(onSuccess, onError);
        } else {
            return measure.$save(onSuccess, onError);
        }
    }
    
    function applyValue(measure, value, toFixed) {
        
        if (measure.step <= 0)
            return undefined;
        
        var result = value || 0,
            precision = toFixed || 3;
        if (value % measure.step > 0) {
            result = Number((value - value % measure.step + measure.step).toFixed(precision));
        }
        if (result < measure.min) {
            result = measure.min;
        }
        return result;
    }
    
    function onSuccess(measure) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

//Shelf service used for communicating with the shelf REST endpoints
angular
    .module('recipes')
    .factory('MenuService', MenuService);

MenuService.$inject = ['$resource'];

function MenuService($resource) {
    var Menu = $resource('api/menu/:menuId', {
        menuId: '@number'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Menu.prototype, {
        createOrUpdate: function () {
            var menu = this;
            return createOrUpdate(menu);
        }
    });
    
    return Menu;
    
    function createOrUpdate(menu) {
        if (menu.id) {
            return menu.$update(onSuccess, onError);
        } else {
            return menu.$save(onSuccess, onError);
        }
    }
    
    function onSuccess(menu) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

//Products service used for communicating with the products REST endpoints
angular.module('recipes').factory('Products', ['$resource',
    function($resource) {
        return $resource('api/products/:productId', {
            productId: '@id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
]);
'use strict';

//Recipes service used for communicating with the recipes REST endpoints
angular.module('recipes').factory('Recipes', ['$resource',
  function($resource) {
    return $resource('api/recipes/:recipeId', {
      recipeId: '@id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);

//Recipe service used for communicating with the recipe REST endpoints
angular
    .module('recipes')
    .factory('RecipeService', RecipeService);

RecipeService.$inject = ['$resource'];

function RecipeService($resource) {
    var Recipe = $resource('api/recipes/:recipeId', {
        recipeId: '@id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Recipe.prototype, {
        createOrUpdate: function () {
            var recipe = this;
            return createOrUpdate(recipe);
        }
    });
    
    return Recipe;
    
    function createOrUpdate(recipe) {
        if (recipe.id) {
            return recipe.$update(onSuccess, onError);
        } else {
            return recipe.$save(onSuccess, onError);
        }
    }
    
    function onSuccess(recipe) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

//Shelf service used for communicating with the shelf REST endpoints
angular
    .module('recipes')
    .factory('ShelfService', ShelfService);

ShelfService.$inject = ['$resource'];

function ShelfService($resource) {
    var Shelf = $resource('api/shelf/:shelfId', {
        shelfId: '@id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(Shelf.prototype, {
        createOrUpdate: function () {
            var shelf = this;
            return createOrUpdate(shelf);
        }
    });
    
    return Shelf;
    
    function createOrUpdate(shelf) {
        if (shelf.id) {
            return shelf.$update(onSuccess, onError);
        } else {
            return shelf.$save(onSuccess, onError);
        }
    }
    
    function onSuccess(shelf) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

//Shelf service used for communicating with the shelf REST endpoints
angular
    .module('recipes')
    .factory('ShelfQueryService', ShelfQueryService);

ShelfQueryService.$inject = ['$resource'];

function ShelfQueryService($resource) {
    var ShelfQuery = $resource('api/shelf/:shelfId/query/:queryId', {
        shelfId: '@shelfId',
        queryId: '@number'
    }, {
        update: {
            method: 'PUT'
        }
    });
    
    angular.extend(ShelfQuery.prototype, {
        createOrUpdate: function () {
            var shelfQuery = this;
            return createOrUpdate(shelfQuery);
        }
    });
    
    return ShelfQuery;
    
    function createOrUpdate(shelfQuery) {
        if (shelfQuery.id) {
            return shelfQuery.$update(onSuccess, onError);
        } else {
            return shelfQuery.$save(onSuccess, onError);
        }
    }
    
    function onSuccess(shelfQuery) {
        // Any required internal processing from inside the service, goes here.    
    }
    
    // Handle error response
    function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
    }

    function handleError(error) {
        // Log error
        console.log(error);
    }
}
'use strict';

// Configuring the Articles module
angular.module('user.admin').run(['Menus',
  function(Menus) {
    Menus.addSubMenuItem('topbar', 'admin', {
      title: 'Manage Users',
      state: 'admin.users'
    });
  }
]);
'use strict';

// Setting up route
angular.module('user.admin.routes').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider
      .state('admin.users', {
        url: '/users',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController'
      })
      .state('admin.user', {
        url: '/user/:userId',
        templateUrl: 'modules/users/client/views/admin/view-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      })
      .state('admin.user-edit', {
        url: '/user/:userId/edit',
        templateUrl: 'modules/users/client/views/admin/edit-user.client.view.html',
        controller: 'UserController',
        resolve: {
          userResolve: ['$stateParams', 'Admin', function($stateParams, Admin) {
            return Admin.get({
              userId: $stateParams.userId
            });
          }]
        }
      });
  }
]);
'use strict';

// Config HTTP Error Handling
angular.module('user').config(['$httpProvider',
  function($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function($q, $location, Authentication) {
        return {
          responseError: function(rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);
'use strict';

// Setting up route
angular.module('user').config(['$stateProvider',
  function($stateProvider) {
    // User state routing
    $stateProvider
      .state('settings', {
        abstract: true,
        url: '/settings',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('settings.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('settings.accounts', {
        url: '/accounts',
        templateUrl: 'modules/users/client/views/settings/manage-social-accounts.client.view.html'
      })
      .state('settings.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html'
      })
      .state('authentication.signup', {
        url: '/signup',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      });
  }
]);
'use strict';

angular.module('user.admin').controller('UserListController', ['$scope', '$filter', 'Admin',
  function($scope, $filter, Admin) {

    Admin.query(function(data) {
      $scope.users = data;
      $scope.buildPager();
    });

    $scope.buildPager = function() {
      $scope.pagedItems = [];
      $scope.itemsPerPage = 15;
      $scope.currentPage = 1;
      $scope.figureOutItemsToDisplay();
    };

    $scope.figureOutItemsToDisplay = function() {
      $scope.filteredItems = $filter('filter')($scope.users, {
        $: $scope.search
      });
      $scope.filterLength = $scope.filteredItems.length;
      var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
      var end = begin + $scope.itemsPerPage;
      $scope.pagedItems = $scope.filteredItems.slice(begin, end);
    };

    $scope.pageChanged = function() {
      $scope.figureOutItemsToDisplay();
    };
  }
]);
'use strict';

angular.module('user.admin').controller('UserController', ['$scope', '$state', 'Authentication', 'userResolve',
  function($scope, $state, Authentication, userResolve) {

    $scope.authentication = Authentication;
    $scope.user = userResolve;

    $scope.remove = function() {

      if (confirm('Are you sure you want to delete this user?')) {

        var user = $scope.user;
        user.$remove({
          'userId': user.id
        }, function() {
          $state.go('admin.users');
        }, function(errorResponse) {
          $scope.error = errorResponse.data.message;
        });


      }
    };

    $scope.update = function(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      var user = $scope.user;

      user.$update({
        'userId': user.id
      }, function() {
        $state.go('admin.user', {
          userId: user.id
        });
      }, function(errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);
'use strict';

angular.module('user').controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator',
  function($scope, $state, $http, $location, $window, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Get an eventual error defined in the URL query string:
    $scope.error = $location.search().err;

    // If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    $scope.signup = function(isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signup', $scope.credentials).success(function(response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function(response) {
        $scope.error = response.message;
      });
    };

    $scope.signin = function(isValid) {
      $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      $http.post('/api/auth/signin', $scope.credentials).success(function(response) {
        // If successful we assign the response to the global user model
        $scope.authentication.user = response;

        // And redirect to the previous or home page
        $state.go($state.previous.state.name || 'home', $state.previous.params);
      }).error(function(response) {
        $scope.error = response.message;
      });
    };

    // OAuth provider request
    $scope.callOauthProvider = function(url) {
      if ($state.previous && $state.previous.href) {
        url += '?redirect_to=' + encodeURIComponent($state.previous.href);
      }

      // Effectively call OAuth authentication route:
      $window.location.href = url;
    };
  }
]);
'use strict';

angular.module('user').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator',
  function($scope, $stateParams, $http, $location, Authentication, PasswordValidator) {
    $scope.authentication = Authentication;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // Submit forgotten password account id
    $scope.askForPasswordReset = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'forgotPasswordForm');

        return false;
      }

      $http.post('/api/auth/forgot', $scope.credentials).success(function(response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;

      }).error(function(response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'resetPasswordForm');

        return false;
      }

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $location.path('/password/reset/success');
      }).error(function(response) {
        $scope.error = response.message;
      });
    };
  }
]);
'use strict';

angular.module('user').controller('ChangePasswordController', ['$scope', '$http', 'Authentication', 'PasswordValidator',
  function($scope, $http, Authentication, PasswordValidator) {
    $scope.user = Authentication.user;
    $scope.popoverMsg = PasswordValidator.getPopoverMsg();

    // Change user password
    $scope.changeUserPassword = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'passwordForm');

        return false;
      }

      $http.post('/api/user/password', $scope.passwordDetails).success(function(response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'passwordForm');
        $scope.success = true;
        $scope.passwordDetails = null;
      }).error(function(response) {
        $scope.error = response.message;
      });
    };
  }
]);
'use strict';

angular.module('user').controller('ChangeProfilePictureController', ['$scope', '$timeout', '$window', 'Authentication', 'FileUploader',
  function($scope, $timeout, $window, Authentication, FileUploader) {
    $scope.user = Authentication.user;
    $scope.imageURL = $scope.user.profileImageURL;

    // Create file uploader instance
    $scope.uploader = new FileUploader({
      url: 'api/user/picture'
    });

    // Set file uploader image filter
    $scope.uploader.filters.push({
      name: 'imageFilter',
      fn: function(item, options) {
        var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    });

    // Called after the user selected a new picture file
    $scope.uploader.onAfterAddingFile = function(fileItem) {
      if ($window.FileReader) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(fileItem._file);

        fileReader.onload = function(fileReaderEvent) {
          $timeout(function() {
            $scope.imageURL = fileReaderEvent.target.result;
          }, 0);
        };
      }
    };

    // Called after the user has successfully uploaded a new picture
    $scope.uploader.onSuccessItem = function(fileItem, response, status, headers) {
      // Show success message
      $scope.success = true;

      // Populate user object
      $scope.user = Authentication.user = response;

      // Clear upload buttons
      $scope.cancelUpload();
    };

    // Called after the user has failed to uploaded a new picture
    $scope.uploader.onErrorItem = function(fileItem, response, status, headers) {
      // Clear upload buttons
      $scope.cancelUpload();

      // Show error message
      $scope.error = response.message;
    };

    // Change user profile picture
    $scope.uploadProfilePicture = function() {
      // Clear messages
      $scope.success = $scope.error = null;

      // Start upload
      $scope.uploader.uploadAll();
    };

    // Cancel the upload process
    $scope.cancelUpload = function() {
      $scope.uploader.clearQueue();
      $scope.imageURL = $scope.user.profileImageURL;
    };
  }
]);
'use strict';

angular.module('user').controller('EditProfileController', ['$scope', '$http', '$location', 'User', 'Authentication',
  function($scope, $http, $location, User, Authentication) {
    $scope.user = Authentication.user;

    $scope.getProfile = function() {
      User.get(function(data) {
        $scope.user = data;
      });
    };

    // Update a user profile
    $scope.updateUserProfile = function(isValid) {
      $scope.success = $scope.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');

        return false;
      }

      var user = new User($scope.user);

      user.$update(function(response) {
        $scope.$broadcast('show-errors-reset', 'userForm');

        $scope.success = true;
        Authentication.user = response;
      }, function(response) {
        $scope.error = response.data.message;
      });
    };
  }
]);
'use strict';

angular.module('user').controller('SocialAccountsController', ['$scope', '$http', 'Authentication',
  function($scope, $http, Authentication) {
    $scope.user = Authentication.user;

    // Check if there are additional accounts
    $scope.hasConnectedAdditionalSocialAccounts = function(provider) {
      for (var i in $scope.user.additionalProvidersData) {
        return true;
      }

      return false;
    };

    // Check if provider is already in use with current user
    $scope.isConnectedSocialAccount = function(provider) {
      return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
    };

    // Remove a user social account
    $scope.removeUserSocialAccount = function(provider) {
      $scope.success = $scope.error = null;

      $http.delete('/api/user/accounts', {
        params: {
          provider: provider
        }
      }).success(function(response) {
        // If successful show success message and clear form
        $scope.success = true;
        $scope.user = Authentication.user = response;
      }).error(function(response) {
        $scope.error = response.message;
      });
    };
  }
]);
'use strict';

angular.module('user').controller('SettingsController', ['$scope', 'Authentication',
  function($scope, Authentication) {
    $scope.user = Authentication.user;
  }
]);
'use strict';

angular.module('user')
  .directive('passwordValidator', ['PasswordValidator', function(PasswordValidator) {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, modelCtrl) {
        modelCtrl.$parsers.unshift(function(password) {
          var result = PasswordValidator.getResult(password);
          var strengthIdx = 0;

          // Strength Meter - visual indicator for users
          var strengthMeter = [{
            color: "danger",
            progress: "20"
          }, {
            color: "warning",
            progress: "40"
          }, {
            color: "info",
            progress: "60"
          }, {
            color: "primary",
            progress: "80"
          }, {
            color: "success",
            progress: "100"
          }];
          var strengthMax = strengthMeter.length;

          if (result.errors.length < strengthMeter.length) {
            strengthIdx = strengthMeter.length - result.errors.length - 1;
          }

          scope.strengthColor = strengthMeter[strengthIdx].color;
          scope.strengthProgress = strengthMeter[strengthIdx].progress;

          if (result.errors.length) {
            scope.popoverMsg = PasswordValidator.getPopoverMsg();
            scope.passwordErrors = result.errors;
            modelCtrl.$setValidity('strength', false);
            return undefined;
          } else {
            scope.popoverMsg = '';
            modelCtrl.$setValidity('strength', true);
            return password;
          }
        });
      }
    };
  }]);
'use strict';

angular.module('user')
  .directive("passwordVerify", function() {
    return {
      require: "ngModel",
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, modelCtrl) {
        scope.$watch(function() {
          var combined;
          if (scope.passwordVerify || modelCtrl.$viewValue) {
            combined = scope.passwordVerify + '_' + modelCtrl.$viewValue;
          }
          return combined;
        }, function(value) {
          if (value) {
            modelCtrl.$parsers.unshift(function(viewValue) {
              var origin = scope.passwordVerify;
              if (origin !== viewValue) {
                modelCtrl.$setValidity("passwordVerify", false);
                return undefined;
              } else {
                modelCtrl.$setValidity("passwordVerify", true);
                return viewValue;
              }
            });
          }
        });
      }
    };
  });

'use strict';

// Users directive used to force lowercase input
angular.module('user').directive('lowercase', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function(input) {
        return input ? input.toLowerCase() : '';
      });
      element.css('text-transform', 'lowercase');
    }
  };
});
'use strict';

// Authentication service for user variables
angular.module('user').factory('Authentication', ['$window',
  function($window) {
    var auth = {
      user: $window.user
    };

    return auth;
  }
]);
'use strict';

// PasswordValidator service used for testing the password strength
angular.module('user').factory('PasswordValidator', ['$window',
  function($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    return {
      getResult: function(password) {
        var result = owaspPasswordStrengthTest.test(password);
        return result;
      },
      getPopoverMsg: function() {
        var popoverMsg = "Please enter a passphrase or password with greater than 10 characters, numbers, lowercase, upppercase, and special characters.";
        return popoverMsg;
      }
    };
  }
]);
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('user').factory('User', ['$resource',
  function($resource) {
    return $resource('api/user', {}, {
      get: {
        method: 'GET'
      },
      update: {
        method: 'PUT'
      }
    });
  }
]);

angular.module('user.admin').factory('Admin', ['$resource',
  function($resource) {
    return $resource('api/admin/user/:userId', {
      userId: '@_id'
    }, {
      query: {
        method: 'GET',
        params: {},
        isArray: true
      },
      update: {
        method: 'PUT'
      }
    });
  }
]);
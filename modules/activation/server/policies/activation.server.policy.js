'use strict';

var
    path = require('path'),
    config = require(path.resolve('./config/config')),
    acl = require('acl');

/**
 * Module dependencies.
 */

acl = new acl(new acl.memoryBackend());

exports.invokeRolesPolicies = function() {
    acl.allow([{
        roles: ['admin'],
        allows: [
            {
                resources: '/api/activation',
                permissions: '*'
            }, {
                resources: '/api/activation/:activationId',
                permissions: '*'
            }, {
                resources: '/api/activation/:activationId/payment/:paymentId',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/confirmation',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/pseudopay',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/install',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/complete',
                permissions: ['get']
            }
        ]
    }, {
        roles: ['guest'],
        allows: [
            {
                resources: '/api/activation',
                permissions: ['post']
            }, {
                resources: '/api/activation/:activationId',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/payment/:paymentId',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/confirmation',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/pseudopay',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/install',
                permissions: ['get']
            }, {
                resources: '/api/activation/:activationId/complete',
                permissions: ['get']
            }
        ]
    }]);
};

exports.isAllowed = function(req, res, next) {
    var roles = (req.user) ? req.user.roles : ['guest'];
    // Check for user roles
    acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function(err, isAllowed) {
        if (err) {
            // An authorization error occurred.
            return res.status(500).send('Unexpected authorization error');
        } else {
            if (isAllowed) {
                // Access granted! Invoke next middleware
                return next();
            } else {
                return res.status(403).json({
                    message: 'User is not authorized'
                });
            }
        }
    });
};

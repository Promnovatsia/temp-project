'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    activationPolicy = require('../policies/activation.server.policy'),
    activation = require(path.resolve('./modules/activation/server/controllers/activation.server.controller'));


module.exports = function(app) {

    app.route('/api/activation')
        .all(activationPolicy.isAllowed)
        .get(activation.list)
        .post(activation.create);

    app.route('/api/activation/:activationId')
        .all(activationPolicy.isAllowed)
        .get(activation.read)
        .put(activation.update)
        .delete(activation.delete);

    app.route('/api/activation/:activationId/payment/:paymentId')
        .all(activationPolicy.isAllowed)
        .get(activation.begin);

    app.route('/api/activation/:activationId/confirmation')
        .all(activationPolicy.isAllowed)
        .get(activation.confirm);

    app.route('/api/activation/:activationId/pseudopay')
        .all(activationPolicy.isAllowed)
        .get(activation.pseudopay);

    app.route('/api/activation/:activationId/install')
        .all(activationPolicy.isAllowed)
        .get(activation.compile);

    app.route('/api/activation/:activationId/complete')
        .all(activationPolicy.isAllowed)
        .get(activation.complete);

    app.param('activationId', activation.activationByID);
    app.param('paymentId', activation.paymentByID);
};

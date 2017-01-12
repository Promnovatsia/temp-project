'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    Activation = db.activation,
    Paymethod = db.paymethod;

exports.create = function(req, res) {

    req.body.productId = 1; //TODO remove when more than one product is available
    req.body.version = 'v1'; //TODO remove when more than one product is available
    req.body.content = req.body.login + ' response'; //TODO remove when copy protection is implemented

    console.log(new Date().toISOString(), req.body.productId, 'activation request');

    Activation.findOne({
        where: {
            login: req.body.login,
            content: req.body.content
        }
    }).then(function (activation) {
        if (activation) {
            console.log(new Date().toISOString(), activation.productId, activation.id, 'recalled');
            var answer = {
                status: true,
                id: activation.id
            };
            if (activation.isPaid) {
                if (!activation.isConfirmed) {
                    activation.update(
                        {
                            isConfirmed: true
                        }
                    ).then(function () {
                        console.log(new Date().toISOString(), activation.productId, activation.id, 'confirmed');
                    });
                }
                console.log(new Date().toISOString(), activation.productId, activation.id, 'skipping payment methods');
                return res.jsonp(answer);
            } else {
                return activation.getMethods().then(function (methods) {
                    answer = {
                        status: false,
                        id: activation.id,
                        methods: methods
                    };
                    console.log(new Date().toISOString(), activation.productId, activation.id, 'sending payment methods');
                    return res.jsonp(answer);
                });
            }
        } else {
            return Paymethod.findAll().then(function (paymethods) {
                console.log(new Date().toISOString(), req.body.productId, 'finding payment methods');
                return Activation.create(req.body).then(function (activation) {
                    if (!activation) {
                        console.log(new Date().toISOString(), 'CRITICAL', 'Server Error - Could not create an activation');
                        return res.status(500).send({
                            message: 'Server Error - Could not create an activation'
                        });
                    } else {
                        console.log(new Date().toISOString(), activation.productId, activation.id, 'created');
                        return activation.setMethods(paymethods).then(function () {
                            console.log(new Date().toISOString(), activation.productId, activation.id, 'associating payment methods');
                            return Activation.find({
                                where: {
                                    id: activation.id
                                },
                                include: [{all: true}]
                            }).then(function (activation) {
                                answer = {
                                    status: false,
                                    id: activation.id,
                                    methods: activation.methods
                                };
                                console.log(new Date().toISOString(), activation.productId, activation.id, 'sending payment methods');
                                return res.jsonp(answer);
                            });
                        });
                    }
                });
            });
        }
    }).catch(function(err) {
        console.log(new Date().toISOString(), 'ERROR', err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

exports.read = function(req, res) {
    console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'status read');
    res.json(req.activation);
};

exports.begin = function(req, res) {
    if (req.activation.isPaid) {
        var link = {
            status: true,
            link: ''
        };
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'restarted');
        return res.jsonp(link);
    }

    if (!req.activation.isStarted) {
        req.activation.update(
            {
                isStarted: true
            }
        ).then(function () {
            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'started');
        });
    }
    Paymethod.find({
        where: {
            id: req.activation.chosenMethod
        }
    }).then(function(method) {
        if (!method) {
            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'chosen wrong method');
            return res.status(400).send({
                message: 'Wrong method is chosen'
            });
        }
        var link = {
            status: false,
            link: method.link + '/' + req.activation.id
        };
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'chosen method', req.activation.chosenMethod);
        return res.jsonp(link);
    }).catch(function(err) {
        console.log(new Date().toISOString(), 'ERROR', err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

exports.confirm = function(req, res) {

    if (req.activation.isConfirmed) {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'already confirmed');
        return res.json(true);
    }
    if (req.activation.isPaid) {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'requesting confirmation');
        req.activation.update(
            {
                isConfirmed: true
            }
        ).then(function () {
            //TODO here email must be sent
            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'confirmed');
        });
        return res.json(true);
    } else {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'still not confirmed');
        return res.json(false);
    }
};

exports.pseudopay = function(req, res) { //TODO actual payment callbacks for each method
    if (!req.activation.isPaid) {
        return req.activation.update(
            {
                isPaid: true
            }
        ).then(function () {
            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'pseudopayment received');
        });
    }
};

exports.compile = function(req, res) {

    console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'compilation request');
    if (!req.activation.isConfirmed) {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'compilation refused');
        return res.json(false);
    }

    if (req.activation.isCompiled) {
        return res.download('./compiled/' + req.activation.id + '.exe', req.activation.id + '.exe', function(err){ //TODO proper exe retrieval
            if (err) {
                console.log(new Date().toISOString(), 'ERROR', err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'activation file sent');
            }
        });
    } else {

        var fs = require('fs'),
            parseString = require('xml2js').parseString,
            xml2js = require('xml2js');

        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'reading project files');
        fs.readFile('./sources/testform/Properties/Resources.resx', 'utf-8', function (err, data){ //TODO proper project folder
            if(err) console.log(err);
            // we log out the readFile results
            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'project resourses loaded');
            // we then pass the data to our method here
            parseString(data, function(err, result){
                if(err) console.log(err);
                // here we log the results of our xml string conversion
                console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'parsing project resourses');

                var json = result;

                json.root.data[0].value = req.activation.id.toString();
                console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'injecting project resourses');

                // create a new builder object and then convert
                // our json back to xml.
                var builder = new xml2js.Builder();
                var xml = builder.buildObject(json);
                fs.writeFile('./sources/testform/Properties/Resources.resx', xml, function(err, data){ //TODO proper project folder
                    if (err) console.log(err);

                    console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'project resourses updated');


                    const spawn = require('child_process').spawn;
                    const xbuild = spawn('xbuild', [ //xbuild /p:Configuration=Release ./sources/testform/*.csproj
                        '/p:Configuration=Release',
                        '/p:OutputPath=../../compiled/' + req.activation.id + '/',
                        './sources/testform/TestWinFormsApp.csproj' //TODO proper project folder
                    ]);
                    console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'compilation begin');
                    /*xbuild.stdout.on('data', function (data) {
                        console.log(new Date().toISOString(), 'ERROR', '- child process stderr:', data.toString());
                    });*/
                    xbuild.on('close', function (code) {
                        if (code !== 0) {
                            console.log(new Date().toISOString(), 'CRITICAL', 'compiler exited with code', code);
                            return res.status(500).send({
                                message: 'Server Error - Activation failed. Try again later'
                            });
                        } else {
                            console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'compilation complete');
                            return req.activation.update(
                                {
                                    isCompiled: true
                                }
                            ).then(function () {
                                return res.download('./compiled/' + req.activation.id + '/TestWinFormsApp.exe', req.activation.id + '.exe', function(err){ //TODO proper exe name
                                    if (err) {
                                        console.log(new Date().toISOString(), 'ERROR', err);
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(err)
                                        });
                                    } else {
                                        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'activation file sent');
                                    }
                                });
                            });
                        }
                    });
                });

            });
        });


    }
};

exports.complete = function(req, res) {

    console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'installer closed');

    if (!req.activation.isConfirmed) {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'installation is aborted');
        return res.json(false);
    }

    req.activation.update(
        {
            isDone: true
        }
    ).then(function () {
        console.log(new Date().toISOString(), req.activation.productId, req.activation.id, 'installation is complete');
    });
    return res.json(true);
};

exports.update = function(req, res) {
    var activation = req.activation;
    activation.update(req.body).then(function(activation) {
        console.log(new Date().toISOString(), '- updating', req.activation.id, " with:", req.body);
        return res.json(activation);
    }).catch(function(err) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

exports.delete = function(req, res) {
    var activation = req.activation;

    Activation.findById(activation.id).then(function(activation) {
        if (activation) {
            return activation.destroy().then(function() {
                console.log(new Date().toISOString(),'- deleting:', req.activation.id);
                return res.json(activation);
          }).catch(function(err) {
              return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
              });
          });

        } else {
            return res.status(400).send({
                message: 'Unable to find the activation'
            });
        }
    }).catch(function(err) {
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

exports.list = function(req, res) {
    Activation.findAll().then(function(activations) {
        if (!activations) {
            activations = [];
        }
        res.json(activations);
    }).catch(function(err) {
        res.jsonp(err);
    });
};

exports.activationByID = function(req, res, next, id) {

    var isUUID = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    if (isUUID.test(id) === false) {
        return res.status(404).send({
            message: 'Invalid activation key'
        });
    }

    Activation.find({
        where: {
            id: id
        },
        include: [{ all: true }]
    }).then(function(activation) {
        if (!activation) {
            return res.status(404).send({
                message: 'Invalid activation key'
            });
        } else {
            req.activation = activation;
            next();
        }
    }).catch(function(err) {
        return next(err);
    });

};

exports.paymentByID = function(req, res, next, id) {

    if ((id % 1 === 0) === false) { //check if it's integer
        return res.status(400).send({
            message: 'Method is invalid'
        });
    }

    if (!req.activation.methods) {
        return res.status(500).send({
            message: 'Activation has no methods'
        });
    } else {
        if (!req.activation.methods.some(
            function (method) {
                return method.id === +id;
            })
        ) {
            return res.status(404).send({
                message: 'Activation payment method is invalid'
            });
        } else {
            req.activation.chosenMethod = id;
            next();
        }
    }
};

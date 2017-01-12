"use strict";

module.exports = function (sequelize, DataTypes) {

    var Paymethod = sequelize.define('paymethod', {
        link: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            comment: 'url to payment page'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            comment: 'text description when image is unavailable'
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'BASE64 of image of method'
        },
        agreement: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'agreement document of method'
        }
    }, {
        timestamps: true,
        associate: function (models) {
            Paymethod.belongsToMany(models.activation, {
                through: models.activationpaymethod
            });
        }
    });

    return Paymethod;
};

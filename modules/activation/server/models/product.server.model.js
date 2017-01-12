"use strict";

module.exports = function (sequelize, DataTypes) {

    var Product = sequelize.define('product', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Value specifying name of the product'
        },
        version: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Value specifying actual version of the product'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            comment: 'Detailed description of the product, and additional information, ex. changelog'
        },
        icon: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'BASE64 of icon of the product'
        }
    }, {
        timestamps: true,
        associate: function (models) {
            Product.hasMany(models.activation);
        }
    });

    return Product;
};

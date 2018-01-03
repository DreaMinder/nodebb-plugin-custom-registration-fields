"use strict";

var customFields = {
        specialty : "",
        phone : ""
    },
    customData = [],
    user = module.parent.require('./user'),
    db = module.parent.require('./database'),
    plugin = {};

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers;
		
	app.get('/admin/custom-registration-fields', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/custom-registration-fields', renderAdmin);

	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/custom-registration-fields',
		icon: 'fa-tint',
		name: 'Custom Registration Fields'
	});

	callback(null, header);
};

plugin.customHeaders = function(headers, callback) {
    for(var key in customFields) {

        switch(key) {
              
            case 'specialty':
                var label = "Вид деятельности";
                break;
            
            case 'phone':
                var label = "Номер телефона";
                break;
        }
        
        headers.headers.push({
            label: label
        });
    }

    callback(null, headers);
};

plugin.customFields = function(params, callback) {    
    var users = params.users.map(function(user) {

        if (!user.customRows) {
            user.customRows = [];

            for(var key in customFields) {
                user.customRows.push({value: customFields[key]});
            }
        }

        return user;
    });

    callback(null, {users: users});
};

plugin.addField = function(params, callback) {
    for(var key in customFields) {
        
        if (key == "") {
            callback(null, params);
            return;
        }

        switch(key) {

            case 'specialty':
                var html = '<input class="form-control" type="text" name="specialty" id="specialty" placeholder="Введите область своей деятельности"><span class="custom-feedback" id="npi-notify"></span>';
                var label = "Вид деятельности";
                break;
            
            case 'phone':
                var html = '<input class="form-control" type="text" name="phone" id="phone" placeholder="Введите номер телефона"><span class="custom-feedback" id="npi-notify"></span>';
                var label = "Номер телефона";
                break;
        }

        var captcha = {
            label: label,
            html: html
        };

        if (params.templateData.regFormEntry && Array.isArray(params.templateData.regFormEntry)) {
            params.templateData.regFormEntry.push(captcha);
        } else {
            params.templateData.captcha = captcha;
        }
    }

    callback(null, params);
};

plugin.checkField = function(params, callback) {
    var userData = params.userData;
    var error = null;

    for(var key in customFields) {

        var value = userData[key];

        if (key == 'npi') {
            if (value.length != 10) {
                error = {message: 'NPI # must be 10 digits'};
            }
            else if (!/^[0-9]+$/.test(value)) {
                error = {message: 'NPI # must be a numerical value'};
            }
        }

        else if (value == "" || value == undefined) {
            error = {message: 'Please complete all fields before registering.'};
        }
    }

    callback(error, params);
};

plugin.creatingUser = function(params, callback) {
    customData = params.data.customRows;

    callback(null, params);
};

plugin.createdUser = function(params) {
    var addCustomData = {
        specialty : customData[0].value,
        phone : customData[1].value
    }

    var keyID = 'user:' + params.uid + ':ns:custom_fields';

    db.setObject(keyID, addCustomData, function(err) {
        if (err) {
            return callback(err);
        }
    });
};

plugin.addToApprovalQueue = function(params, callback) {
    var data = params.data;
    var userData = params.userData;

    data.customRows = [];

    for (var key in customFields) {

        switch(key) {

            case 'specialty':
                var fieldData = params.userData['specialty'];
                break;
            
            case 'phone':
                var fieldData = params.userData['phone'];
                break;
        }
        
        customFields[key] = fieldData;
        data.customRows.push({value: customFields[key]});
    }

    callback(null, {data: data, userData: userData});
};

function renderAdmin(req, res, next) {
	res.render('admin/custom-registration-fields', {fields: customFields});
}

module.exports = plugin;

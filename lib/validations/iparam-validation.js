/*

Copyright (C) 2016 Freshdesk, Inc.

This source code is a part of the Freshdesk SDK and is covered by the our license
terms. For details about this license, please read the LICENSE.txt which is
bundled with this source code.

*/

'use strict';

var iParamUtil = require('../utils/iparam-util');
var _ = require('underscore');
var validationConst = require('./constants').validationContants;

var VALID_KEYS = ["display_name", "description", "type", "required",
  "default_value", "options"
];
var DROPDOWN = "dropdown";
var TEXT = "text";
var OPTIONS = "options";
var DEFAULT_VALUE = "default_value";
var TYPE = "type";
var MANDATORY_LANG = "en";
var MANDATORY_KEYS = ['display_name', 'description', 'type'];

/*
  Validate iparam files.
*/

function dropDownOptionsValidator() {
  var langs = iParamUtil.getIparamLangs();
  var errs = [];
  for (var i in langs) {
    var content = iParamUtil.getConfig(langs[i]);
    if (content) {
      errs.push(ValidateKeys(langs[i], content));
    }
  }
  return _.flatten(errs);
}

function ValidateKeys(lang, langcontent) {
  var err = [];
  for (var key in langcontent) {
    if (langcontent[key][TYPE] !== DROPDOWN) {
      continue;
    }
    if (!(DEFAULT_VALUE in langcontent[key])) {
      err.push(
        `default_value must be specified for type dropdown in iparam_${lang}.yml.`
      );
    }
    if (!(OPTIONS in langcontent[key])) {
      err.push(
        `Options must be specified for type dropdown in iparam_${lang}.yml.`);
      continue;
    }
    if (!Array.isArray(langcontent[key][OPTIONS])) {
      err.push(
        `Dropdown options for '${key}' in iparam_${lang}.yml are not in the list format.`
      );
      continue;
    }
    if (langcontent[key][DEFAULT_VALUE] && !(_.contains(langcontent[key][
        OPTIONS
      ], langcontent[key][DEFAULT_VALUE]))) {
      err.push(
        `Default value specified for '${key}' in iparam_${lang}.yml is not specified in the options.`
      );
    }
  }
  return err;
}

function keyConsistencyValidator() {
  var iparamKeys = iParamUtil.getAllIparamKeys();
  for (var i = 0; i < (iparamKeys.length - 1); i++) {
    if (!_.isEqual(iparamKeys[i], iparamKeys[i + 1])) {
      return ("Inconsistent keys detected among iparam files.");
    }
  }
}

function iparamKeysValidator() {
  var err = [];
  var langs = iParamUtil.getIparamLangs();
  if (!(_.contains(langs, MANDATORY_LANG))) {
    return `iparam_${MANDATORY_LANG}.yml is mandatory.`;
  }
  for (var i in langs) {
    var configs = iParamUtil.getConfig(langs[i]);
    if (configs) {
      err.push(checkValidKeys(langs[i], configs));
    }
  }
  return err;
}

function checkValidKeys(lang, content) {
  var errs = [];
  var keywordsUsed = _.intersection(VALID_KEYS, Object.keys(content));
  if (keywordsUsed.length > 0) {
    return `Reserved keywords ${keywordsUsed} used as keys in iparam_${lang}.yml.`;
  }
  for (var key in content) {
    var missingKeys = _.difference(MANDATORY_KEYS, _.keys(content[key]));
    if (!(_.isObject(content[key])) || missingKeys.length > 0) {
      errs.push(
        `Mandatory key(s) ${missingKeys} missing for ${key} in iparam_${lang}.yml.`
      );
    }
    if (!(content[key][TYPE] === TEXT || content[key][TYPE] === DROPDOWN)) {
      errs.push(
        `Invalid type '${content[key][TYPE]}' found in iparam_${lang}.yml.`);
    }
    if (_.difference(Object.keys(content[key]), VALID_KEYS).length > 0) {
      errs.push(`Invalid keys in iparam_${lang}.yml `);
    }
    if (content[key][TYPE] === TEXT) {
      if (OPTIONS in content[key]) {
        errs.push(
          `Options must not be specified for type text in iparam_${lang}.yml for '${key}'.`
        );
      }
    }
  }
  return errs;
}

module.exports = {
  validate: function() {
    var errMsgs = [];
    errMsgs.push(iparamKeysValidator());
    errMsgs.push(dropDownOptionsValidator());
    errMsgs.push(keyConsistencyValidator());
    errMsgs = _.compact(_.flatten(errMsgs));
    return errMsgs;
  },

  validationType: [validationConst.PRE_PKG_VALIDATION]
};

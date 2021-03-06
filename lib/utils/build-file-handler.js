/*

Copyright (C) 2016 Freshdesk, Inc.

This source code is a part of the Freshdesk SDK and is covered by the our license
terms. For details about this license, please read the LICENSE.txt which is
bundled with this source code.

*/

'use strict';

var eh = require('./err');
var contentUnifier = require('../unifier');
var fileUtil = require('./file-util');
var BUILD = "build";

var cwd = process.cwd();
var buildDirPath = cwd + '/build';
var buildFilePath = cwd + "/build/index.html";
var buildErrorMsg = "Error while generating build file.";

/*
  Generate build file(index.html).
*/

module.exports = {
  genBuildFile: function genBuildFile() {
    try {
      var unifiedData = contentUnifier.unify(BUILD);
      fileUtil.ensureFile(buildFilePath);
      fileUtil.writeFile(buildFilePath, unifiedData);
      return;
    }
    catch (err) {
      eh.error(new Error(buildErrorMsg));
    }
  },

  delBuildDir: function() {
      return fileUtil.deleteFile(buildDirPath);
  }
};

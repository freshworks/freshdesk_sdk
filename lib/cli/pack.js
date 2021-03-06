/*

Copyright (C) 2016 Freshdesk, Inc.

This source code is a part of the Freshdesk SDK and is covered by the our license
terms. For details about this license, please read the LICENSE.txt which is
bundled with this source code.

*/

'use strict';

var _ = require('underscore');
var fs = require('fs-extra');
var archiver = require('archiver');
var eh = require('../utils/err');
var buildFile = require('../utils/build-file-handler');
var digestFile = require('../utils/digest-file-handler');
var nsUtil = require('../utils/ns-resolver');
var fileUtil = require('../utils/file-util');
var validator = require('./validate');
var validationConst = require('../validations/constants').validationContants;

var zip = archiver('zip');
var pkgErrorMsg = "Error while generating package.";
var cwd = process.cwd();
var pkgName = `${nsUtil.getRootFolder()}${nsUtil.pkgExt}`;

/*
  Zip project files to zip under dist folder.
*/

// Returns the files to be zipped
function getFilesToZip() {
  var filesToZip = [];
  var sourceDirs = ['./app', './build', './config'];
  var sourceFiles = ['./digest.md5', './manifest.yml'];
  var assetsFolderPath = process.cwd() + '/assets/';
  if (fileUtil.fileExists(assetsFolderPath)) {
    sourceDirs.push('./assets');
  }
  for (var dir of sourceDirs) {
    var files = fileUtil.readDir(dir);
    files = files.filter(fileUtil.removeJunkFiles);
    files = files.map(function(el) {
      return `${dir}/${el}`;
    });
    filesToZip.push(files);
  }
  filesToZip = _.union(filesToZip, sourceFiles);
  return _.flatten(filesToZip);
}

// Packages the SDK project to zip file
function zipPackage(output) {
  output.on('close', function(err) {
    if (err) {
      cleanFiles(true);
      eh.error(new Error("Error while creating package."));
    }

    var postPkgValidation = validator.run(validationConst.POST_PKG_VALIDATION);
    if (!postPkgValidation) {
      cleanFiles(true);
      eh.error(new Error("Package failed due to above errors"));
    }
    if (global.verbose) { console.log(`Packaged to dist/${pkgName}`); }
    cleanFiles();
  });
  zip.on('error', function() {
    cleanFiles(true);
    eh.error(new Error(pkgErrorMsg));
  });
  zip.pipe(output);
  zip.bulk([
    { expand: true,
      cwd: process.cwd(),
      src: getFilesToZip() }
  ]);
  zip.finalize();
}

function cleanFiles(err) {
  buildFile.delBuildDir();
  digestFile.delDigestFile();
  if (err) { fileUtil.deleteFile(cwd + "/dist"); }
}

module.exports = {
  run: function() {
    try {
      var prePkgValidation = validator.run(validationConst.PRE_PKG_VALIDATION);
      if (!prePkgValidation) {
        eh.error(new Error("Package failed due to above errors"));
      }
      var dest = cwd + `/dist/${pkgName}`;
      fileUtil.ensureFile(dest);
      var output = fs.createWriteStream(dest);
      buildFile.genBuildFile();
      digestFile.genDigestFile();
      zipPackage(output);
    }
    catch (err) {
      eh.error(err);
    }
  }
};

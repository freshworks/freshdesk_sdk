/* 

Copyright (C) 2016 Freshdesk, Inc.

This source code is a part of the Fresh SDK and is covered by the our license
terms. For details about this license, please read the LICENSE.txt which is 
bundled with this source code.

*/

var fs = require('fs-extra');
var emptyDir = require('empty-dir');

var gitignore = ['dist', 'work', 'build'].join("\n");

module.exports = {
  run: function(dir) {
    var prjDir = dir? dir: process.cwd();
    if (!fs.existsSync(prjDir)) {
      fs.mkdirSync(prjDir);
      if (global.verbose) {
        console.log("Created project directory: " + prjDir);
      }
    }
    if (!emptyDir.sync(prjDir)) {
      console.error('Could not initialize as the project directory is not empty.');
      process.exit(1);
    }

    // Copy from project template:
    fs.copySync(__dirname + '/../../template/plug', prjDir);
    fs.writeFileSync(`${prjDir}/.gitignore`, gitignore + "\n");
    if (global.verbose) {
      console.log('Initialized project directory: ' + prjDir);
    }
  }
};
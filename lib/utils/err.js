/*

Copyright (C) 2016 Freshdesk, Inc.

This source code is a part of the Freshdesk SDK and is covered by the our license
terms. For details about this license, please read the LICENSE.txt which is
bundled with this source code.

*/

'use strict';

/*
  Handler for SDK errors.
*/

module.exports = {
  error: function(error, exitStatus) {
    if (undefined === exitStatus) {
      exitStatus = 1;
    }
    if (global.trace) {
      throw error;
    }
    else {
      console.error(error.message);
    }
    process.exit(exitStatus);
  }
};
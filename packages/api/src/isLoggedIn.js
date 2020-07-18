// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const moment = require('moment');

function isLoggedIn (req, res, next) {
  console.log('AUTH MIDDLEWARE');
  console.log('SESSION: ' + JSON.stringify(req.session));
  if (req.session && req.session.expires != null && moment().isBefore(moment(req.session.expires))) {
    console.log('AUTHENTICATED');
    next();
  } else {
    console.log('NON AUTHENTICATED');
    // req.session.destroy();
    res.status(401).send('Unauthorized');
  }
}

// tester function
function greet (name) {
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var now = new Date();
  var formattedDate = now.toLocaleDateString('en-US', options);
  return `Hello, ${name}! Today is ${formattedDate}`;
}

module.exports = { isLoggiedIn: isLoggedIn };
module.exports.isLoggedIn = isLoggedIn;

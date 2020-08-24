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

const { handleError, UnauthorizedError } = require('./errors');

module.exports = (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization;
    if (token === process.env.PRIVATE_POSTING_TOKEN) {
      return next();
    } else {
      throw new UnauthorizedError('authorization required');
    }
  } catch (err) {
    handleError(res, err);
  }
};

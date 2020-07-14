
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

class InvalidParameterError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
class ResourceNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

function handleError (res, err) {
  if (err instanceof InvalidParameterError) {
    res.status(400).send({ error: 'Bad Request' });
  } else if (err instanceof ResourceNotFoundError) {
    res.status(404).send({ error: 'Not Found' });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).send({ error: 'Unauthorized' });
  } else {
    console.error(err.stack);
    res.status(500).send({ error: 'Unknown Error' });
  }
}

module.exports = {
  InvalidParameterError,
  ResourceNotFoundError,
  UnauthorizedError,
  handleError
};

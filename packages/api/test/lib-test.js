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

const firebaseEncode = require('../lib/firebase-encode.js');
const { describe, it } = require('mocha');
const assert = require('assert');

describe('Library Functions', () => {
  it('FirebaseEncode works', () => {
    const inputStr = '02/10/2013.$[]#/%234@#$%^&*0];:"`\\=/?+|  _-!()\'';
    const outputStr = firebaseEncode(inputStr);
    const reversed = decodeURIComponent(outputStr);

    '*.[]`'.split('').forEach(forbidden => {
      assert(!outputStr.includes(forbidden)); // does not contain bad characters
    });

    assert.strictEqual(reversed, inputStr); // can be reversed
  });
});

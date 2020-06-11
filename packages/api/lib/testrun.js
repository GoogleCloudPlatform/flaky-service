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

class TestCaseRun {
  constructor (okMessage, number, name) {
    this.successful = (okMessage === 'ok');
    this.number = number;
    this.name = name;
    this.encodedName = encodeURIComponent(this.name);
    this.failureMessage = 'TODO ERROR MESSAGE, (e.g. stackoverflow error line 13)';
  }

  display () {
    return this.number + ', ' + this.name + ', ' + this.time + ', ' + (this.successful ? '1' : '0');
  }
}

module.exports = TestCaseRun;

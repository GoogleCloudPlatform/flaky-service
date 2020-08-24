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

const assert = require('assert');
const firebaseEncode = require('./firebase-encode');

function buildInfo (metadata) {
  const [org, repo] = metadata.repo.split('/');
  return {
    repoId: firebaseEncode(decodeURIComponent(repo)),
    organization: org,
    timestamp: new Date(),
    environment: {
      matrix: '{"kokoro":""}',
      os: 'Linux',
      ref: metadata.commit,
      tag: 'None'
    },
    sha: metadata.commit,
    name: metadata.repo,
    description: '',
    buildmessage: ''
  };
}

module.exports = (pubsubPayload) => {
  assert(pubsubPayload.message, 'pubsub payload did not contain message field');
  assert(pubsubPayload.message.data, 'pubsub payload did not contain message.data field');
  const metadata = JSON.parse(Buffer.from(pubsubPayload.message.data, 'base64').toString('utf8'));
  const xml = Buffer.from(metadata.xunitXML, 'base64').toString('utf8');
  return {
    xml,
    buildInfo: buildInfo(metadata)
  };
};

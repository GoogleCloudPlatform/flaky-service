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
//
/* global test, expect */

import React from 'react';
import App from '../src/app';
import renderer from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import nock from 'nock';

const DELAY = 25;
nock.disableNetConnect();

test('renders login button if authorize URL can be fetched', done => {
  const request = nock('http://127.0.0.1:4000')
    .get('/login/github')
    .reply(200, {
      authorization_url: 'http://www.github.com//login/oauth/authorize'
    });
  const component = renderer.create(
    <MemoryRouter initialEntries={['/']}>
      <App/>
    </MemoryRouter>
  );
  setTimeout(() => {
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    request.done();
    return done();
  }, DELAY);
});

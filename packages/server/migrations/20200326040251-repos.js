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
'use strict';

exports.up = async function (db) {
  await db.createTable('repos_github', {
    full_name: {type: 'text', primaryKey: true},
    user: {type: 'text'},
    org: {type: 'text'}
  });
  await db.addForeignKey('repos_github', 'users_github', 'repos_users_github_user_fk', {
    user: 'login'
  }, {onDelete: 'CASCADE'});
  await db.addForeignKey('repos_github', 'orgs_github', 'repos_orgs_github_org_fk', {
    org: 'name'
  }, {onDelete: 'CASCADE'});
};

exports.down = async function (db) {
  await db.dropTable('repos_github');
};

exports._meta = {
  version: 1
};

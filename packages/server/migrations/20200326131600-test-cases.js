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
  await db.runSql('CREATE TYPE type AS ENUM (\'success\', \'failure\');');
  await db.runSql(`CREATE type run AS (
		type  type,
		time  timestamp,
		run_time  decimal
	)`);
  await db.createTable('test_cases', {
    id: {type: 'int', primaryKey: true, autoIncrement: true},
    repo_full_name: {type: 'text', notNull: true},
    suite: {type: 'text'},
    classname: {type: 'text'},
    name: {type: 'text', notNull: true},
    success: {type: 'int', defaultValue: 0},
    failure: {type: 'int', defaultValue: 0},
    failure_message: {type: 'text'},
    last_run_time: {type: 'decimal'},
    flaky: {type: 'boolean', defaultValue: false},
    failing: {type: 'boolean', defaultValue: false},
    runs: {type: 'run[]'}
  });
  await db.addForeignKey('test_cases', 'repos_github', 'test_cases_repos_github_fk', {
    repo_full_name: 'full_name'
  }, {onDelete: 'CASCADE'});
  await db.addIndex('test_cases', 'repo_full_name_suite_classname_name_idx', ['repo_full_name', 'suite', 'classname', 'name'], true);
};

exports.down = async function (db) {
  await db.dropTable('test_cases');
  await db.runSql('DROP TYPE run CASCADE');
  await db.runSql('DROP TYPE type CASCADE');
};

exports._meta = {
  version: 1
};

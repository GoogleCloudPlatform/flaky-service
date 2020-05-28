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
const {Client} = require('pg');
const dbSettings = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'flaky_dev_test'
};
if (process.env.POSTGRES_PASSWORD) {
  dbSettings.password = process.env.POSTGRES_PASSWORD;
}

const client = new Client(dbSettings);
const {execSync} = require('child_process');
const output = execSync('npm run migrate:up');
console.info(output.toString('utf8'));

let connected = false;
module.exports = {
  before: async () => {
    if (!connected) {
      await client.connect();
      connected = true;
    }

    await client.query('BEGIN');
  },
  after: async () => {
    await client.query('ROLLBACK');
  },
  end: async () => {
    await client.end();
  },
  client
};

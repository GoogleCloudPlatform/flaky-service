#!/usr/bin/env node
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

// This script can be used to insert testing data (potentially from
// ./test/fixtures) for testing the interface:
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const {readFileSync} = require('fs');

const pg = require('pg');
const dbSettings = require('../database')[process.env.NODE_ENV || 'development'];
const pool = new pg.Pool(dbSettings);
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL ? Number(process.env.LOG_LEVEL) : 'info'
});

const upsertTestSuite = require('../lib/upsert-test-suite');

require('yargs')
  .command('user <login>', 'creat a user entry', yargs => {
    yargs.positional('login', {
      type: 'string',
      describe: 'user’s login'
    });
  }, async argv => {
    const client = await pool.connect();
    await client.query({
      text: 'INSERT INTO users_github(login) VALUES ($1)',
      values: [argv.login]
    });
    logger.info(`inserting user ${argv.login}`);
    process.exit(0);
  })
  .command('repo <owner> <name>', 'create a repo entry', yargs => {
    yargs
      .positional('owner', {
        type: 'string',
        describe: 'owner of repo, should correspond to ’login’'
      })
      .positional('name', {
        type: 'string',
        describe: 'name of repository'
      });
  }, async argv => {
    const fullName = `${argv.owner}/${argv.name}`;
    const client = await pool.connect();
    await client.query({
      text: 'INSERT INTO repos_github(full_name) VALUES ($1)',
      values: [fullName]
    });
    logger.info(`creating repo ${fullName}`);
    process.exit(0);
  })
  .command('xunit <owner> <name> <file>', 'given an xunit file, insert entries into DB', yargs => {
    yargs
      .positional('owner', {
        type: 'string',
        describe: 'owner of repo, should correspond to ’login’'
      })
      .positional('name', {
        type: 'string',
        describe: 'name of repository'
      })
      .positional('file', {
        type: 'string',
        describe: 'xunit file to import test cases from'
      });
  }, async argv => {
    const fullName = `${argv.owner}/${argv.name}`;
    const client = await pool.connect();
    const xml = readFileSync(argv.file, 'utf8');
    logger.info(`inserting test cases for ${fullName}`);
    await upsertTestSuite(fullName, await parser.parseStringPromise(xml), client);
    process.exit(0);
  })
  .strictCommands()
  .demandCommand(1)
  .parse();

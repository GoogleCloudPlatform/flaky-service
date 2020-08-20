
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

const functions = require('firebase-functions');
const repo = require('../api/src/repository');

/**
 * Run once a day at midnight, to cleanup the tickets
 * Manually run the task here https://console.cloud.google.com/cloudscheduler
 */
// exports.ticketCleanup = functions.pubsub.schedule('every day 00:00').onRun(async context => {
exports.ticketCleanup = functions.pubsub.schedule('every 20 seconds').onRun(async context => {
	repo.deleteAllTickets();
	console.log('Ticket cleanup finished');
});
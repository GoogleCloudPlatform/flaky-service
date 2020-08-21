
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
const Firestore = require('@google-cloud/firestore');

class TicketCleanup {
	async deleteAllTickets (collectionRef) {
		const query = collectionRef.orderBy('__name__').limit(50);

		return new Promise((resolve, reject) => {
			this.deleteQueryBatch(query, resolve).catch(reject);
		});
	}

	async deleteQueryBatch (query, resolve) {
		const snapshot = await query.get();
		const batchSize = snapshot.size;
		if (batchSize === 0) {
			// When there are no documents left, we are done
			resolve();
			return;
	    }

	    // Delete documents in a batch
	    const batch = client.batch();
	    snapshot.docs.forEach((doc) => {
	    	batch.delete(doc.ref);
	    });
	    await batch.commit();

	    // Recurse on the next process tick, to avoid
	    // exploding the stack.
	    process.nextTick(() => {
	    	this.deleteQueryBatch(query, resolve);
	    });
	}
}

/**
 * Run once a day at midnight, to cleanup the tickets
 * Manually run the task here https://console.cloud.google.com/cloudscheduler
 */
exports.ticketCleanup = functions.pubsub.schedule('every day 00:00').onRun(async context => {
	const id = process.env.FLAKY_DB_PROJECT || 'flaky-dev-development';

	const client = new Firestore({
	  projectId: id
	});

	const collectionRef = client.collection('tickets');
	
	TicketCleanup.deleteAllTickets();
	console.log('Ticket cleanup finished');
});
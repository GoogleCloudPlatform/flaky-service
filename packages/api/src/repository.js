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

const moment = require('moment');
const client = require('./firestore.js');

class Repository {
  async createDoc (identifier, params) {
    // TODO: DANGER we should have validation and what not at some point
    // before we do this, probably before this is called by the server too.
    return client.doc(identifier).set(params);
  }

  async getDoc (identifier) {
    const document = await client.doc(identifier).get();
    if (!document.exists) {
      return null;
    }
    return document.data();
  }

  async getCollection (identifier) {
    const result = [];
    const snapshot = await client.collection(`${identifier}`).get();
    if (snapshot.empty) {
      return result;
    }
    snapshot.forEach(doc => {
      const entry = doc.data();
      result.push(entry);
    });
    return result;
  }

  async mayAccess (platform, login) {
    const collection = client.collection('permitted-users/' + platform + '/users').where('login', '==', login);

    const querySnapshot = await collection.get();
    return (querySnapshot.size === 1);
  }

  async sessionPermissions (sessionID) {
    const docRef = client.doc('express-sessions/' + sessionID);
    const solution = { permitted: false, expiration: null, login: null };
    const doc = await docRef.get();
    let data;
    try {
      data = await JSON.parse(doc.data().data);
    } catch (err) {
      return solution;
    }
    if (doc.exists) {
      const expiration = data.expires;
      if (expiration == null) {
        return solution;
      }
      if (moment().isBefore(moment(expiration))) {
        solution.permitted = true;
        solution.expiration = moment(expiration).format();
        solution.login = data.user;
      }
    }
    return solution;
  }

  async deleteDoc (path) {
    const document = client.doc(path);
    return document.delete();
  }

  async deleteQueryBatchExpired (query, resolve) {
    const snapshot = await query.get();
    console.log("NUM DOCS: " + snapshot.size);

    const batchSize = snapshot.size;
    if (batchSize === 0) {
    // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = client.batch();
    await snapshot.docs.forEach(async (doc) => {
      console.log("DATA: " + doc.data().data);
      const data = await JSON.parse(doc.data().data);
      const expiration = data.expires;
      if(expiration == null || moment().isAfter(moment(expiration))) {
        console.log("DELETE IT!");
        batch.delete(doc.ref);
      }
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      this.deleteQueryBatchExpired(query, resolve);
    });
  }

  async deleteExpiredSessions() {
    console.log("DELETE EXPIRED");
    const collectionRef = client.collection('express-sessions');
    const snapshot = await collectionRef.get();
    // const query = collectionRef.where(data.expires==null || moment().isAfter(moment(data.expires))).orderBy('__name__').limit(100);

    console.log("NUM DOCS: " + snapshot.size);

    // Delete documents in a batch
    const batch = client.batch();
    await snapshot.docs.forEach(async (doc) => {
      console.log("DATA: " + doc.data().data);
      const data = await JSON.parse(doc.data().data);
      const expiration = data.expires;
      if(expiration == null || moment().isAfter(moment(expiration))) {
        console.log("DELETE IT!");
        batch.delete(doc.ref);
      }
    });
    await batch.commit();
  }
}

module.exports = Repository;

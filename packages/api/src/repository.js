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

const client = require('./firestore.js');
const deleter = require('../lib/deleter.js');

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

  async storeTicket (ticketToPerform) {
    return this.createDoc(`tickets/${ticketToPerform.state}`, {
      ticket: ticketToPerform
    });
  }

  async getTicket (state) {
    const data = await this.getDoc(`tickets/${state}`);
    if (data === null) return null;
    return data.ticket;
  }

  allowedToPerformTicket (action, permission) {
    if (action === 'delete-repo') {
      return permission === 'admin';
    }

    if (action === 'delete-test') {
      return permission === 'admin' || permission === 'write';
    }

    return false;
  }

  async performTicketIfAllowed (ticket, permission) {
    const permitted = this.allowedToPerformTicket(ticket.action, permission);

    if (permitted) {
      if (ticket.action === 'delete-test') {
        deleter.deleteTest(ticket.fullName, ticket.testName, client);
      } else if (ticket.action === 'delete-repo') {
        deleter.deleteRepo(client, ticket.fullName);
      } else {
        throw Error('invalid action');
      }
    }

    return permitted;
  }

  async deleteDoc (path) {
    const document = client.doc(path);
    return document.delete();
  }
}

const repoHandler = new Repository();
module.exports = repoHandler;

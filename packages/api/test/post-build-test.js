
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

const EXAMPLE_PAYLOAD = '{ "summary":{ "ok":true, "count":2, "pass":2, "fail":0, "bailout":false, "todo":0, "skip":0, "plan":{ "start":1, "end":2, "skipAll":false, "skipReason":"", "comment":"" }, "failures":[ ], "time":null }, "data":[ { "ok":true, "id":1, "name":"Testing Box should assert obj is instance of Box", "fullname":"" }, { "ok":true, "id":2, "name":"Testing Box should assert volume of the box to be 6000", "fullname":"" } ], "metadata":{ "github":{ "token":"***", "job":"build", "ref":"refs/heads/master", "sha":"8d1cfc0b10e6067439e84f8ac3f5b59c924fc041", "repository":"StuartRucker/mocha-chai-project", "repository_owner":"StuartRucker", "repositoryUrl":"git://github.com/StuartRucker/mocha-chai-project.git", "run_id":"136624057", "run_number":"28", "actor":"StuartRucker", "workflow":"Node.js CI", "head_ref":"", "base_ref":"", "event_name":"push", "event":{ "after":"8d1cfc0b10e6067439e84f8ac3f5b59c924fc041", "base_ref":null, "before":"28bbe64f89b3986c654da5438748dc9d11e9ea21", "commits":[ { "author":{ "email":"stuart.a.rucker@gmail.com", "name":"Stuart Rucker", "username":"StuartRucker" }, "committer":{ "email":"stuart.a.rucker@gmail.com", "name":"Stuart Rucker", "username":"StuartRucker" }, "distinct":true, "id":"8d1cfc0b10e6067439e84f8ac3f5b59c924fc041", "message":"rereun", "timestamp":"2020-06-15T17:45:04-07:00", "tree_id":"bbc8c4497cdc338452707a5d7912464b8fcf76a1", "url":"https://github.com/StuartRucker/mocha-chai-project/commit/8d1cfc0b10e6067439e84f8ac3f5b59c924fc041" } ], "compare":"https://github.com/StuartRucker/mocha-chai-project/compare/28bbe64f89b3...8d1cfc0b10e6", "created":false, "deleted":false, "forced":false, "head_commit":{ "author":{ "email":"stuart.a.rucker@gmail.com", "name":"Stuart Rucker", "username":"StuartRucker" }, "committer":{ "email":"stuart.a.rucker@gmail.com", "name":"Stuart Rucker", "username":"StuartRucker" }, "distinct":true, "id":"8d1cfc0b10e6067439e84f8ac3f5b59c924fc041", "message":"rereun", "timestamp":"2020-06-15T17:45:04-07:00", "tree_id":"bbc8c4497cdc338452707a5d7912464b8fcf76a1", "url":"https://github.com/StuartRucker/mocha-chai-project/commit/8d1cfc0b10e6067439e84f8ac3f5b59c924fc041" }, "pusher":{ "email":"Stuart.a.rucker@gmail.com", "name":"StuartRucker" }, "ref":"refs/heads/master", "repository":{ "archive_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/{archive_format}{/ref}", "archived":false, "assignees_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/assignees{/user}", "blobs_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/blobs{/sha}", "branches_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/branches{/branch}", "clone_url":"https://github.com/StuartRucker/mocha-chai-project.git", "collaborators_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/collaborators{/collaborator}", "comments_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/comments{/number}", "commits_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/commits{/sha}", "compare_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/compare/{base}...{head}", "contents_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/contents/{+path}", "contributors_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/contributors", "created_at":1592240751, "default_branch":"master", "deployments_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/deployments", "description":"This is a sample Mocha Chai testing project.", "disabled":false, "downloads_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/downloads", "events_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/events", "fork":true, "forks":0, "forks_count":0, "forks_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/forks", "full_name":"StuartRucker/mocha-chai-project", "git_commits_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/commits{/sha}", "git_refs_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/refs{/sha}", "git_tags_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/tags{/sha}", "git_url":"git://github.com/StuartRucker/mocha-chai-project.git", "has_downloads":true, "has_issues":false, "has_pages":false, "has_projects":true, "has_wiki":true, "homepage":"https://www.dyclassroom.com/mocha-chai/mocha-chai-introduction", "hooks_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/hooks", "html_url":"https://github.com/StuartRucker/mocha-chai-project", "id":272497629, "issue_comment_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues/comments{/number}", "issue_events_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues/events{/number}", "issues_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues{/number}", "keys_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/keys{/key_id}", "labels_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/labels{/name}", "language":"JavaScript", "languages_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/languages", "license":{ "key":"mit", "name":"MIT License", "node_id":"MDc6TGljZW5zZTEz", "spdx_id":"MIT", "url":"https://api.github.com/licenses/mit" }, "master_branch":"master", "merges_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/merges", "milestones_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/milestones{/number}", "mirror_url":null, "name":"mocha-chai-project", "node_id":"MDEwOlJlcG9zaXRvcnkyNzI0OTc2Mjk=", "notifications_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/notifications{?since,all,participating}", "open_issues":0, "open_issues_count":0, "owner":{ "avatar_url":"https://avatars3.githubusercontent.com/u/8007075?v=4", "email":"Stuart.a.rucker@gmail.com", "events_url":"https://api.github.com/users/StuartRucker/events{/privacy}", "followers_url":"https://api.github.com/users/StuartRucker/followers", "following_url":"https://api.github.com/users/StuartRucker/following{/other_user}", "gists_url":"https://api.github.com/users/StuartRucker/gists{/gist_id}", "gravatar_id":"", "html_url":"https://github.com/StuartRucker", "id":8007075, "login":"StuartRucker", "name":"StuartRucker", "node_id":"MDQ6VXNlcjgwMDcwNzU=", "organizations_url":"https://api.github.com/users/StuartRucker/orgs", "received_events_url":"https://api.github.com/users/StuartRucker/received_events", "repos_url":"https://api.github.com/users/StuartRucker/repos", "site_admin":false, "starred_url":"https://api.github.com/users/StuartRucker/starred{/owner}{/repo}", "subscriptions_url":"https://api.github.com/users/StuartRucker/subscriptions", "type":"User", "url":"https://api.github.com/users/StuartRucker" }, "private":false, "pulls_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/pulls{/number}", "pushed_at":1592268294, "releases_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/releases{/id}", "size":1634, "ssh_url":"git@github.com:StuartRucker/mocha-chai-project.git", "stargazers":0, "stargazers_count":0, "stargazers_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/stargazers", "statuses_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/statuses/{sha}", "subscribers_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/subscribers", "subscription_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/subscription", "svn_url":"https://github.com/StuartRucker/mocha-chai-project", "tags_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/tags", "teams_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/teams", "trees_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/trees{/sha}", "updated_at":"2020-06-16T00:42:52Z", "url":"https://github.com/StuartRucker/mocha-chai-project", "watchers":0, "watchers_count":0 }, "sender":{ "avatar_url":"https://avatars3.githubusercontent.com/u/8007075?v=4", "events_url":"https://api.github.com/users/StuartRucker/events{/privacy}", "followers_url":"https://api.github.com/users/StuartRucker/followers", "following_url":"https://api.github.com/users/StuartRucker/following{/other_user}", "gists_url":"https://api.github.com/users/StuartRucker/gists{/gist_id}", "gravatar_id":"", "html_url":"https://github.com/StuartRucker", "id":8007075, "login":"StuartRucker", "node_id":"MDQ6VXNlcjgwMDcwNzU=", "organizations_url":"https://api.github.com/users/StuartRucker/orgs", "received_events_url":"https://api.github.com/users/StuartRucker/received_events", "repos_url":"https://api.github.com/users/StuartRucker/repos", "site_admin":false, "starred_url":"https://api.github.com/users/StuartRucker/starred{/owner}{/repo}", "subscriptions_url":"https://api.github.com/users/StuartRucker/subscriptions", "type":"User", "url":"https://api.github.com/users/StuartRucker" } }, "server_url":"https://github.com", "api_url":"https://api.github.com", "graphql_url":"https://api.github.com/graphql", "workspace":"/home/runner/work/mocha-chai-project/mocha-chai-project", "action":"self", "event_path":"/home/runner/work/_temp/_github_workflow/event.json" }, "os":{ "os":"Linux", "tool_cache":"/opt/hostedtoolcache", "temp":"/home/runner/work/_temp", "workspace":"/home/runner/work/mocha-chai-project" }, "matrix":{ "node-version":"12.x" } } }';
const EXAMPLE_PAYLOAD_RAW = '{"type":"TAP","data":"1..2\\nok 1 Testing Box should assert obj is instance of Box\\nok 2 Testing Box should assert volume of the box to be 6000\\n# tests 2\\n# pass 2\\n# fail 0\\n","metadata":{"github":{"token":"***","job":"build","ref":"refs/heads/master","sha":"26d1a5469cbf4274b98577f1ac75e82b8e0abe7d","repository":"StuartRucker/mocha-chai-projectraw","repository_owner":"StuartRucker","repositoryUrl":"git://github.com/StuartRucker/mocha-chai-project.git","run_id":"138733652","run_number":"32","actor":"StuartRucker","workflow":"Node.js CI","head_ref":"","base_ref":"","event_name":"push","event":{"after":"26d1a5469cbf4274b98577f1ac75e82b8e0abe7d","base_ref":null,"before":"31f08ec41be29c949785439a9e399f69387b2a95","commits":[{"author":{"email":"stuart.a.rucker@gmail.com","name":"Stuart Rucker","username":"StuartRucker"},"committer":{"email":"stuart.a.rucker@gmail.com","name":"Stuart Rucker","username":"StuartRucker"},"distinct":true,"id":"26d1a5469cbf4274b98577f1ac75e82b8e0abe7d","message":"no longer buffer","timestamp":"2020-06-17T11:00:54-07:00","tree_id":"82273bb433386a2cd63ccf11be357f1173182eeb","url":"https://github.com/StuartRucker/mocha-chai-project/commit/26d1a5469cbf4274b98577f1ac75e82b8e0abe7d"}],"compare":"https://github.com/StuartRucker/mocha-chai-project/compare/31f08ec41be2...26d1a5469cbf","created":false,"deleted":false,"forced":false,"head_commit":{"author":{"email":"stuart.a.rucker@gmail.com","name":"Stuart Rucker","username":"StuartRucker"},"committer":{"email":"stuart.a.rucker@gmail.com","name":"Stuart Rucker","username":"StuartRucker"},"distinct":true,"id":"26d1a5469cbf4274b98577f1ac75e82b8e0abe7d","message":"no longer buffer","timestamp":"2020-06-17T11:00:54-07:00","tree_id":"82273bb433386a2cd63ccf11be357f1173182eeb","url":"https://github.com/StuartRucker/mocha-chai-project/commit/26d1a5469cbf4274b98577f1ac75e82b8e0abe7d"},"pusher":{"email":"Stuart.a.rucker@gmail.com","name":"StuartRucker"},"ref":"refs/heads/master","repository":{"archive_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/{archive_format}{/ref}","archived":false,"assignees_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/assignees{/user}","blobs_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/blobs{/sha}","branches_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/branches{/branch}","clone_url":"https://github.com/StuartRucker/mocha-chai-project.git","collaborators_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/collaborators{/collaborator}","comments_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/comments{/number}","commits_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/commits{/sha}","compare_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/compare/{base}...{head}","contents_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/contents/{+path}","contributors_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/contributors","created_at":1592240751,"default_branch":"master","deployments_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/deployments","description":"This is a sample Mocha Chai testing project.","disabled":false,"downloads_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/downloads","events_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/events","fork":true,"forks":0,"forks_count":0,"forks_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/forks","full_name":"StuartRucker/mocha-chai-project","git_commits_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/commits{/sha}","git_refs_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/refs{/sha}","git_tags_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/tags{/sha}","git_url":"git://github.com/StuartRucker/mocha-chai-project.git","has_downloads":true,"has_issues":false,"has_pages":false,"has_projects":true,"has_wiki":true,"homepage":"https://www.dyclassroom.com/mocha-chai/mocha-chai-introduction","hooks_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/hooks","html_url":"https://github.com/StuartRucker/mocha-chai-project","id":272497629,"issue_comment_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues/comments{/number}","issue_events_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues/events{/number}","issues_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/issues{/number}","keys_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/keys{/key_id}","labels_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/labels{/name}","language":"JavaScript","languages_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/languages","license":{"key":"mit","name":"MIT License","node_id":"MDc6TGljZW5zZTEz","spdx_id":"MIT","url":"https://api.github.com/licenses/mit"},"master_branch":"master","merges_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/merges","milestones_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/milestones{/number}","mirror_url":null,"name":"mocha-chai-project","node_id":"MDEwOlJlcG9zaXRvcnkyNzI0OTc2Mjk=","notifications_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/notifications{?since,all,participating}","open_issues":0,"open_issues_count":0,"owner":{"avatar_url":"https://avatars3.githubusercontent.com/u/8007075?v=4","email":"Stuart.a.rucker@gmail.com","events_url":"https://api.github.com/users/StuartRucker/events{/privacy}","followers_url":"https://api.github.com/users/StuartRucker/followers","following_url":"https://api.github.com/users/StuartRucker/following{/other_user}","gists_url":"https://api.github.com/users/StuartRucker/gists{/gist_id}","gravatar_id":"","html_url":"https://github.com/StuartRucker","id":8007075,"login":"StuartRucker","name":"StuartRucker","node_id":"MDQ6VXNlcjgwMDcwNzU=","organizations_url":"https://api.github.com/users/StuartRucker/orgs","received_events_url":"https://api.github.com/users/StuartRucker/received_events","repos_url":"https://api.github.com/users/StuartRucker/repos","site_admin":false,"starred_url":"https://api.github.com/users/StuartRucker/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/StuartRucker/subscriptions","type":"User","url":"https://api.github.com/users/StuartRucker"},"private":false,"pulls_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/pulls{/number}","pushed_at":1592416843,"releases_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/releases{/id}","size":1641,"ssh_url":"git@github.com:StuartRucker/mocha-chai-project.git","stargazers":0,"stargazers_count":0,"stargazers_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/stargazers","statuses_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/statuses/{sha}","subscribers_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/subscribers","subscription_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/subscription","svn_url":"https://github.com/StuartRucker/mocha-chai-project","tags_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/tags","teams_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/teams","trees_url":"https://api.github.com/repos/StuartRucker/mocha-chai-project/git/trees{/sha}","updated_at":"2020-06-17T17:58:15Z","url":"https://github.com/StuartRucker/mocha-chai-project","watchers":0,"watchers_count":0},"sender":{"avatar_url":"https://avatars3.githubusercontent.com/u/8007075?v=4","events_url":"https://api.github.com/users/StuartRucker/events{/privacy}","followers_url":"https://api.github.com/users/StuartRucker/followers","following_url":"https://api.github.com/users/StuartRucker/following{/other_user}","gists_url":"https://api.github.com/users/StuartRucker/gists{/gist_id}","gravatar_id":"","html_url":"https://github.com/StuartRucker","id":8007075,"login":"StuartRucker","node_id":"MDQ6VXNlcjgwMDcwNzU=","organizations_url":"https://api.github.com/users/StuartRucker/orgs","received_events_url":"https://api.github.com/users/StuartRucker/received_events","repos_url":"https://api.github.com/users/StuartRucker/repos","site_admin":false,"starred_url":"https://api.github.com/users/StuartRucker/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/StuartRucker/subscriptions","type":"User","url":"https://api.github.com/users/StuartRucker"}},"server_url":"https://github.com","api_url":"https://api.github.com","graphql_url":"https://api.github.com/graphql","workspace":"/home/runner/work/mocha-chai-project/mocha-chai-project","action":"self","event_path":"/home/runner/work/_temp/_github_workflow/event.json"},"os":{"os":"Linux","tool_cache":"/opt/hostedtoolcache","temp":"/home/runner/work/_temp","workspace":"/home/runner/work/mocha-chai-project"},"matrix":{"node-version":"12.x"}}}';
// NOTE: the distinction is just the github.repository so the testing doesnt collide

const { describe, before, after, it } = require('mocha');
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const firebaseEncode = require('../lib/firebase-encode');

const assert = require('assert');
const fetch = require('node-fetch');

describe('Posting Builds', () => {
  let client;
  before(async () => {
    client = new Firestore({
      projectId: process.env.FLAKY_DB_PROJECT || 'flaky-dev-development'
    });
    global.headCollection = 'repositories-testsuite-' + uuidv4();
  });

  it('should send back an error code when being sent invalid metadata', async () => {
    var botchedPayload = JSON.parse(EXAMPLE_PAYLOAD);
    delete botchedPayload.metadata.github.repositoryUrl;

    const resp = await fetch('http://127.0.0.1:3000/api/build', {
      method: 'post',
      body: JSON.stringify(botchedPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(resp.status, 400);
  });

  it('should send back an error code when being sent invalid test cases', async () => {
    var botchedPayload = JSON.parse(EXAMPLE_PAYLOAD);
    delete botchedPayload.data[0].name;

    const resp = await fetch('http://127.0.0.1:3000/api/buildparsed', {
      method: 'post',
      body: JSON.stringify(botchedPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(resp.status, 400);
  });

  it('it responds to a valid POST on the /postbuild path', async () => {
    const resp = await fetch('http://127.0.0.1:3000/api/buildparsed', {
      method: 'post',
      body: EXAMPLE_PAYLOAD,
      headers: { 'Content-Type': 'application/json' }
    });
    const respJSON = await resp.json();
    assert.strictEqual(respJSON.message, 'successfully added build');

    // now make sure Firestore has all the info
    var parsedPayload = JSON.parse(EXAMPLE_PAYLOAD);
    var repoId = firebaseEncode(parsedPayload.metadata.github.repository);
    var buildId = parsedPayload.metadata.github.run_id;

    var repositoryInfo = await client.collection(global.headCollection).doc(repoId).get();
    assert.strictEqual(repositoryInfo.data().organization, parsedPayload.metadata.github.repository_owner);
    assert.strictEqual(repositoryInfo.data().url, parsedPayload.metadata.github.repositoryUrl);

    var buildInfo = await client.collection(global.headCollection).doc(repoId).collection('builds').doc(buildId).get();
    assert.deepStrictEqual(new Set(buildInfo.data().successes), new Set([firebaseEncode(parsedPayload.data[0].name), firebaseEncode(parsedPayload.data[1].name)]));
    assert.strictEqual(buildInfo.data().percentpassing, 1);

    for (var i = 0; i < 2; i++) {
      var testInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(firebaseEncode(parsedPayload.data[0].name)).get();
      assert.strictEqual(testInfo.data().percentpassing, 1);

      var runInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(firebaseEncode(parsedPayload.data[0].name)).collection('runs').doc(buildId).get();
      assert.strictEqual(runInfo.data().timestamp.toDate().getTime(), new Date(parsedPayload.metadata.github.event.head_commit.timestamp).getTime());
    }
  });

  it('it responds to a valid POST on the /build path', async () => {
    const resp = await fetch('http://127.0.0.1:3000/api/build', {
      method: 'post',
      body: EXAMPLE_PAYLOAD_RAW,
      headers: { 'Content-Type': 'application/json' }
    });
    const respJSON = await resp.json();
    assert.strictEqual(respJSON.message, 'successfully added build');

    // now make sure Firestore has all the info
    var parsedPayload = JSON.parse(EXAMPLE_PAYLOAD);
    var parsedPayloadRaw = JSON.parse(EXAMPLE_PAYLOAD_RAW); // NOTE: the distinction is just the github.repository so the testing doesnt collide
    var repoId = firebaseEncode(parsedPayloadRaw.metadata.github.repository);
    var buildId = parsedPayloadRaw.metadata.github.run_id;

    var repositoryInfo = await client.collection(global.headCollection).doc(repoId).get();
    assert.strictEqual(repositoryInfo.data().organization, parsedPayloadRaw.metadata.github.repository_owner);
    assert.strictEqual(repositoryInfo.data().url, parsedPayloadRaw.metadata.github.repositoryUrl);

    var buildInfo = await client.collection(global.headCollection).doc(repoId).collection('builds').doc(buildId).get();
    assert.deepStrictEqual(new Set(buildInfo.data().successes), new Set([firebaseEncode(parsedPayload.data[0].name), firebaseEncode(parsedPayload.data[1].name)]));
    assert.strictEqual(buildInfo.data().percentpassing, 1);

    for (var i = 0; i < 2; i++) {
      var testInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(firebaseEncode(parsedPayload.data[0].name)).get();
      assert.strictEqual(testInfo.data().percentpassing, 1);

      var runInfo = await client.collection(global.headCollection).doc(repoId).collection('tests').doc(firebaseEncode(parsedPayload.data[0].name)).collection('runs').doc(buildId).get();
      assert.strictEqual(runInfo.data().timestamp.toDate().getTime(), new Date(parsedPayloadRaw.metadata.github.event.head_commit.timestamp).getTime());
    }
  });

  after(async () => {
    const deletePaths = [
      'tests/{testcase}/runs/{buildid}',
      'tests/{testcase}',
      'builds/{buildid}'
    ];
    var parsedPayload = JSON.parse(EXAMPLE_PAYLOAD);
    var parsedPayloadRaw = JSON.parse(EXAMPLE_PAYLOAD_RAW);
    var repoIds = [firebaseEncode(parsedPayloadRaw.metadata.github.repository), firebaseEncode(parsedPayload.metadata.github.repository)];
    const buildIds = [parsedPayload.metadata.github.run_id, parsedPayloadRaw.metadata.github.run_id];
    const testCases = [parsedPayload.data[0].name, parsedPayload.data[1].name];

    // Delete all possible documents, okay to delete document that doesnt exist
    for (let a = 0; a < deletePaths.length; a++) {
      for (let b = 0; b < buildIds.length; b++) {
        for (let c = 0; c < testCases.length; c++) {
          for (let d = 0; d < repoIds.length; d++) {
            const { deletePath, buildId, testCase, repoId } = { deletePath: deletePaths[a], buildId: buildIds[b], testCase: testCases[c], repoId: repoIds[d] };
            const deletePathUse = deletePath.replace('{testcase}', firebaseEncode(testCase)).replace('{buildid}', buildId);
            await client.collection(global.headCollection).doc(repoId + '/' + deletePathUse).delete();
          }
        }
      }
    }

    await client.collection(global.headCollection).doc(repoIds[0]).delete();
    await client.collection(global.headCollection).doc(repoIds[1]).delete();
  });
});

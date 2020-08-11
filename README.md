[//]: # "This README.md file is auto-generated, all changes to this file will be lost."
[//]: # "To regenerate it, use `python -m synthtool`."

[![release level](https://img.shields.io/badge/release%20level-beta-yellow.svg?style=flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/flaky-service.svg)](https://www.npmjs.org/package/flaky-service)
[![codecov](https://img.shields.io/codecov/c/github/google/flaky-service/master.svg?style=flat)](https://codecov.io/gh/google/flaky-service)

<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# [flaky.dev: a flaky test identification service](https://github.com/GoogleCloudPlatform/flaky-service)

### Overview
Flaky.dev is a powerful test tracking service that helps you manage [flaky tests](https://hackernoon.com/flaky-tests-a-war-that-never-ends-9aa32fdef359). Configure your Github Workflow to automatically send your test logs to [Flaky.dev](%60https://flaky-dashboard.web.app), and watch your repositories test suite health improve from `https://flaky-dashboard.web.app/org/{My organization}` 


### Getting started

Your organization and repository pages on [Flaky.dev](%60https://flaky-dashboard.web.app) will be initialized as soon as you configure your [Github Workflow](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow) to post your testing logs to our server. This generally consists of two steps: modifying/creating a your workflow's testing script to save your test results to disk in TAP format, and calling our custom Github action which posts these results to our server.


#### 1: Produce test reports in the TAP format.

This can certainly be easily done in your [favorite framework](https://www.npmjs.com/search?q=TAP+reporter). The example action below assumes you save your testing logs to a file titled `flaky-tap-log.tap` in the default github workspace directly. If you are using Node.js and mocha, creating this log may look something like this:

`"test": "c8 mocha --reporter=tap | tee flaky-tap-log.tap | tap-spec"`

Note:
- The `tee` bin outputs to the standard output and a file at the same time.
- `tap-spec` is optional and is used to convert tap output to something closer to mocha's spec output.

However, TAP logs can be created in many languages such as [Java](http://tap4j.sourceforge.net/book/ch05.html) and [Python](https://github.com/python-tap/tappy) too.

#### 2: Wire up your repository to flaky.dev.
##### With GitHub actions
Simply add this step at the end of the job(s) that run(s) your tests.
```
 - name: Post TAP
  uses: GoogleCloudPlatform/flaky-service/packages/action@v1.0.0
  with:
    file-path: ${{github.workspace}}/flaky-tap-log.tap
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    matrix: ${{toJson(matrix)}}
    os: ${{runner.os}}
    repo-description: ${{github.event.repository.description}}
    tag: 'Example tag'
```
Below is a list describing all possible action inputs:
  - `file-path` (**required**): Where the action looks for the testing log. Prepending`${{github.workspace}}` is helpful if you created the TAP log using a relative file path such as was done in the mocha example in section 1.
 - `repo-token` (**required**): A github secret that helps us verify the data being added to flaky.dev is actually coming from your repository. This token is not stored.
 - `os` (**required**): The operating system the action your tests are being run on.
 - `matrix` If you run your test suite in multiple environments, it may be useful to pass this information to flaky.dev. If you use a [job matrix](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategy), this will be useful
 - `repo-description`: Your repositories description. Used to beautify the UI.
 - `tag`: A tag for this particular post. This is especially useful if you are making multiple posts to flaky.dev from the same action.
 - `log-type`: At this point we only support `'TAP'` logs, which is the default value, but may eventually support more types.
 - `endpoint`: The URL that the action posts the data to. It is unlikely you will need to change this unless you are hosting flaky.dev on your own URL.

#### 3: See your logs on Flaky.dev!

Go to `https://flaky-dashboard.web.app/org/{My organization}` and watch as your test suite's health improves! 

![Flaky.dev example](https://imgur.com/4AVqpre.jpg)



## Developing

* `docker-compose.yml`: run `docker-compose up`, to start the flaky.dev service
  locally for testing.
* `packages/frontend`: frontend service for configuring flaky.dev.
* `packages/server`: API surface for collecting flaky test information.

## Supported Node.js Versions

Our client libraries follow the [Node.js release schedule](https://nodejs.org/en/about/releases/).
Libraries are compatible with all current _active_ and _maintenance_ versions of
Node.js.

Client libraries targetting some end-of-life versions of Node.js are available, and
can be installed via npm [dist-tags](https://docs.npmjs.com/cli/dist-tag).
The dist-tags follow the naming convention `legacy-(version)`.

_Legacy Node.js versions are supported as a best effort:_

* Legacy versions will not be tested in continuous integration.
* Some security patches may not be able to be backported.
* Dependencies will not be kept up-to-date, and features will not be backported.

#### Legacy tags available

* `legacy-8`: install client libraries from this dist-tag for versions
  compatible with Node.js 8.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).



This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.




More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/google/flaky-service/blob/master/CONTRIBUTING.md).

Please note that this `README.md`, the `samples/README.md`,
and a variety of configuration files in this repository (including `.nycrc` and `tsconfig.json`)
are generated from a central template. To edit one of these files, make an edit
to its template in this
[directory](https://github.com/googleapis/synthtool/tree/master/synthtool/gcp/templates/node_library).

## Deployment

The building and deployment process of Flaky.dev has been automated using Cloud Build triggers.  The build steps are outlined in the following files: 
* [`packages/api/cloudbuild-api.yaml`](./packages/api/cloudbuild-api.yaml) for building the API container
* [`packages/frontend/deployment/staging/cloudbuild-frontend.yaml`](./packages/frontend/deployment/staging/cloudbuild-frontend.yaml) for building the frontend staging environment
* [`packages/frontend/deployment/production/cloudbuild-frontend-prod.yaml`](./packages/frontend/deployment/production/cloudbuild-frontend-prod.yaml) for building the frontend production environment

We have implemented a two-pipeline deployment process:

* One pipeline builds our API container and deploys it to Cloud Run
* One pipeline builds the frontend and deploys it to Firebase Hosting

The following environment variables need to be set within the Cloud Run service directly from the Google Cloud Platform console:

* `HEAD_COLLECTION` = name of head Firestore collection
* `FLAKY_DB_PROJECT` = name of Google Cloud Project with access to Firestore
* `CLIENT_ID` = name of secret GitHub Client ID for authentication
* `CLIENT_SECRET` = name of GitHub Client Secret for authentication

The following [substitutions](https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values) need to be set within the API Cloud Build Trigger directly from the Google Cloud Platform console:

* `_API_CONTAINER` = name of API Cloud Run container
* `_PROJECT_ID` = name of Google Cloud Project using Cloud Run

The following substituion needs to be set within the frontend Cloud Build Trigger:

* `_PROJECT_ID` = name of Googleee Cloud Project using Firebase Hosting

#### Staging Environment

If you would like to use our staging environment, push your changes to override the `firebase-cloudrun-deployment` branch.  As long as the `packages/frontend/deployment` folder is unchanged, the build process will be automated and you will be able to view your changes on the following site: [flaky-dev-staging.web.app](https://flaky-dev-staging.web.app).

## License

Apache Version 2.0

See [LICENSE](https://github.com/google/flaky-service/blob/master/LICENSE)

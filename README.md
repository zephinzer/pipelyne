# Pipelyne
A theoretical experiment to enable writing a CI/CD pipeline in good ol' JavaScript.

[![Build Status](https://travis-ci.org/zephinzer/pipelyne.svg?branch=master)](https://travis-ci.org/zephinzer/pipelyne) [![npm version](https://badge.fury.io/js/pipelyne.svg)](https://badge.fury.io/js/pipelyne)

> "Atwood would be proud"

## Benefits

1. Run your pipeline locally
2. Involve developers by using their favourite language
3. Run JavaScript instead of Bash
4. Distribute your pipeline 
5. Write once, export for multiple CI runners

## Scope

### Base
- [x] Consumer able to define pipeline stages via `.stage()` ([see usage](#defining-a-stage))
- [x] Consumer able to define pipeline jobs within a stage via `.job()` ([see usage](#defining-a-job))
- [x] Consumer able to load a Pipelyne by specifying a file path URI ([see usage](#loading-external-pipelyne-via-path))
- [x] Consumer able to load a an externally defined Pipelyne ([see usage](#loading-external-pipelyne))
- [x] Consumer able to add manually input bash scripts via `.run()` ([see usage](#defining-a-shell-command))

### Variable Management
- [x] Consumer able to set and read a variable all during runtime ([see usage](#set-and-read-variable-at-runtime))

### File Operations
- [x] Consumer able to read contents of a file into memory ([see usage](#reading-file-contents-into-memory))

### NPM Convenience Methods
- [x] Consumer able to install NPM dependencies ([see usage](#installing-npm-dependencies))
- [x] Consumer able to publish to NPM ([see usage](#publishing-to-npm))
- [x] Consumer able to run an NPM script ([see usage](#running-an-npm-script))

### Exporting from Pipelyne
- [x] Consumer able to export pipeline to Travis format ([see usage](#exporting-pipelyne-for-travis))

### Future
- [ ] Consumer able to do file manipulation
- [ ] Consumer able to set file ownership permissions
- [ ] Consumer able to set file modification/execution permissions
- [ ] Consumer able to run NPM scripts from `package.json`
- [ ] Consumer able to publish to DockerHub
- [ ] Consumer able to do a Git push to repository
- [ ] Consumer able to export pipeline to GitLab format

## Installation

```bash
# with npm < 5
npm i pipelyne --save;
# or with npm > 5
npm i pipelyne;
# or with yarn
yarn add pipelyne
```

## Usage

### Importing & Initialisation

```js
import {Pipelyne} from 'pipelyne';

const pipeline = new Pipelyne();
```

### Defining a Stage

```js
pipeline.stage('stage name', {/* stage options */})
```

### Defining a Job

```js
pipeline
  .stage('stage name', {/* stage options */})
  .job('job name', {/* job options */})
```

### Defining a Shell Command

```js
pipeline
  .stage('stage name', {/* stage options */})
  .job('job name', {/* job options */})
  .run('pwd') // runs the `pwd` command
```

### Reading file contents into memory

> Runs at run-time, not build-time

```js
pipeline
  .stage('stage name')
  .job('job name')
  .readFile('./path/to/file', 'testvar');

pipeline.getVariable('testvar'); // undefined

pipeline.execute();

pipeline.getVariable('testvar'); // contents of file
```

### Set and read variable at runtime

```js
pipeline
  .stage('stage name')
  .job('job name')
  .readFile('./path/to/file', 'testvar')
  .print('file contents are:', pipeline.ref('testvar'));

pipeline.getVariable('testvar'); // undefined

pipeline.execute(); // observe "file contents are: ..." output
```

### Loading external Pipelyne via path

```js
pipeline.load('./path/to/pipelyne.js');
```

> **NOTE**: The file at `./path/to/pipelyne.js` should export a `pipelyne` property.

### Loading external Pipelyne

```js
pipeline.load(require('./path/to/pipelyne.js').pipelyne);
```

> **NOTE**: The loaded pipelyne should be an instance of Pipelyne.

### Installing NPM Dependencies

```js
pipeline
  .stage('stage')
  .job('job')
  // doing a development dependencies install
  .npm.install()
  // doing a production dependencies install
  .npm.install({production: true});
```

### Publishing to NPM

```js
pipeline
  .stage('stage')
  .job('job')
  .npm.publish();
```

### Running an NPM Script

```js
pipeline
  .stage('stage')
  .job('job')
  // npm run build
  .npm.run('build')
  // npm run test -- --watch
  .npm.run('test', {args: '--watch'});
```

### Exporting Pipelyne for Travis

```js
const fs = require('fs');
const path = require('path');
// ...
// export the pipeline into a file named .travis.yml
fs.writeFileSync(
  path.join(__dirname, './.travis.yml'),
  pipeline.exportFor('travis')
);
```

## API

### `Pipelyne` Instance

A Pipelyne instance exposes the following methods:

| Method | Parameters | Description |
| --- | --- | --- |
| `.stage` | `:stageName`, `:stageOptions` | Defines a stage named `:stageName`. See [StageOptions](#stageoptions) for possible configurations |
| `.job` | `:jobName`, `:jobOptions` | Defines a job named `:jobName` under the current stage. See [JobOptions](#joboptions) for possible configurations |
| `.run` | `:script`, `:commandOptions` | Defines a command that runs a shell script containing the script `:script`. See [CommandOptions](#commandoptions) for possible configurations |
| `.load` | `:pathToPipelyne` \| `:Pipelyne` | Loads an externally defined Pipelyne. When the parameter is a String, the String is taken as the relative path URI to a file exporting a property `"pipelyne"` which should be a `Pipelyne` instance. When the parameter is a `Pipelyne`, the defined stages are automatically loaded into the current `Pipelyne`. |
| `.npm.publish` | - | Publishes the current NPM package. |
| `.npm.install` | `{:production}` | Installs the NPM dependencies |
| `.npm.run` | `:command`, `{:args}` | Runs the specified NPM command `:command`. If arguments are needed, use the `:arg` property in the options object. |
| `.ref` | `:variableName` | Returns a function that `Pipelyne` will call on run to draw from a variable that is set during run-time. |
| `.print` | `...:thingsToPrint` | Prints the arguments as a string. Arguments are delimited by a space. |
| `.readFile` | `:filePath`, `:variableName` | Loads the file content of the file at `:filePath` relative to the `baseUri` and stores it in the variable named `:variableName` |
| `.getVariable` | `:variableName` | Returns the variable with name `:variableName`. Runs at build-time. |
| `.setVariable` | `:variableName`, `:value` | Sets a variable with name `:variableName` to the value `:value`. Runs at build-time. |
| `.toString` | `:format` | Exports the current Pipelyne as a String. See [PipelyneStringFormat](#pipelynestringformat) for possible formats. |
| `.exportFor` | `:ciProvider` | Exports the current Pipelyne in the format of the specified `:ciProvider`. Currently only Travis is supported. See [our pipelyne.js](./pipelyne.js) for an example of doing this. The `pipelyne.js` is executed using the NPM script `pipeline`. [See the package.json](./package.json) |

## Configuration

### `RunnableOptions`

| Key | Type | Description |
| --- | --- | --- |
| `allowFailure` | Boolean | Decides whether the Runnable is allowed to fail. |
| `id` | String | Indiciates the ID of the Runnable. This should be automatically generated by the Runnable's constructor. |

### `StageOptions`
Stage options includes all the configurations in [`RunnableOptions`](#runnableoptions) as well as the following:

| Key | Type | Description |
| --- | --- | --- |
| `name` | String | Name in normal text. The `id` of the Stage will be set to a `kebab-case`d version of the name. |

### `JobOptions`
Job options includes all the configurations in [`RunnableOptions`](#runnableoptions) as well as the following:

| Key | Type | Description |
| --- | --- | --- |
| `name` | String | Name in normal text. The `id` of the Job will be set to a `kebab-case`d version of the name. |

### `CommandOptions`
Command options includes all the configurations in [`RunnableOptions`](#runnableoptions).

No extra configurations are available.

### `PipelyneStringFormat`
This can be one of `"json"` or `"overview"`.

## Contributing
Fork, make changes, push, merge request with `master`, wait for tests to pass. You know the drill (:

## License
This package is licensed under the MIT license.

See [the attached license file](./LICENSE) for details.

## ChangeLog

| Version | Description |
| --- | --- |
| 0.0.7 | Added `.npm` convenience methods with `.publish()`, `.install()` and `.run(:scriptNameFromPackageJson)` |
| 0.0.6 | Added `.print` to print stuff to the terminal and `.ref` functions to reference run-time variables |
| 0.0.5 | Added build-time variable support and file content reading |
| 0.0.4 | Added test resources to `.npmignore` and added stuff to `package.json` |
| 0.0.3 | Refactored exporter into its own module and enabled setting of `set +x` and `set -x` for allowing/disallowing failure in Travis exports |
| 0.0.2 | Added undocumented exporter and external Pipelyne loading |
| 0.0.1 | Initial release |

# Cheers

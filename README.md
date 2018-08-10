# Pipelyne
A theoretical experiment to enable writing a CI/CD pipeline in good ol' JavaScript.

## Benefits

1. Being able to run your pipeline locally
2. Enables DevOps as a culture by lowering learning curve (no more `bash`)
3. Removes system differences by using Node (no more *'it works on my machine!'*)

## Scope

- [ ] Consumer able to define pipeline stages
- [ ] Consumer able to add manually input bash scripts
- [ ] Consumer able to run NPM scripts from `package.json`
- [ ] Consumer able to publish to NPM
- [ ] Consumer able to publish to DockerHub
- [ ] Consumer able to do a Git push to repository
- [ ] Consumer able to export pipeline to GitLab format
- [ ] Consumer able to export pipeline to Travis format

## Usage

### Basic Pipeline
```js
const pipeline = new Pipelyn({
  basePath: process.cwd(),
});

pipeline
  // defines a lint stage for code quality checks
  .stage('lint')
  .npm('lint') // does `npm run lint`
  // defines a build stage for creating distribution
  .stage('build')
  .npm('build')
  .docker.build(
    './provisioning/images/Dockerfile',
    'me/myimage:latest'
  )
  // defines a test stage for unit tests
  .stage('test')
  .npm('test')
  .npm('coverage')
  // defines an optional integration test stage
  .stage('integration', {
    on: {
      branch: /^master$/,
    },
  })
  .git.clone('https://username:password@github.com/username/integration', './integration')
  .chmod(500, './integration/integration-tests')
  .run('./integration/integration-tests')
  // defines a versioning stage
  .stage('version')
  .npm.bump('patch')
  .git.tag(require('./package.json').version)
  // defines a release stage
  .stage('release')
  .dockerhub.setCredentials(process.env.DH_USERNAME, process.env.DH_PASSWORD)
  .dockerhub.push('me/myimage:latest')
  .npm.setToken(process.env.NPM_TOKEN)
  .npm.publish()
  .git.setCredentials(process.env.GIT_USERNAME, process.env.GIT_ACCESS_TOKEN)
  .git.setUrl(process.env.GIT_REPOSITORY_URL)
  .git.push()
  // defines a conditional 'test' stage failure pipeline
  .on('failure', {
    stage: 'test'
  }, (pipelineDetails) => {
    // ...
  })
  // defines a distributed 'integration' stage failure pipeline
  .on('failure', {
    stage: 'integration',
    pipeline: './pipeline/integration-fail', // loads the pipeline at the path 
  })
  // defines a global failure notification job
  .on('failure', (pipelineDetails) => {
    // ...
  })
```

### Bash Script

```js
const pipeline = new Pipelyne();

pipeline
  .stage('build')
  .run('make')
  .run('ls -Al');
```

### DockerHub Publish

```js
const pipeline = new Pipelyne();

pipeline
  .stage('build')
  .docker.build({
    dockerfile: './path/to/Dockerfile',
    tag: 'my/image:1.0.0'
  })
  .stage('publish')
  .dockerhub.setCredentials(process.env.DH_USERNAME, process.env.DH_PASSWORD)
  .dockerhub.push('my/image:1.0.0')
```

### NPM Publish

```js
const pipeline = new Pipelyne();

pipeline
  .stage('publish')
  .npm.setToken(process.env.NPM_TOKEN)
  .npm.publish();
```

### Git Publish

```js
const pipeline = new Pipelyne();

pipeline
  .stage('publish')
  .git.setUrl('https://github.com/my/repository')
  .git.setCredentials(process.env.GH_USERNAME, process.env.GH_ACCESS_TOKEN)
  .git.push(); // pushes to 'https://username:accessToken@github.com/my/repository'
```

### Global Timeout

```js
const pipeline = new Pipelyne();

pipeline
  .stage('test', {timeout: 5000})
  // ...
  .on('timeout', {
    stage: 'test',
  }, (pipelineDetails) => {
    // ...
  });
```

### Global Success

```js
const pipeline = new Pipelyne();

pipeline
  .stage('test')
  // ...
  .on('success', (pipelineDetails) => {
    // ...
  });
```

### Global Failure

```js
const pipeline = new Pipelyne();

pipeline
  .stage('test')
  // ...
  .on('failure', (pipelineDetails) => {
    // ...
  });
```

### Conditional Pipelines

```js
const pipeline = new Pipelyne();

pipeline
  .stage('test')
  // ...
  .stage('test', {
    on: 'failure'
  })
  .npm('cleanup')
  .stage('next stage...')
  // ...
```

### Distributed Pipelines

```js
const pipeline = new Pipelyne();

pipeline
  .stage('test')
  // ...
  .on('failure', {stage: 'test', pipeline: './pipeline/test-fail'})
```

### Exporting Pipeline

```js
const pipeline = new Pipelyne();

pipeline
  .stage('...')
  // ...

const fs = require('fs');
fs.writeFile('./.gitlab-ci.yml', pipeline.gitlab());
```
const fs = require('fs');
const path = require('path');
const {Pipelyne} = require('./dist/Pipelyne');

const pipelyne = new Pipelyne();

pipelyne
  .stage('install dependencies')
  .job('install deps')
  .npm.install()
  .stage('build')
  .job('build')
  .npm.run('build')
  .stage('lint')
  .job('lint')
  .npm.run('lint')
  .stage('test')
  .job('test')
  .npm.run('test')
  .execute()
;

fs.writeFileSync(
  path.join(__dirname, './.travis.yml'),
  pipelyne.exportFor('travis')
);

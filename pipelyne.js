const fs = require('fs');
const path = require('path');
const {Pipelyne} = require('./dist/Pipelyne');

const pipelyne = new Pipelyne();

pipelyne
  .stage('build')
  .job('build')
  .run('npm run build')
  .stage('lint')
  .job('lint')
  .run('npm run lint')
  .stage('test')
  .job('test')
  .run('npm run test')
  .execute()
;

fs.writeFileSync(path.join(__dirname, './.travis.yml'), pipelyne.exportFor('travis'));

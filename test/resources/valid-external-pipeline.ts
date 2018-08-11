import {Pipelyne} from '../../src/Pipelyne';

export const pipelyne = new Pipelyne();

pipelyne
  .stage('external stage 1')
  .job('external job 1')
  .run('ls -A -l')
  .stage('external stage 2')
  .job('external job 2')
  .run('pwd');

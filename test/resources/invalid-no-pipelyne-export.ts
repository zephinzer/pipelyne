import {Pipelyne} from '../../src/Pipelyne';

export const pipeline = new Pipelyne();

pipeline
  .stage('external stage 1')
  .job('external job 1')
  .run('ls -A -l');

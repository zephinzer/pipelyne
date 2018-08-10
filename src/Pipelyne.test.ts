import {expect} from 'chai';
import {Pipelyne} from './Pipelyne';

describe('pipelyne', () => {
  it('can be initialised', () => {
    expect(() => {
      const pipeline = new Pipelyne();
    }).to.not.throw();
  });

  context('.stage', () => {
    it('adds a stage to the pipeline', () => {
      const pipeline = new Pipelyne();
      pipeline.stage('some stage');
      expect(pipeline.stages).to.have.length(1);
    });

    it('creates the correct ID', () => {
      const pipeline = new Pipelyne();
      pipeline.stage('a b c d');
      expect(pipeline.stages[0].id).to.deep.equal('a-b-c-d');
      pipeline.stage('A b C D');
      expect(pipeline.stages[1].id).to.deep.equal('a-b-c-d');
      pipeline.stage('A b C14 40D 9');
      expect(pipeline.stages[2].id).to.deep.equal('a-b-c14-40d-9');
      pipeline.stage('Some d3scrib3d Stage');
      expect(pipeline.stages[3].id).to.deep.equal('some-d3scrib3d-stage');
    });
  });

  context('.job', () => {
    it('throws an error if no stage is first defined', () => {
      const pipeline = new Pipelyne();
      expect(() => {
        pipeline.job('some job');
      }).to.throw();
    });

    it('adds a job to the latest defined stage', () => {
      const pipeline = new Pipelyne();
      pipeline
        .stage('some stage')
        .job('some job');
      expect(pipeline.stages[0].jobs).to.have.length(1);
      expect(pipeline.stages[0].jobs[0].id).to.deep.equal('some-job');
    });
  });

  context('.run', () => {
    it('throws an error if no stage is first defined', () => {
      const pipeline = new Pipelyne();
      expect(() => {
        pipeline.run('pwd');
      }).to.throw();
    });

    it('throws an error if no job is first defined', () => {
      const pipeline = new Pipelyne();
      pipeline.stage('some stage');
      expect(() => {
        pipeline.run('pwd');
      }).to.throw();
    });

    it('adds a command to the latest defined job', () => {
      const pipeline = new Pipelyne();
      pipeline
        .stage('some stage')
        .job('some job')
        .run('pwd');
      expect(pipeline.stages[0].jobs[0].commands).to.have.length(1);
      expect(pipeline.stages[0].jobs[0].commands[0]).to.have.property('id');
      expect(pipeline.stages[0].jobs[0].commands[0].options.type)
        .to.deep.equal('run');
    });
  });

  context('.toString', () => {
    it('works', () => {
      const pipeline = new Pipelyne();
      pipeline
        .stage('one')
        .job('1a')
        .run('npm run lint')
        .run('npm run test')
        .stage('two')
        .job('2a')
        .run('npm run build')
        .stage('three')
        .job('github')
        .run('git push');
      console.info(pipeline.toString());
    });
  });
});

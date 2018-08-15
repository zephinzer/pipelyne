import * as fs from 'fs';
import * as path from 'path';
import {expect} from 'chai';
import {Pipelyne} from './Pipelyne';

describe('pipelyne', () => {
  it('can be initialised', () => {
    expect(() => {
      const pipeline = new Pipelyne();
    }).to.not.throw();
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

  context('.load', () => {
    let externalPipeline;

    before(() => {
      externalPipeline = new Pipelyne();
      externalPipeline
        .stage('external stage 1')
        .job('external job 1')
        .run('ls -A -l')
        .stage('external stage 2')
        .job('external job 2')
        .run('pwd');
    });

    context('path URI provided', () => {
      it('throws an error if the path URI does not exist', () => {
        expect(() =>
          (new Pipelyne()).load('./does-not-exist')
        ).to.throw(TypeError);
      });
  
      // tslint:disable-next-line max-line-length
      it('throws an error if the path URI does not export a :pipelyne property', () => {
        expect(() =>
          (new Pipelyne())
            .load('./test/resources/invalid-no-pipelyne-export.ts')
        ).to.throw(ReferenceError);
      });

      // tslint:disable-next-line max-line-length
      it('works if the path URI exists and exports a :pipelyne property', () => {
        expect(() => 
          (new Pipelyne())
            .load('./test/resources/valid-external-pipeline.ts')
        ).to.not.throw();
      });
    });

    context('a Pipelyne instance provided', () => {
      let externalPipelyne;

      before(() => {
        externalPipelyne =
          require('../test/resources/valid-external-pipeline').pipelyne;
      });

      it('adds the stages of the Pipelyne instance correctly', () => {
        let currentPipelyne;
        currentPipelyne = new Pipelyne();
        currentPipelyne
          .stage('local stage')
          .job('local job');
        expect(() => {
          currentPipelyne.load(externalPipelyne);
        }).to.not.throw();
        expect(currentPipelyne.stages)
          .to.have.length(externalPipelyne.stages.length + 1);
      });
    });
  });

  context('.print', () => {
    it('prints a variable set at build-time', () => {
      const pipeline = new Pipelyne();
      // build time
      pipeline
        .stage('stage one')
        .job('job one')
        .print ('testvar =', pipeline.ref('testvar'))
        .stage('stage two')
        .job('job two');
      expect(pipeline.ref('testvar')()).to.equal(undefined);
      pipeline.setVariable('testvar', 'testtest');
      // run time
      pipeline.execute();
      
    });
  });

  context('.readFile', () => {
    const testDirectory = './test/tmp/.readFile';
    const testFilePath =
      path.join(testDirectory, `./${(new Date()).getTime()}`);
    const testString = '__abcd';

    before(() => {
      fs.mkdirSync(testDirectory);
      fs.writeFileSync(
        testFilePath,
        testString,
      );
    });

    after(() => {
      const testFiles = fs.readdirSync(testDirectory);
      testFiles.forEach((testFile) => {
        if (testFile.indexOf('.') !== 0) {
          fs.unlinkSync(
            path.join(testDirectory, `./${testFile}`)
          );
        }
      });
      fs.rmdirSync(testDirectory);
    });

    it('saves the contents of the file to the main pipelyne', () => {
      const pipeline = new Pipelyne();
      pipeline
        .stage('some stage')
        .job('some job')
        .readFile(testFilePath, 'testFile')
        .execute();
      expect(pipeline.getVariable('testFile')).to.deep.equal(testString);
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

  context('.toString', () => {
    it('can export as a JSON string', () => {
      const pipelyne = new Pipelyne();
      pipelyne
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
    });
  });
});

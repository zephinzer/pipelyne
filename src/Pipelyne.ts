import {JobOptions} from './Job';
import {Stage, StageOptions} from './Stage';
import {Runnable, RunnableProperties} from './lib/Runnable';

export interface Current {
  stageIndex: number;
}

export interface PipelyneOptions extends RunnableProperties {}

export class Pipelyne extends Runnable<Pipelyne, PipelyneOptions> {
  current: Current = {
    stageIndex: -1,
  };
  stages: Stage[] = [];

  constructor() {
    super();
    return this;
  }

  private getCurrentStage(): Stage {
    return this.stages[this.current.stageIndex];
  }

  private verifyStageExists(reason: string): void {
    if (!this.stages || this.stages.length < 1) {
      throw new Error(`You need a stage ${reason} (run .stage(...)).`);
    }
  }

  toString(format?: string) {
    let formattedString = '';
    switch (format) {
      default:
        this.stages.forEach((stage) => {
          formattedString += `STAGE: ${stage.options.id}\n`;
          stage.jobs.forEach((job) => {
            formattedString += `  JOB: ${job.options.id}\n`;
            job.commands.forEach((command) => {
              formattedString += `    CMD: ${command.options.script}\n`;
            });
          });
        });
    }
    return formattedString;
  }

  stage(name, stageOptions: StageOptions = {}): Pipelyne {
    this.stages.push(new Stage({
      ...stageOptions,
      name,
    }));
    this.current.stageIndex = this.stages.length - 1;
    return this;
  }

  job(name, jobOptions: JobOptions = {}): Pipelyne {
    this.verifyStageExists('to add a job');
    const currentStage = this.getCurrentStage();
    currentStage.addJob({
      ...jobOptions,
      name,
    });
    return this;
  }

  run(script: string): Pipelyne {
    this.verifyStageExists('to add a command');
    const currentStage = this.getCurrentStage();
    currentStage.addCommand({
      script,
      type: 'run',
    });
    return this;
  }

  async execute() {
    this.state = 'passed';
    for (let i = 0; i < this.stages.length; ++i) {
      const {state, status} = await this.stages[i].execute();
      if (state === 'failed') {
        this.state = 'failed';
      }
      if (!status) {
        break;
      }
    }
    this.status = (this.state === 'passed' || this.allowFailure);
    return this;
  }
}

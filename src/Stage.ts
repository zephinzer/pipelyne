import * as Case from 'case';
import {CommandOptions} from './Command';
import {Job, JobOptions} from './Job';
import {Runnable, RunnableProperties} from './lib/Runnable';

export interface CurrentStage {
  jobIndex: number;
}

export interface StageOptions extends RunnableProperties {
  name?: string;
}

export class Stage extends Runnable<Stage, StageOptions> {
  static count = 0;
  current: CurrentStage = {
    jobIndex: -1,
  };
  jobs: Job[] = [];

  constructor({
    allowFailure = false,
    name,
  }: StageOptions = {}) {
    super();
    Stage.count += 1;
    this.id = Case.kebab(name);
    this.options = {
      allowFailure,
      id: this.id,
      name,
    };
    return this;
  }

  private getCurrentJob(): Job {
    return this.jobs[this.current.jobIndex];
  }

  private verifyJobExists(reason: string): void {
    if (!this.jobs || this.jobs.length < 1) {
      throw new Error(`You need a job ${reason} (run .job(...)).`);
    }
  }

  addJob(jobOptions: JobOptions): Stage {
    this.jobs.push(new Job(jobOptions));
    this.current.jobIndex = this.jobs.length - 1;
    return this;
  }

  addCommand(commandOptions: CommandOptions): Stage {
    this.verifyJobExists('to add a command');
    const currentJob = this.getCurrentJob();
    currentJob.addCommand(commandOptions);
    return this;
  }

  async execute(): Promise<Stage> {
    this.state = 'passed';
    for (let i = 0; i < this.jobs.length; ++i) {
      const {state, status} = await this.jobs[i].execute();
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
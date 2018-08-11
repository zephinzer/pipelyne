import * as path from 'path';
import {existsSync} from 'fs';
import {JobOptions} from './Job';
import {Stage, StageOptions} from './Stage';
import {Runnable, RunnableProperties} from './lib/Runnable';

export type PipelyneCIProvider = 'travis';

export type PipelyneStringFormat = 'json' | 'overview';

export interface Current {
  stageIndex: number;
}

export interface PipelyneOptions extends RunnableProperties {
  baseUri?: string;
}

export class Pipelyne extends Runnable<Pipelyne, PipelyneOptions> {
  baseUri: string;
  current: Current = {
    stageIndex: -1,
  };
  stages: Stage[] = [];

  constructor({
    baseUri = './',
  }: PipelyneOptions = {}) {
    super();
    this.baseUri = path.join(process.cwd(), baseUri);
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

  toString(format?: PipelyneStringFormat) {
    let formattedString = '';
    switch (format) {
      case 'json':
        const exported = {
          stages: [],
        };
        this.stages.forEach((stage) => {
          const currentStage = {
            allowFailure: stage.options.allowFailure,
            id: stage.options.id,
            name: stage.options.name,
            jobs: [],
          };
          stage.jobs.forEach((job) => {
            const currentJob = {
              allowFailure: job.options.allowFailure,
              id: job.options.id,
              name: job.options.name,
              commands: [],
            };
            job.commands.forEach((command) => {
              currentJob.commands.push({
                allowFailure: command.options.allowFailure,
                command: command.options.command,
                id: command.options.id,
                params: command.options.params,
                script: command.options.script,
                type: command.options.type,
              });
            });
            currentStage.jobs.push(currentJob);
          });
          exported.stages.push(currentStage);
        });
        formattedString = JSON.stringify(exported, null, 2);
        break;
      case 'overview': default:
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

  load(scriptLocation: string): Pipelyne;
  load<Pipeline>(pipeline: Pipelyne): Pipelyne;
  load<Pipeline>(pipelyne: string | Pipeline): Pipelyne {
    let currentPipelyne;
    if (pipelyne instanceof Pipelyne) {
      currentPipelyne = pipelyne;
    } else if (typeof pipelyne === 'string') {
      const pipelynePath = path.join(this.baseUri, pipelyne);
      if (existsSync(pipelynePath)) {
        currentPipelyne = require(pipelynePath).pipelyne;
        if (!(currentPipelyne instanceof Pipelyne)) {
          // tslint:disable-next-line max-line-length
          throw new ReferenceError(`The specified pipelyne to import at "${pipelynePath}" did not return a defined :pipeline proerty. Did you forget to export it?`);
        }
      } else {
        // tslint:disable-next-line max-line-length
        throw new TypeError(`The specified file to import a pipelyne from at "${pipelynePath}" could not be found.`);
      }
    } else {
      // tslint:disable-next-line max-line-length
      throw new TypeError('The :pipelyne property should either be an instance of a Pipelyne, or a relative path string to a file exporting a property :pipeline of type Pipelyne.');
    }
    this.stages = this.stages.concat(...currentPipelyne.stages);
    this.current.stageIndex = this.stages.length - 1;
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

  exportFor(continuousIntegrationProvider: PipelyneCIProvider): string {
    const ciProviderScript = {};
    let ciProviderScriptString = '';
    switch (continuousIntegrationProvider) {
      case 'travis':
      default:
        ciProviderScript['language'] = 'node_js';
        ciProviderScript['node_js'] = ['8'];
        ciProviderScript['cache'] = {
          directories: ['node_modules'],
        };
        ciProviderScript['script'] = [];
        this.stages.forEach((stage) => {
          stage.jobs.forEach((job) => {
            job.commands.forEach((command) => {
              ciProviderScript['script'].push(command.options.script);
            });
          });
        });
        ciProviderScriptString = require('js-yaml').safeDump(ciProviderScript);
    }
    return ciProviderScriptString;
  }
}

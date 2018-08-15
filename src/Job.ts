import * as Case from 'case';
import {Command, CommandOptions, CommandType} from './Command';
import {Runnable, RunnableProperties} from './lib/Runnable';

export interface CurrentJob {
  commandIndex: number;
}

export interface JobOptions extends RunnableProperties {
  name?: string;
}

export class Job extends Runnable<Job, JobOptions> {
  static count = 0;

  commands: Command[] = [];
  current: CurrentJob = {
    commandIndex: -1,
  };

  constructor({
    allowFailure = false,
    name,
  }: JobOptions = {}) {
    super();
    Job.count += 1;
    this.id = Case.kebab(name);
    this.options = {
      allowFailure,
      id: this.id,
      name,
    };
    return this;
  }

  addCommand(commandOptions: CommandOptions<CommandType, any>): Job {
    this.commands.push(new Command(commandOptions));
    this.current.commandIndex = this.commands.length - 1;
    return this;
  }

  /**
   * Executes all commands until a command returns a status of `false`
   */
  async execute(): Promise<Job> {
    this.state = 'passed';
    for (let i = 0; i < this.commands.length; ++i) {
      const {state, status} = await this.commands[i].execute();
      if (state === 'failed') {
        this.state = 'failed';
      }
      if (!status) {
        break;
      }
    }
    this.status = (this.state === 'passed' || this.options.allowFailure);
    return this;
  }
}

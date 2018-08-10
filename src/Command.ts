import {ChildProcess, spawn} from 'child_process';
import * as uuid from 'uuid/v4';
import {Runnable, RunnableProperties} from './lib/Runnable';

export type CommandType = 'run';

export interface CommandOptions extends RunnableProperties {
  command?: string;
  options?: object;
  params?: string[];
  script?: string;
  type?: CommandType;
}

export class Command extends Runnable<Command, CommandOptions> {
  static count = 0;

  code = -1;
  instance: ChildProcess;

  constructor({
    allowFailure = false,
    script,
    type = 'run',
  }: CommandOptions = {}) {
    super();
    Command.count += 1;
    this.id = uuid();
    this.options = {
      ...this[`_generate_${type}_options`]({
        script,
      }),
      allowFailure,
      id: this.id,
      type,
    };
    return this;
  }

  private _generate_run_options(commandOptions: CommandOptions) {
    const {script} = commandOptions;
    const parameterisedScript = script.split(' ');
    const params = parameterisedScript.length > 1
      ? parameterisedScript.slice(1)
      : [];
    const command = parameterisedScript[0];
    return {command, params, script};
  }

  async execute(): Promise<Command> {
    this.code = await this[this.options.type]();
    // did it fail?
    this.state = (this.code === 0) ? 'passed' : 'failed';
    // is it okay?
    this.status = (this.state === 'passed' || this.options.allowFailure);
    return this;
  }

  run(): Promise<number> {
    return new Promise((resolve) => {
      const {
        command,
        params,
      } = this.options;
      this.instance = spawn(command, params, {stdio: 'inherit'});
      this.instance.on('exit', (exitCode) => {
        this.instance = null;
        resolve(exitCode);
      });
    });
  }
}

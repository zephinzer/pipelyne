import * as fs from 'fs';
import {ChildProcess, spawn} from 'child_process';
import * as uuid from 'uuid/v4';
import {Runnable, RunnableProperties} from './lib/Runnable';
import {Store} from './Store';

export const statusCode = {
  success: 0,
  error: {
    unstarted: -1,
    typeNotFound: -2,
    fileNotFound: -3,
  },
};

export type CommandType = 'run' | 'file';

export interface CommandResult {
  code: number;
  data?: object | string;
  error?: object | string;
  output?: object | string;
}

export interface CommandOptions extends RunnableProperties {
  command?: string;
  options?: object;
  params?: string[];
  script?: string;
  type?: CommandType;
}

export class Command extends Runnable<Command, CommandOptions> {
  static count = 0;

  code = statusCode.error.unstarted;
  result: CommandResult;
  instance: ChildProcess;

  constructor({
    allowFailure = false,
    command,
    params,
    script,
    type = 'run',
  }: CommandOptions = {}) {
    super();
    Command.count += 1;
    this.id = uuid();
    this.options = {
      ...this[`_generate_${type}_options`]({
        command,
        params,
        script,
      }),
      allowFailure,
      id: this.id,
      type,
    };
    return this;
  }

  private _generate_file_options(commandOptions: CommandOptions) {
    const {command, params} = commandOptions;
    const script = null;
    return {command, params, script};
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
    this.result = await this[this.options.type]();
    // did it fail?
    this.state = (this.result.code === 0) ? 'passed' : 'failed';
    // is it okay?
    this.status = (this.state === 'passed' || this.options.allowFailure);
    return this;
  }

  /**
   * Called by execute()
   */
  file(): Promise<CommandResult> {
    return new Promise((resolve) => {
      switch (this.options.command) {
        case 'read':
          resolve(this.fileRead());
          break;
        default:
          resolve({code: statusCode.error.typeNotFound});
      }
    });
  }

  /**
   * Called by file() by execute()
   * - opens a file at this.options.params[0]
   * - saves file contents to variable at this.options.params[1]
   */
  fileRead(): CommandResult {
    const {params} = this.options;
    const filePath = params[0].toString();
    const variableName = params[1].toString();
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath).toString();
      Store.set(variableName, fileContents, {overwrite: true});
      return {
        code: statusCode.success,
        data: fileContents,
      };
    } else {
      return {code: statusCode.error.fileNotFound};
    }
  }

  /**
   * Called by execute()
   * - runs a raw shell script in the current shell
   */
  run(): Promise<CommandResult> {
    return new Promise((resolve) => {
      const {
        command,
        params,
      } = this.options;
      this.instance = spawn(command, params, {stdio: 'inherit'});
      this.instance.on('exit', (exitCode) => {
        this.instance = null;
        resolve({code: exitCode});
      });
    });
  }
}

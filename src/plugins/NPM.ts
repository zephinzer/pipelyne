import {Plugin} from './Plugin';
import {Pipelyne} from '../Pipelyne';

export class NPM extends Plugin {
  constructor(
    pipelyne: Pipelyne,
  ) {
    super();
    this.pipelyne = pipelyne;
  }

  install({
    production = false,
  }: {
    production?: boolean,
  } = {}): Pipelyne {
    this.verifyStageExists('to run npm install');
    this.getCurrentStage().addCommand({
      script: `npm install ${production ? '--production' : ''}`,
      type: 'run',
    });
    return this.pipelyne;
  }

  publish(): Pipelyne {
    this.verifyStageExists('to run npm publish');
    this.getCurrentStage().addCommand({
      script: 'npm publish',
      type: 'run',
    });
    return this.pipelyne;
  }

  run(
    command: string,
    {
      args,
    }: {
      args?: string
    } = {}
  ): Pipelyne {
    const script = `npm run ${command}${args ? ` -- ${args}` : ''}`;
    this.verifyStageExists(`to run ${script}`);
    this.getCurrentStage().addCommand({
      script,
      type: 'run',
    });
    return this.pipelyne;
  }
}

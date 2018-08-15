import {Stage} from '../Stage';
import {Pipelyne} from '../Pipelyne';

export class Plugin {
  pipelyne: Pipelyne;

  constructor() {
    return this;
  }

  getCurrentStage(): Stage {
    return this.pipelyne.stages[this.pipelyne.current.stageIndex];
  }

  verifyStageExists(
    reason: string
  ): void {
    if (!this.pipelyne.stages || this.pipelyne.stages.length < 1) {
      throw new Error(`You need a stage ${reason} (run .stage(...)).`);
    }
  }
}
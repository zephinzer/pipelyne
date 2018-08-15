import {State} from '../types';

export interface RunnableProperties {
  allowFailure?: boolean;
  id?: string;
}

export abstract class Runnable<T, U> implements RunnableProperties {
  allowFailure;
  id;
  options: U;
  state: State;
  status: boolean;

  abstract execute(): Promise<T>;

  getId() {
    return this.id;
  }
}
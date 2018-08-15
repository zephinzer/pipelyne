export type StoreValue = number | string | boolean;
export type StoreMode = 'memory';

export class Store {
  static variables: {
    [key: string]: number | string | boolean;
  } = {};
  static mode = 'memory';

  static throwInvalidStoreMode() {
    throw new Error(`Invalid variable store mode "${Store.mode}" provided.`);
  }

  /**
   * Sets the mode of the variable store.
   */
  static setMode(modeToSetTo: StoreMode) {
    Store.mode = modeToSetTo;
  }

  /**
   * Retrieves the variable with name :name.
   */
  static get(
    name: string
  ): StoreValue {
    switch (Store.mode) {
      case 'memory':
        return Store.variables[name];
      default:
        Store.throwInvalidStoreMode();
    }
  }

  /**
   * Returns a list of all assigned variable names.
   */
  static list(): string[] {
    return Object.keys(Store.variables);
  }

  /**
   * Assigns the variable with name :name a value :value.
   * 
   * @param {string} name - name of the variable
   * @param {StoreValue} value - value of the variable to assign
   * @throws an error if the variable name is already assigned and the
   *  overwrite option is not set to true
   */
  static set(
    name: string,
    value: StoreValue,
    {
      overwrite = false,
    }:
    {
      overwrite?: boolean;
    } = {},
  ): void {
    switch (Store.mode) {
      case 'memory':
        if (!overwrite && typeof Store.variables[name] !== 'undefined') {
          // tslint:disable-next-line max-line-length
          throw new Error(`The variable name "${name}" was already assigned the value ${Store.variables[name]}.`);
        }
        Store.variables[name] = value;
        break;
      default:
        Store.throwInvalidStoreMode();
    }
  }
}

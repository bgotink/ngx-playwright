export interface Schema {
  /**
   * The path of the Jest configuration file
   */
  readonly jestConfig: string;

  /**
   * A dev-server builder target to run tests against in the format of `target` or `[project]:target[:configuration]`. You can also pass in more than one configuration name as a comma-separated list. Example: `project:target:production,staging`.
   */
  readonly devServerTarget?: string;

  /**
   * Base URL for playwright to connect to.
   */
  readonly baseUrl?: string;

  /**
   * Host to listen on
   */
  readonly host?: string;

  /**
   * The port to use to serve the application
   */
  readonly port?: number;
}

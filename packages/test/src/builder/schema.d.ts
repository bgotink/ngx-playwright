export interface Schema {
  /**
   * A dev-server builder target to run tests against in the format of `target` or `[project]:target[:configuration]`. You can also pass in more than one configuration name as a comma-separated list. Example: `project:target:production,staging`.
   */
  readonly devServerTarget?: string;

  /**
   * Base URL for playwright to connect to
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

  // Playwright options

  /**
   * Run test in a specific browser
   *
   * Available options are "chromium", "firefox", "webkit" or "all" to run tests in all three browsers at the same time.
   */
  readonly browser?: string;

  /**
   * Path to @playwright/test configuration
   */
  readonly config?: string;

  /**
   * Run tests with Playwright Inspector. Shortcut for `PWDEBUG=1` environment variable and `--timeout=0 --maxFailures=1 --headed --workers=1` options
   */
  readonly debug?: boolean;

  /**
   * Whether to disallow `test.only`, useful on CI
   */
  readonly forbidOnly?: boolean;

  /**
   * Only run tests matching this regular expression
   *
   * For example, this will run 'should add to cart' when passed `grep: "add to cart"`.
   */
  readonly grep?: string;

  /**
   * Only run tests not matching this regular expression
   *
   * The opposite of `grep`.
   */
  readonly grepInvert?: string;

  /**
   * Total timeout for the whole test run in milliseconds
   *
   * By default, there is no global timeout.
   */
  readonly globalTimeout?: number;

  /**
   * Run tests in headed browsers, useful for debugging
   */
  readonly headed?: boolean;

  /**
   * List all the tests, but do not run them.
   */
  readonly list?: boolean;

  /**
   * Stop after the first `N` test failures
   */
  readonly maxFailures?: number;

  /**
   * Directory for artifacts produced by tests, defaults to `test-results`
   */
  readonly output?: string;

  /**
   * Only run tests from one of the specified projects
   *
   * Defaults to running all projects defined in the configuration file.
   */
  readonly project?: string;

  /**
   * Whether to suppress stdout and stderr from the tests
   */
  readonly quiet?: boolean;

  /**
   * Run each test `N` times, defaults to one
   */
  readonly repeatEach?: number;

  /**
   * Choose a reporter: minimalist `dot`, concise `line` or detailed `list`
   */
  readonly reporter?: string;

  /**
   * The maximum number of retries for flaky tests, defaults to zero (no retries)
   */
  readonly retries?: number;

  /**
   * Shard tests and execute only selected shard, specified in the form current/all, 1-based, for example 3/5
   */
  readonly shard?: string;

  /**
   * Maximum timeout in milliseconds for each test, defaults to 30 seconds
   */
  readonly timeout?: number;

  /**
   * Whether to update snapshots with actual results instead of comparing them
   *
   * Use this when snapshot expectations have changed.
   */
  readonly updateSnapshots?: boolean;

  /**
   * The maximum number of concurrent worker processes that run in parallel
   */
  readonly workers?: number;
}

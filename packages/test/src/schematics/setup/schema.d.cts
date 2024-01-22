export interface Schema {
	/**
	 * Name of an application project to add @ngx-playwright/test to
	 */
	project?: string;

	/**
	 * Replace the existing e2e target, if this option is not passed and there is already an e2e target the command will fail
	 */
	replaceE2eTarget?: boolean;

	/**
	 * Set up typescript files for playwright tests
	 */
	typescript?: boolean;

	/**
	 * Whether to set up an angular project or a non-angular project
	 */
	angular?: boolean | null;

	/**
	 * Whether to set up component harnesses (aka Page Objects)
	 */
	harnesses?: boolean;
}

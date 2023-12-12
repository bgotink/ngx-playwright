export type AngularWindow = typeof globalThis & {
	readonly frameworkStabilizers:
		| ((callback: (didWork: boolean) => void) => void)[]
		| undefined;
};

export type AngularWindow = typeof globalThis & {
	frameworkStabilizers:
		| ((callback: (didWork: boolean) => void) => void)[]
		| undefined;
};

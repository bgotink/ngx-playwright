/**
 * @type {(<T>(values: () => Iterable<T | PromiseLike<T>>) => Promise<T[]>) | undefined}
 */
let implementation;

/**
 * @param {(<T>(values: () => Iterable<T | PromiseLike<T>>) => Promise<T[]>) | undefined} impl
 */
export function _setParallelImplementation(impl) {
	implementation = impl;
}

/**
 * Resolves the given list of async values in parallel (i.e. via Promise.all) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 * @template T
 * @param {() => Iterable<T | PromiseLike<T>>} values A getter for the async values to resolve in parallel with batched change detection.
 * @return {Promise<T[]>} The resolved values.
 */
export async function parallel(values) {
	if (implementation) {
		return implementation(values);
	} else {
		return Promise.all(values());
	}
}

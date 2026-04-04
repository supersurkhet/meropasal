/**
 * Reactive Convex helpers for Svelte 5.
 * Provides useConvexQuery (real-time subscriptions) and useConvexMutation
 * with a client-first signature matching the pattern used throughout the codebase.
 */
import { type ConvexClient } from 'convex/browser';
import {
	type FunctionReference,
	type FunctionArgs,
	type FunctionReturnType,
} from 'convex/server';

/**
 * Subscribe to a Convex query with reactive args.
 * Uses the ConvexClient directly for subscriptions with Svelte 5 runes.
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
	client: ConvexClient,
	query: Query,
	args: () => FunctionArgs<Query> | 'skip',
) {
	let data = $state<FunctionReturnType<Query> | undefined>(undefined);
	let error = $state<Error | undefined>(undefined);
	let isLoading = $state(true);

	$effect(() => {
		const currentArgs = args();
		if (currentArgs === 'skip') {
			isLoading = false;
			data = undefined;
			return;
		}

		isLoading = true;
		error = undefined;

		const unsub = client.onUpdate(
			query,
			currentArgs,
			(result: FunctionReturnType<Query>) => {
				data = result;
				isLoading = false;
				error = undefined;
			},
			(err: Error) => {
				error = err;
				isLoading = false;
			},
		);

		return () => unsub();
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		},
		get isStale() {
			return false;
		},
	};
}

/**
 * Create a mutation caller with loading/error tracking.
 * Returns { mutate, isLoading, error }.
 */
export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
	client: ConvexClient,
	mutation: Mutation,
) {
	let isLoading = $state(false);
	let error = $state<Error | undefined>(undefined);

	return {
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		async mutate(args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> {
			isLoading = true;
			error = undefined;
			try {
				const result = await client.mutation(mutation, args);
				return result;
			} catch (e) {
				error = e instanceof Error ? e : new Error(String(e));
				throw e;
			} finally {
				isLoading = false;
			}
		},
	};
}

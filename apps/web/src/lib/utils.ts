import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T, El extends HTMLElement = HTMLElement> = T & {
	ref?: El | null;
};

export type WithoutChildren<T> = T extends { children?: unknown }
	? Omit<T, 'children'>
	: T;

export type WithoutChildrenOrChild<T> = T extends { children?: unknown; child?: unknown }
	? Omit<T, 'children' | 'child'>
	: WithoutChildren<T>;

export type WithChild<
	T,
	El extends HTMLElement = HTMLElement,
> = WithoutChildren<T> & {
	child?: Snippet<[{ props: Record<string, unknown>; ref: El | null }]>;
	children?: Snippet;
};

export type WithoutChild<T> = T extends { child?: unknown }
	? Omit<T, 'child'>
	: T;

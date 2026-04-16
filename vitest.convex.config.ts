import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	root: path.resolve(__dirname),
	test: {
		name: 'convex',
		environment: 'node',
		include: ['convex/**/*.bulk.test.ts'],
	},
})

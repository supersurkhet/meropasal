import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'
import { defineConfig } from 'vite'

export default defineConfig({
	server: {
		host: '127.0.0.1',
	},
	plugins: [tailwindcss(), sveltekit()],
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets: browserslistToTargets(browserslist('chrome >= 49')),
		},
	},
})

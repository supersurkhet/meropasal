/**
 * Progressively reveals skeleton rows instead of showing all at once.
 * Shows 1 skeleton immediately, then adds more with a delay between each.
 * If data arrives fast (e.g., only 1 record), the user never sees 6 empty skeletons.
 */
export function createStaggeredSkeletons(max = 6, interval = 150) {
	let count = $state(1)
	let timer: ReturnType<typeof setInterval> | undefined

	$effect(() => {
		count = 1
		timer = setInterval(() => {
			count++
			if (count >= max && timer) {
				clearInterval(timer)
				timer = undefined
			}
		}, interval)

		return () => {
			if (timer) {
				clearInterval(timer)
				timer = undefined
			}
		}
	})

	return {
		get count() {
			return count
		},
	}
}

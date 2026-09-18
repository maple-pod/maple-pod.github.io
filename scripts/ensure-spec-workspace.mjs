import { mkdir } from 'node:fs/promises'

const canonicalEmptyDirectories = [
	'changes',
	'decisions',
	'policies',
	'prds',
]
const specRoot = new URL('../.spec/', import.meta.url)

await Promise.all(canonicalEmptyDirectories
	.map(directory => mkdir(new URL(`${directory}/`, specRoot), { recursive: true })))

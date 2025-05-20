import { mergeProps } from 'vue'

export function mergeClasses(...classes: any[]) {
	return mergeProps(...classes.map(cls => ({ class: cls }))).class as any
}

export function omit(obj: any, ...keys: string[]) {
	const newObj = { ...obj }
	keys.forEach((key) => {
		delete newObj[key]
	})
	return newObj
}

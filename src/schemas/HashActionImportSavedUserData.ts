import { literal, object } from 'valibot'
import { SavedUserDataSchema } from './SavedUserData'

export const HashActionImportSavedUserDataSchema = object({
	type: literal('import-saved-user-data'),
	data: SavedUserDataSchema,
})

import { literal, object } from 'valibot'
import { PortableSavedUserDataSchema } from './SavedUserData'

export const HashActionImportSavedUserDataSchema = object({
	type: literal('import-saved-user-data'),
	data: PortableSavedUserDataSchema,
})

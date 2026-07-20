import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { ProfileSchema, JoinRoomSchema } from '$lib/schemas';

export const load = async () => {
	const profileForm = await superValidate(zod(ProfileSchema));
	const joinForm = await superValidate(zod(JoinRoomSchema));

	return { profileForm, joinForm };
};

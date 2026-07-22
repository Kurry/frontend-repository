import { customAlphabet } from 'nanoid';
import { NANOID_ALPHABET, NANOID_LENGTH } from './constants';

export const generateId = () => {
	return customAlphabet(NANOID_ALPHABET, NANOID_LENGTH)();
};

export const isValidId = (id: string) => {
	return new RegExp(`^([${NANOID_ALPHABET}]{10}|[${NANOID_ALPHABET}]{${NANOID_LENGTH}})$`).test(id);
};

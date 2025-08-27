export interface User {
    firstName?: string;

	lastName?: string;

	email: string | null;

	userGroup: string | null;

	password?: string;

	profilePicture?: string;

    token?: string;
}
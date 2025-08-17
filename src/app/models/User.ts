export interface User {
    firstName?: string;

	lastName?: string;

	email: string | null;

	profilePicture?: Blob;

    token?: string;

    refreshToken?: string;
}
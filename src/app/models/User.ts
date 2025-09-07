export interface User {
    alias: string | null;

	email: string;

	userGroup: string;

	password?: string;

	profilePicture?: string;

    token?: string;

	preferences? : {
		theme: string,
	}
}
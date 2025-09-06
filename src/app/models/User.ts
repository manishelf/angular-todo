export interface User {
    alias: string | null;

	email: string | null;

	userGroup: string | null;

	password?: string;

	profilePicture?: string;

    token?: string;

	preferences? : {
		theme: string,
	}
}
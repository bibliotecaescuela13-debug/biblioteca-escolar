// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			safeGetSession: () => Promise<{
				session: {
					user?: {
						email?: string;
					};
				} | null;
			}>;
		}
	}
}

export {};

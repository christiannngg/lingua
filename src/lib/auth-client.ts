import { createAuthClient } from "better-auth/react";

// the client-side auth helpers (for use in browser)
export const { signIn, signUp, signOut, useSession } = createAuthClient();

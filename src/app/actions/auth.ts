"use server";

// Next.js Server Actions that bridge forms to the auth engine

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signUpAction(formData: FormData) {
    // validate later (zod)
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        }
    });

    redirect("/onboarding" as never);
}

export async function signInAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    });

    redirect("/onboarding" as never);
}

export async function signOutAction() {
    await auth.api.signOut({
        headers: await headers()
    });

    redirect("/");
}

import { redirect } from "next/navigation";

// Email signup is disabled. All signups happen via Google OAuth on /login.
export default function SignupPage() {
  redirect("/login");
}

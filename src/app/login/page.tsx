// The login UI is rendered by AuthGuard (components/auth/LoginScreen) whenever there is no session,
// on any route. This route only exists so /login is a valid address; signed-in users are redirected.
export default function LoginRoute() {
  return null;
}

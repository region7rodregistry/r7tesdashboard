// The /login segment must NOT inherit the root dashboard skeleton
// (app/loading.tsx renders the authenticated TESDA header + registry table).
// While the async login page resolves (it awaits the session check), paint the
// login screen's navy backdrop so there's no flash of dashboard chrome.
export default function Loading() {
  return <main className="bg-tesda-header min-h-screen" />;
}

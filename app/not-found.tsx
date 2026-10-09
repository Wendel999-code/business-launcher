import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state full-page">
      <h1>This page hasn’t brewed yet.</h1>
      <p>We couldn’t find the workspace page you’re looking for.</p>
      <Link href="/" className="button primary">
        Back to overview
      </Link>
    </div>
  );
}

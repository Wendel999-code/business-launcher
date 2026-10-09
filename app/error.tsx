"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state full-page">
      <h1>Something interrupted your workspace.</h1>
      <p>Please try loading this page again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

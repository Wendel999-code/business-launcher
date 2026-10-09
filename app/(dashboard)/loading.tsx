export default function Loading() {
  return (
    <div className="loading-skeleton">
      <div />
      <section>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} />
        ))}
      </section>
      <div />
    </div>
  );
}

function BlogStatCard({ title, value, hint }) {
  return (
    <div className="blog-stat-card">
      <h4>{title}</h4>
      <p>{value}</p>
      {hint ? <span>{hint}</span> : null}
    </div>
  );
}

export default BlogStatCard;

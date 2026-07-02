function BlogSkeleton({ count = 3 }) {
  return (
    <div className="blog-skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="blog-skeleton-card">
          <div className="blog-skeleton-image" />
          <div className="blog-skeleton-line short" />
          <div className="blog-skeleton-line" />
          <div className="blog-skeleton-line" />
        </div>
      ))}
    </div>
  );
}

export default BlogSkeleton;

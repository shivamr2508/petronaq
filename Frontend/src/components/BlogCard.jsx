import { Link } from "react-router-dom";

function BlogCard({ blog }) {
  const imageUrl = blog.featuredImage || "/Pet00.png";
  const readableDate = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "Recently added";

  return (
    <article className="blog-card">
      <Link to={`/blog/${blog.slug}`} className="blog-card-image-wrap">
        <img src={imageUrl} alt={blog.title} loading="lazy" className="blog-card-image" />
      </Link>

      <div className="blog-card-content">
        <div className="blog-card-meta">
          <span>{blog.category || "General"}</span>
          <span>{blog.readingTime || 3} min read</span>
        </div>

        <h3>
          <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
        </h3>

        <p>{blog.excerpt || "Read this article for helpful pet care tips and product inspiration."}</p>

        <div className="blog-card-footer">
          <span>{readableDate}</span>
          <Link to={`/blog/${blog.slug}`} className="blog-link">
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BlogCard;

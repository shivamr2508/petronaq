import { Link } from "react-router-dom";
import "../styles/blog-card.css";

function BlogCard({ blog }) {
  const imageUrl = blog.featuredImage || "/Pet00.png";
  const readableDate = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "Recently added";

return (

    <article className="premium-blog-card">

        <Link
            to={`/blog/${blog.slug}`}
            className="premium-image-wrap"
        >

            <img
                src={imageUrl}
                alt={blog.title}
                loading="lazy"
                className="premium-image"
            />

            <span className="category-badge">

                {blog.category || "General"}

            </span>

            <span className="reading-badge">

                {blog.readingTime || 3} min

            </span>

        </Link>

        <div className="premium-content">

            <span className="publish-date">

                📅 {readableDate}

            </span>

            <h3>

                <Link to={`/blog/${blog.slug}`}>

                    {blog.title}

                </Link>

            </h3>

            <p>

                {blog.excerpt ||
                    "Discover useful pet care tips, nutrition advice and product recommendations."}

            </p>

            <Link
                to={`/blog/${blog.slug}`}
                className="read-btn"
            >

                Read Article →

            </Link>

        </div>

    </article>

);
}

export default BlogCard;

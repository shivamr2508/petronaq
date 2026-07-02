import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import BlogSkeleton from "../components/BlogSkeleton";
import { blogPublicService } from "../services/blogPublicService";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../config/site";
import "../styles/blog.css";

function BlogHomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredData, latestData, popularData, categoryData, tagData] = await Promise.all([
          blogPublicService.getFeaturedBlogs(),
          blogPublicService.getLatestBlogs(),
          blogPublicService.getPopularBlogs(),
          blogPublicService.getCategories(),
          blogPublicService.getTags(),
        ]);
        setFeatured(featuredData || []);
        setLatest(latestData || []);
        setPopular(popularData || []);
        setCategories(categoryData || []);
        setTags(tagData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    navigate(`/blog/search?q=${encodeURIComponent(search.trim())}`);
  };

  const featuredSlice = useMemo(() => featured.slice(0, 3), [featured]);

  return (
    <div className="blog-page">
      <Helmet>
        <title>{SITE_NAME} Blog | Tips, Guides & Pet Care Inspiration</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content={`${SITE_NAME} Blog | Tips, Guides & Pet Care Inspiration`} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${SITE_NAME} Blog | Tips, Guides & Pet Care Inspiration`} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
      </Helmet>

      <section className="blog-hero">
        <div className="blog-eyebrow">Pet care insights</div>
        <h1>Stories, tips, and product guides for happy pets</h1>
        <p>Discover practical advice for dog owners, cat parents, fish keepers, and bird lovers.</p>

        <form className="blog-hero-search" onSubmit={handleSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blog articles" />
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="blog-section">
        <div className="blog-section-header">
          <h2 className="blog-section-title">Featured articles</h2>
        </div>
        {loading ? <BlogSkeleton count={3} /> : <div className="blog-featured-grid">{featuredSlice.map((blog) => <BlogCard key={blog._id} blog={blog} />)}</div>}
      </section>

      <section className="blog-section">
        <div className="blog-section-header">
          <h2 className="blog-section-title">Categories</h2>
        </div>
        <div className="blog-pill-list">
          {categories.map((category) => (
            <Link key={category} to={`/blog/category/${encodeURIComponent(category)}`} className="blog-chip">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="blog-section">
        <div className="blog-section-header">
          <h2 className="blog-section-title">Popular topics</h2>
        </div>
        <div className="blog-chip-row">
          {tags.map((tag) => (
            <Link key={tag} to={`/blog/tag/${encodeURIComponent(tag)}`} className="blog-chip">
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="blog-section">
        <div className="blog-section-header">
          <h2 className="blog-section-title">Latest articles</h2>
          <Link to="/blog/list" className="blog-link">View all</Link>
        </div>
        {loading ? <BlogSkeleton count={3} /> : <div className="blog-section-grid">{latest.map((blog) => <BlogCard key={blog._id} blog={blog} />)}</div>}
      </section>

      <section className="blog-section">
        <div className="blog-section-header">
          <h2 className="blog-section-title">Most read</h2>
        </div>
        {loading ? <BlogSkeleton count={3} /> : <div className="blog-section-grid">{popular.map((blog) => <BlogCard key={blog._id} blog={blog} />)}</div>}
      </section>

      <section className="blog-newsletter">
        <h3>Stay in the loop</h3>
        <p>Get seasonal pet care tips and new product recommendations in your inbox.</p>
        <form>
          <input placeholder="Your email" />
          <button type="button">Subscribe</button>
        </form>
      </section>
    </div>
  );
}

export default BlogHomePage;

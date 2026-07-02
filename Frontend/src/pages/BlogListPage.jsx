import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import BlogSkeleton from "../components/BlogSkeleton";
import Breadcrumbs from "../components/Breadcrumbs";
import { blogPublicService } from "../services/blogPublicService";
import { SITE_NAME, SITE_URL } from "../config/site";
import "../styles/blog.css";

function BlogListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(q);
  const [filterCategory, setFilterCategory] = useState(category);
  const [filterTag, setFilterTag] = useState(tag);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [listData, categoryData, tagData] = await Promise.all([
          blogPublicService.getBlogs({ page, limit: 9, search: q, category: category, tag: tag }),
          blogPublicService.getCategories(),
          blogPublicService.getTags(),
        ]);
        setBlogs(listData.blogs || []);
        setTotalPages(listData.pages || 1);
        setCategories(categoryData || []);
        setTags(tagData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page, q, category, tag]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (filterCategory) params.set("category", filterCategory);
    if (filterTag) params.set("tag", filterTag);
    navigate(`/blog/list?${params.toString()}`);
    setPage(1);
  };

  const heading = useMemo(() => {
    if (category) return `Category: ${category}`;
    if (tag) return `Tag: ${tag}`;
    if (q) return `Search: ${q}`;
    return "All blog articles";
  }, [category, tag, q]);

  return (
    <div className="blog-page">
      <Helmet>
        <title>{heading} | {SITE_NAME} Blog</title>
        <meta name="description" content="Browse pet care articles, product tips, and helpful guides from PetRonaq." />
        <link rel="canonical" href={`${SITE_URL}/blog/list${location.search}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${heading} | ${SITE_NAME} Blog`} />
        <meta name="twitter:description" content="Browse pet care articles, product tips, and helpful guides from PetRonaq." />
      </Helmet>

      <Breadcrumbs items={[{ label: heading }]} />

      <section className="blog-section-card blog-list-card">
        <h1 className="blog-list-title">{heading}</h1>
        <p className="blog-section-intro">Browse helpful content for your pet care routine and product choices.</p>

        <form className="blog-list-filters" onSubmit={handleSubmit}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blog posts" />
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((categoryItem) => <option key={categoryItem} value={categoryItem}>{categoryItem}</option>)}
          </select>
          <select value={filterTag} onChange={(event) => setFilterTag(event.target.value)}>
            <option value="">All tags</option>
            {tags.map((tagItem) => <option key={tagItem} value={tagItem}>{tagItem}</option>)}
          </select>
          <button type="submit">Filter</button>
        </form>

        {loading ? <BlogSkeleton count={6} /> : (
          <div className="blog-list-grid">
            {blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
          </div>
        )}

        <div className="blog-pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}

export default BlogListPage;

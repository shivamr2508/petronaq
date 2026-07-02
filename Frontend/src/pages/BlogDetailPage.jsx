import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Breadcrumbs from "../components/Breadcrumbs";
import BlogCard from "../components/BlogCard";
import BlogSkeleton from "../components/BlogSkeleton";
import { blogPublicService } from "../services/blogPublicService";
import { SITE_NAME, SITE_URL } from "../config/site";
import "../styles/blog.css";

function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [prevBlog, setPrevBlog] = useState(null);
  const [nextBlog, setNextBlog] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const articleRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [blogData, relatedData] = await Promise.all([
          blogPublicService.getBlogBySlug(slug),
          blogPublicService.getRelatedBlogs(slug),
        ]);
        setBlog(blogData);
        setRelated(relatedData || []);
        setProducts((blogData?.relatedProducts || []).slice(0, 3));
        const siblings = await blogPublicService.getBlogs({ limit: 50, page: 1 });
        const list = siblings.blogs || [];
        const index = list.findIndex((item) => item.slug === slug);
        if (index >= 0) {
          setPrevBlog(list[index - 1] || null);
          setNextBlog(list[index + 1] || null);
        }
      } catch {
        toast.error("Unable to load blog");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const element = document.documentElement;
      const scrollTop = element.scrollTop || document.body.scrollTop;
      const height = element.scrollHeight - element.clientHeight;
      const percent = height > 0 ? (scrollTop / height) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toc = useMemo(() => {
    if (!blog?.content) return [];
    const headings = Array.from(blog.content.matchAll(/<h([2-3])[^>]*>(.*?)<\/h\1>/gi));
    return headings.map((match, index) => {
      const text = match[2].replace(/<[^>]+>/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `section-${index + 1}`;
      return { level: Number(match[1]), text, id };
    });
  }, [blog]);

  useEffect(() => {
    if (!blog?.content) return;

    const container = articleRef.current;
    if (!container) return;

    const headingElements = Array.from(container.querySelectorAll("h2, h3"));
    const ids = new Set();
    headingElements.forEach((heading, index) => {
      const rawText = heading.textContent?.trim() || "";
      const baseId = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `section-${index + 1}`;
      let id = baseId;
      let suffix = 1;
      while (ids.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      ids.add(id);
      heading.id = id;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveHeading(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.2, 0.5, 0.8] }
    );

    headingElements.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [blog]);

  const shareLinks = useMemo(() => {
    const url = typeof window !== "undefined" ? window.location.href : `${SITE_URL}/blog/${slug}`;
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blog?.title || "")}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${blog?.title || ""} ${url}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blog?.title || "")}`,
    };
  }, [blog, slug]);

  const handleCopyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `${SITE_URL}/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      toast.error("Sharing is not supported on this device");
      return;
    }

    const url = typeof window !== "undefined" ? window.location.href : `${SITE_URL}/blog/${slug}`;
    try {
      await navigator.share({ title: blog?.title || SITE_NAME, text: blog?.excerpt || "", url });
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Share canceled");
      }
    }
  };

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      const response = await fetch(`${SITE_URL}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        throw new Error("Subscription failed");
      }
      toast.success("Subscribed successfully");
      setNewsletterEmail("");
    } catch {
      toast.error("Subscription failed");
    }
  };

  if (loading) {
    return (
      <div className="blog-page">
        <BlogSkeleton count={4} />
      </div>
    );
  }

  if (!blog) {
    return <div className="blog-page"><p>Blog not found.</p></div>;
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>{blog.metaTitle || blog.title} | {SITE_NAME} Blog</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={blog.canonical || `${SITE_URL}/blog/${blog.slug}`} />
        <meta property="og:title" content={blog.metaTitle || blog.title} />
        <meta property="og:description" content={blog.metaDescription || blog.excerpt} />
        <meta property="og:image" content={blog.featuredImage || blog.ogImage || `${SITE_URL}/Pet00.png`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/blog/${blog.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.metaTitle || blog.title} />
        <meta name="twitter:description" content={blog.metaDescription || blog.excerpt} />
        <meta name="twitter:image" content={blog.featuredImage || blog.ogImage || `${SITE_URL}/Pet00.png`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: blog.title,
          description: blog.metaDescription || blog.excerpt,
          image: blog.featuredImage || blog.ogImage || `${SITE_URL}/Pet00.png`,
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/Pet00.png` } },
          datePublished: blog.publishedAt,
          mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${blog.slug}` },
          keywords: (blog.tags || []).join(", "),
        })}</script>
        {blog.faq?.length ? <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: blog.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        })}</script> : null}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [{ "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` }, { "@type": "ListItem", position: 2, name: blog.category || "Blog", item: `${SITE_URL}/blog/list?category=${encodeURIComponent(blog.category || "")}` }, { "@type": "ListItem", position: 3, name: blog.title, item: `${SITE_URL}/blog/${blog.slug}` }],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/Pet00.png`,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/blog/list?q={search_term_string}`, "query-input": "required name=search_term_string" },
        })}</script>
      </Helmet>

      <div className="blog-progress-bar"><div className="blog-progress-fill" style={{ width: `${progress}%` }} /></div>

      <Breadcrumbs items={[{ label: blog.category || "Blog" }, { label: blog.title }]} />

      <div className="blog-article-shell">
        <article className="blog-article-card">
          <div className="blog-article-meta">
            <span>{blog.category || "General"}</span>
            <span>{blog.readingTime || 3} min read</span>
            <span>{blog.views || 0} views</span>
          </div>

          <h1 className="blog-article-title">{blog.title}</h1>
          <p className="blog-article-excerpt">{blog.excerpt}</p>

          <img src={blog.featuredImage || "/Pet00.png"} alt={blog.title} loading="eager" decoding="async" />

          <div className="blog-article-content" ref={articleRef} dangerouslySetInnerHTML={{ __html: blog.content }} />

          <div className="blog-share-row">
            <button type="button" className="blog-share-btn" onClick={handleCopyLink}>Copy Link</button>
            <a className="blog-share-btn" href={shareLinks.facebook} target="_blank" rel="noreferrer">Facebook</a>
            <a className="blog-share-btn" href={shareLinks.twitter} target="_blank" rel="noreferrer">Twitter</a>
            <a className="blog-share-btn" href={shareLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="blog-share-btn" href={shareLinks.telegram} target="_blank" rel="noreferrer">Telegram</a>
            <a className="blog-share-btn" href={shareLinks.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
            <button type="button" className="blog-share-btn" onClick={handleNativeShare}>Share</button>
          </div>

          <div className="blog-prev-next">
            <Link to={prevBlog ? `/blog/${prevBlog.slug}` : "/blog"} className="blog-side-card">
              <strong>Previous</strong>
              <p>{prevBlog ? prevBlog.title : "Back to blog home"}</p>
            </Link>
            <Link to={nextBlog ? `/blog/${nextBlog.slug}` : "/blog"} className="blog-side-card">
              <strong>Next</strong>
              <p>{nextBlog ? nextBlog.title : "Back to blog home"}</p>
            </Link>
          </div>
        </article>

        <aside>
          {toc.length ? <div className="blog-sticky-toc"><h3>Table of contents</h3><ul>{toc.map((item, index) => <li key={`${item.text}-${index}`}><a href={`#${item.id}`} className={activeHeading === item.id ? "active-toc" : ""}>{item.text}</a></li>)}</ul></div> : null}
          <div className="blog-side-card" style={{ marginTop: 16 }}>
            <h3>Related products</h3>
            <div className="blog-product-grid">
              {products.length ? products.map((product) => (
                <Link key={product._id || product.slug} to={`/products/${product.slug || product._id}`} className="blog-product-card">
                  <img src={product.images?.[0] || "/Product.png"} alt={product.name} loading="lazy" />
                  <h4>{product.name}</h4>
                  <p>₹{product.price}</p>
                </Link>
              )) : <p>No related products yet.</p>}
            </div>
          </div>

          <div className="blog-side-card" style={{ marginTop: 16 }}>
            <h3>Related blogs</h3>
            <div className="blog-related-grid">
              {related.map((item) => <BlogCard key={item._id} blog={item} />)}
            </div>
          </div>
        </aside>
      </div>

      <section className="blog-newsletter" style={{ marginTop: 20 }}>
        <h3>Want more pet tips?</h3>
        <p>Subscribe for easy care ideas and new product finds.</p>
        <form onSubmit={handleNewsletterSubmit}>
          <input type="email" placeholder="Email address" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} aria-label="Email address" />
          <button type="submit">Join</button>
        </form>
      </section>

      <section className="blog-cta-box" style={{ marginTop: 20 }}>
        <h3>Find the right products for your pet</h3>
        <p>Explore premium essentials for your furry friends.</p>
        <Link className="blog-primary-btn" to="/products">Shop now</Link>
      </section>
    </div>
  );
}

export default BlogDetailPage;

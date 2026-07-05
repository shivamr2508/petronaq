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

    <div className="hero-left">

        <span className="hero-badge">
            🐾 Pet Care Knowledge Hub
        </span>

        <h1>
            Everything Your Pet
            Needs To Live
            A Happy Life.
        </h1>

        <p>
            Expert pet care guides, nutrition tips,
            health advice, grooming secrets and
            product recommendations trusted by
            thousands of pet parents.
        </p>

        <form
            className="hero-search"
            onSubmit={handleSearch}
        >

            <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Search pet care articles..."
            />

            <button type="submit">
                Search
            </button>

        </form>

        <div className="hero-stats">

            <div className="stat-card">

                <h3>500+</h3>

                <span>
                    Articles
                </span>

            </div>

            <div className="stat-card">

                <h3>50+</h3>

                <span>
                    Categories
                </span>

            </div>

            <div className="stat-card">

                <h3>100K+</h3>

                <span>
                    Readers
                </span>

            </div>

        </div>

    </div>

    <div className="hero-right">

        <div className="hero-image">

            <img
                src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80"
                alt="Dog"
            />

        </div>

        <div className="floating-card top">

            ⭐ Featured Guides

        </div>

        <div className="floating-card bottom">

            ❤️ Pet Experts

        </div>

    </div>

</section>

      <section className="featured-section">

    <div className="section-heading">

        <span className="section-badge">
            ⭐ Featured Articles
        </span>

        <h2>
            Editor's Picks
        </h2>

        <p>
            Hand-picked pet care articles every pet parent should read.
        </p>

    </div>

    {loading ? (

        <BlogSkeleton count={3}/>

    ) : (

        <div className="featured-layout">

            {featuredSlice.length > 0 && (

                <div className="featured-main">

                    <BlogCard
                        blog={featuredSlice[0]}
                        featured
                    />

                </div>

            )}

            <div className="featured-side">

                {featuredSlice
                    .slice(1)
                    .map(blog=>(
                        <BlogCard
                            key={blog._id}
                            blog={blog}
                        />
                    ))}

            </div>

        </div>

    )}

</section>

      <section className="blog-category-section">

  <div className="section-heading">

    <span className="section-badge">
      Browse Categories
    </span>

    <h2>
      Find Articles By Category
    </h2>

    <p>
      Explore pet care articles based on your favourite pet.
    </p>

  </div>

  <div className="category-grid">

    {categories && categories.length > 0 ? (

      categories.map((item, index) => {

        const category =
          typeof item === "string"
            ? item
            : item?.name || item?.title || "";

        let icon = "🐾";
        let color = "default";

        switch (category.toLowerCase()) {

          case "dog":
          case "dogs":
          case "dog food":
            icon = "🐶";
            color = "dog";
            break;

          case "cat":
          case "cats":
          case "cat food":
            icon = "🐱";
            color = "cat";
            break;

          case "fish":
            icon = "🐠";
            color = "fish";
            break;

          case "bird":
          case "birds":
            icon = "🦜";
            color = "bird";
            break;

          case "health":
            icon = "❤️";
            color = "health";
            break;

          case "nutrition":
            icon = "🥩";
            color = "nutrition";
            break;

          default:
            icon = "🐾";
        }

        return (

          <Link
            key={index}
            to={`/blog/category/${encodeURIComponent(category)}`}
            className={`category-card ${color}`}
          >

            <div className="category-icon">
              {icon}
            </div>

            <h3>
              {category}
            </h3>

            <p>
              Explore helpful guides
            </p>

          </Link>

        );

      })

    ) : (

      <div className="empty-category">

        No Categories Available

      </div>

    )}

  </div>

</section>

      <section className="topics-section">

    <div className="section-heading">

        <span className="section-badge">

            🔥 Trending Topics

        </span>

        <h2>

            Explore Popular Topics

        </h2>

        <p>

            Discover what pet parents are reading the most.

        </p>

    </div>

    <div className="topics-grid">

        {

            tags.length>0 ?

            tags.map(tag=>(

                <Link

                    key={tag}

                    to={`/blog/tag/${encodeURIComponent(tag)}`}

                    className="topic-pill"

                >

                    #{tag}

                </Link>

            ))

            :

            <div className="empty-topics">

                No Topics Yet

            </div>

        }

    </div>

</section>

      <section className="latest-section">

    <div className="section-header">

        <div>

            <span className="section-badge">

                📰 Latest Articles

            </span>

            <h2>

                Fresh Pet Care Guides

            </h2>

            <p>

                Recently published articles from our experts.

            </p>

        </div>

        <Link
            to="/blog/list"
            className="view-all-btn"
        >

            View All →

        </Link>

    </div>

    {

        loading ?

        (

            <BlogSkeleton count={6}/>

        )

        :

        (

            <div className="latest-grid">

                {

                    latest.map(blog=>(

                        <BlogCard

                            key={blog._id}

                            blog={blog}

                        />

                    ))

                }

            </div>

        )

    }

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

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/productDetails.css";
import { addToCart } from "../services/cartService";
import { addToWishlist } from "../services/wishlistService";
import { showSuccess, showError } from "../utils/toast";
import { API_BASE } from "../config/api";
import { Helmet } from "react-helmet-async";

function Star({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#ffb400" : "#e6e6e6"}
      aria-hidden="true"
    >
      <path d="M12 .587l3.668 7.431L23.6 9.75l-5.4 5.268L19.335 24 12 19.897 4.665 24l1.135-8.982L.4 9.75l7.932-1.732z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductCard({ item, onClick }) {
  return (
    <article 
      className="mini-card" 
      aria-label={item.name}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <img src={item.images?.[0] || item.image || "/placeholder.png"} alt={item.name} />
      <div className="mini-card-body">
        <h4>{item.name}</h4>
        <div className="mini-price">₹{item.discountPrice || item.price}</div>
      </div>
    </article>
  );
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: "50%", y: "50%" });
  const imageWrapRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [accordionOpen, setAccordionOpen] = useState({ details: true, ingredients: false, shipping: false });
  
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/products/${slug}`);
        console.log("PRODUCT DATA:", response.data);
        setProduct(response.data);
        setSelectedIndex(0);
        if (response.data?.slug && response.data.slug !== slug) {
          navigate(`/products/${response.data.slug}`, { replace: true });
          return;
        }
        await fetchRelatedProducts(response.data);
        await fetchReviews(response.data._id);
      } catch (err) {
        console.error(err);
        setProduct(null);
      }
    };

    const fetchReviews = async (productId) => {
      try {
        const res = await axios.get(`${API_BASE}/api/reviews/${productId}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchRelatedProducts = async (currentProduct) => {
      setRelatedLoading(true);
      try {
        const currentProductId = String(currentProduct._id).trim();
        const currentProductCategory =
  currentProduct.categories?.[0] || "";
        
        console.log("=== RELATED PRODUCTS FETCH DEBUG ===");
        console.log("Current Product ID:", currentProductId);
        console.log("Current Product Name:", currentProduct.name);
        console.log("Current Product Category:", currentProductCategory);
        console.log("Categories:", currentProduct.categories);
        
        let relatedProductsList = [];

        // Step 1: Try to fetch products from same category
        if (currentProductCategory && currentProductCategory !== "") {
          try {
            console.log(`Fetching products with category=${currentProductCategory}`);
            const categoryRes = await axios.get(
              `${API_BASE}/api/products?category=${encodeURIComponent(currentProductCategory)}&limit=20`
            );
            
            console.log("Category API Response:", categoryRes.data);
            
            const categoryProducts = Array.isArray(categoryRes.data.products) 
              ? categoryRes.data.products 
              : Array.isArray(categoryRes.data)
              ? categoryRes.data
              : [];

            console.log(`Received ${categoryProducts.length} products from category`);
            
            // Log each product's category for verification
            categoryProducts.forEach((p, idx) => {
              console.log(`Product ${idx}: ${p.name} (Category: ${p.category})`);
            });

            // Filter: exclude current product and take first 4
            relatedProductsList = categoryProducts
              .filter(p => {
                const pId = String(p._id).trim();
                const isNotCurrent = pId !== currentProductId;
                console.log(`Checking ${p.name}: ID=${pId}, IsCurrent=${!isNotCurrent}`);
                return isNotCurrent;
              })
              .slice(0, 4);

            console.log(`After filtering, got ${relatedProductsList.length} related products from category`);
          } catch (categoryErr) {
            console.warn("Category fetch failed:", categoryErr);
          }
        } else {
          console.warn("Current product has no category or category is empty");
        }

        // Step 2: If fewer than 4 products from category, fetch all products to fill slots
        if (relatedProductsList.length < 4) {
          try {
            console.log(`Need ${4 - relatedProductsList.length} more products, fetching all...`);
            const allRes = await axios.get(`${API_BASE}/api/products?limit=30`);
            
            const allProducts = Array.isArray(allRes.data.products)
              ? allRes.data.products
              : Array.isArray(allRes.data)
              ? allRes.data
              : [];

            console.log(`Received ${allProducts.length} total products`);

            // Get product IDs already in relatedProductsList to avoid duplicates
            const existingIds = new Set(relatedProductsList.map(p => String(p._id).trim()));
            existingIds.add(currentProductId);

            console.log(`Existing IDs (excluding current): ${existingIds.size} products`);

            // Add products until we have 4
            const remainingSlots = 4 - relatedProductsList.length;
            const fillProducts = allProducts
              .filter(p => {
                const pId = String(p._id).trim();
                const isNotUsed = !existingIds.has(pId);
                return isNotUsed;
              })
              .slice(0, remainingSlots);

            console.log(`Filled ${fillProducts.length} additional products`);

            relatedProductsList = [...relatedProductsList, ...fillProducts];
          } catch (allErr) {
            console.warn("Fallback products fetch failed:", allErr);
          }
        }

        // Step 3: Final validation and set results
        const finalList = relatedProductsList.slice(0, 4);
        console.log(`Final related products list (${finalList.length} items):`);
        finalList.forEach((p, idx) => {
          console.log(`${idx + 1}. ${p.name} (Category: ${p.category})`);
        });
        console.log("====================================");
        
        setRelatedProducts(finalList);
      } catch (err) {
        console.error("Error fetching related products:", err);
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const images = (product?.images && product.images.length) ? product.images : [product?.image || "/placeholder.png"];
  const canonicalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/products/${product?.slug || slug || ""}`
    : "";

  const handleImageMove = (e) => {
    if (!imageWrapRef.current) return;
    const rect = imageWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: `${x}%`, y: `${y}%` });
  };

  const handleAddToWishlist = async () => {
    try {
      await addToWishlist(product._id);
      showSuccess("Added to wishlist ❤️");
    } catch (err) {
      showError("Please login first");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock === 0) return showError("Product is out of stock");
    if (quantity > product.stock) return showError(`Only ${product.stock} available in stock`);
    try {
      await addToCart(product._id, quantity);
      showSuccess("Added to cart 🛒");
    } catch (err) {
      showError("Please login first");
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.stock === 0) return showError("Product is out of stock");
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login first");
      setTimeout(() => navigate("/login"), 900);
      return;
    }
    navigate(`/checkout?productId=${product._id}&qty=${quantity}`);
  };

  if (!product) {
    return (
      <div className="loading" style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Product not found</h2>
        <p>The product you are looking for does not exist or may have been removed.</p>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const saveAmount = hasDiscount ? product.price - product.discountPrice : 0;

  return (
  <>
    <Helmet>
  <title>
    {product?.name
      ? `${product.name} | PetRonaq`
      : "PetRonaq"}
  </title>

  <meta
    name="description"
    content={
      product?.smallDescription ||
      product?.description ||
      "Buy premium pet products online from PetRonaq"
    }
  />

  <meta
    property="og:title"
    content={product?.name}
  />

  <meta
    property="og:description"
    content={
      product?.smallDescription ||
      product?.description
    }
  />

  <meta
    property="og:image"
    content={product?.images?.[0]}
  />

  <meta
    property="og:url"
    content={canonicalUrl}
  />

  <link rel="canonical" href={canonicalUrl} />

  <script type="application/ld+json">
    {JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product?.name,
        url: canonicalUrl,
        image: product?.images?.[0],
        description:
          product?.smallDescription ||
          product?.description,
        brand: {
          "@type": "Brand",
          name: "PetRonaq",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price:
            product?.discountPrice ||
            product?.price,
          availability:
            product?.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.petronaq.in/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Products",
            item: "https://www.petronaq.in/products",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product?.name,
            item: canonicalUrl,
          },
        ],
      },
    ])}
  </script>
</Helmet>

    <main className="pd-page">
      <div className="product-details-wrapper">
        <section className="product-left">
          <div className="product-gallery glass">
            <div
              className="main-image-container"
              ref={imageWrapRef}
              onMouseMove={handleImageMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => { setIsZoomed(false); setZoomOrigin({ x: "50%", y: "50%" }); }}
            >
              <img
                src={images[selectedIndex]}
                alt={product.name}
                className={`main-image ${isZoomed ? "zoomed" : ""}`}
                style={{ transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}` }}
              />

              {hasDiscount && (
  <div className="discount-badge image-badge">
    {discountPercent}% OFF
  </div>
)}

              <button className="wishlist-btn" onClick={handleAddToWishlist} aria-label="Add to wishlist">
                <span className="heart" aria-hidden>❤</span>
              </button>
            </div>

            <div className="thumbnail-row" role="list">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`thumbnail ${selectedIndex === i ? "active" : ""}`}
                  onClick={() => setSelectedIndex(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="product-right">
          <div className="product-info glass">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-subtitle">{product.smallDescription}</p>

            <div className="rating-row">
              <div className="stars" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} filled={i < Math.round(product.avgRating || 0)} />
                ))}
              </div>
              <a href="#reviews" className="review-count">{reviews.length} reviews</a>
            </div>

            <div className="price-row">
              <div className="price-main">
                <div className="current-price">₹{hasDiscount ? product.discountPrice : product.price}</div>
              </div>
            </div>

            <div className="stock-row">
              <span className={`stock-badge ${product.stock > 0 ? "in" : "out"}`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
              </span>
              {hasDiscount && <div className="save">You save ₹{saveAmount}</div>}
            </div>

            <div className="purchase-card">
              <div className="qty-selector" role="group" aria-label="Quantity selector">
                <button onClick={() => setQuantity(q => (q > 1 ? q - 1 : 1))} aria-label="Decrease quantity">−</button>
                <input aria-label="Quantity" value={quantity} readOnly />
                <button onClick={() => setQuantity(q => (q < product.stock ? q + 1 : q))} aria-label="Increase quantity">+</button>
              </div>

              <button
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                className="btn add-cart"
                aria-disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <button className="btn buy-now" onClick={handleBuyNow}>Buy Now</button>

              <ul className="trust-list" aria-hidden>
                <li><CheckIcon /> 100% Genuine Products</li>
                <li><CheckIcon /> Fast Delivery</li>
                <li><CheckIcon /> Secure Payments</li>
                <li><CheckIcon /> Easy Returns</li>
              </ul>
            </div>

            <div className="accordion">
              <button className="acc-head" onClick={() => setAccordionOpen(s => ({ ...s, details: !s.details }))} aria-expanded={accordionOpen.details}>
                <strong>Product Details</strong>
                <span className={`chev ${accordionOpen.details ? 'open' : ''}`} aria-hidden>▾</span>
              </button>
              {accordionOpen.details && (
                <div className="acc-body">
                  <p>{product.description}</p>
                </div>
              )}

              <button className="acc-head" onClick={() => setAccordionOpen(s => ({ ...s, ingredients: !s.ingredients }))} aria-expanded={accordionOpen.ingredients}>
                <strong>Ingredients & Usage</strong>
                <span className={`chev ${accordionOpen.ingredients ? 'open' : ''}`} aria-hidden>▾</span>
              </button>
              {accordionOpen.ingredients && (
                <div className="acc-body">
                  <p>{product.ingredients || 'Not specified'}</p>
                </div>
              )}

              <button className="acc-head" onClick={() => setAccordionOpen(s => ({ ...s, shipping: !s.shipping }))} aria-expanded={accordionOpen.shipping}>
                <strong>Shipping & Returns</strong>
                <span className={`chev ${accordionOpen.shipping ? 'open' : ''}`} aria-hidden>▾</span>
              </button>
              {accordionOpen.shipping && (
                <div className="acc-body">
                  <p>Free delivery in 3–5 business days. Returns within 7 days.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <section id="reviews" className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews-grid">
          {reviews.length === 0 && <div className="muted">No reviews yet</div>}
          {reviews.map(r => (
            <article key={r._id} className="review-card">
              <div className="avatar">{r.user?.name?.[0] || 'U'}</div>
              <div className="review-body">
                <div className="review-header">
                  <strong>{r.user?.name}</strong>
                  {r.isVerifiedPurchase && <span className="verified">Verified Purchase</span>}
                </div>
                <div className="stars-inline" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < r.rating} />)}
                </div>
                <p className="comment">{r.comment}</p>
                {r.images && r.images.length > 0 && (
                  <div className="review-images">
                    {r.images.map((img, idx) => (
                      <img key={idx} src={`${API_BASE}${img}`} alt={`review-${idx}`} />
                    ))}
                  </div>
                )}
                {r.adminReply && (
                  <div className="admin-reply">
                    <strong>PetRonaq Reply:</strong>
                    <p>{r.adminReply}</p>
                  </div>
                )}
                <small className="muted">{new Date(r.createdAt).toLocaleDateString()}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="related-section">
        <h3>Related Products</h3>
        {relatedLoading && <div className="muted">Loading related products...</div>}
        {!relatedLoading && relatedProducts.length === 0 && <div className="muted">No related products found</div>}
        {!relatedLoading && relatedProducts.length > 0 && (
          <div className="related-grid">
            {relatedProducts.map(p => (
              <ProductCard 
                key={p._id} 
                item={p}
                onClick={() => navigate(`/product/${p.slug || p._id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="fbt-section">
        <h3>Frequently Bought Together</h3>
        <div className="fbt-cards">
          <ProductCard 
            item={product}
            onClick={() => navigate(`/product/${product.slug || product._id}`)}
          />
          <div className="plus">+</div>
          <div className="combo-card">
            <div>Suggested combo item</div>
            <div className="combo-price">₹199</div>
            <button className="btn small">Add Combo</button>
          </div>
        </div>
      </section>

      <section className="tips-section">
        <h3>Pet Care Tips</h3>
        <div className="tips-grid">
          <article className="tip">Keep fresh water available at all times.</article>
          <article className="tip">Maintain a regular feeding schedule to avoid overfeeding.</article>
          <article className="tip">Schedule regular vet check-ups for preventive care.</article>
        </div>
      </section>

      <section className="recently-section">
        <h3>Recently Viewed</h3>
        <div className="recent-grid">
          <div className="placeholder-card" />
          <div className="placeholder-card" />
          <div className="placeholder-card" />
        </div>
      </section>

      <div className="mobile-sticky">
        <div className="mobile-price">
          <div>₹{hasDiscount ? product.discountPrice : product.price}</div>
          {hasDiscount && <div className="small-old">₹{product.price}</div>}
        </div>
        <div className="mobile-actions">
          <button className="btn small" onClick={handleAddToCart}>Add</button>
          <button className="btn buy-now small" onClick={handleBuyNow}>Buy</button>
        </div>
           </div>
    </main>
  </>
);
}
  
  
  



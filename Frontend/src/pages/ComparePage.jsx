import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import { Helmet } from "react-helmet-async";
import "../styles/comparePage.css";

/* ═══════════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════════ */

const TABLE_ROWS = [
  {
    key: "price",
    label: "Price",
    icon: "💰",
    getVal: (p) =>
      p.discountPrice || p.price
        ? `₹${(p.discountPrice || p.price).toLocaleString("en-IN")}`
        : null,
  },
  { key: "brand",       label: "Brand",       icon: "🏢", getVal: () => null },
  {
    key: "foodType",
    label: "Food Type",
    icon: "🍖",
    getVal: (p) => (p.categories?.length ? p.categories.join(", ") : null),
  },
  {
    key: "suitableFor",
    label: "Suitable For",
    icon: "🐾",
    getVal: (p) => (p.petTypes?.length ? p.petTypes.join(", ") : null),
  },
  { key: "weight",      label: "Weight",      icon: "⚖️", getVal: () => null },
  { key: "lifeStage",   label: "Life Stage",  icon: "🐣", getVal: () => null },
  { key: "breed",       label: "Breed",       icon: "🧬", getVal: () => null },
  { key: "ingredients", label: "Ingredients", icon: "🌿", getVal: () => null },
  { key: "protein",     label: "Protein %",   icon: "💪", getVal: () => null },
  { key: "fat",         label: "Fat %",       icon: "🥑", getVal: () => null },
  { key: "fiber",       label: "Fiber %",     icon: "🌾", getVal: () => null },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

function formatBreed(breed) {
  if (!breed) return null;
  return breed
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function shortId(id) {
  if (!id) return "";
  return String(id).slice(-8).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Loading State (full-page)
   ═══════════════════════════════════════════════════════════════════════════════ */

function LoadingState({ phase }) {
  const msg = phase === "creating"
    ? "Setting up your comparison…"
    : "Loading comparison…";
  const sub = phase === "creating"
    ? "Generating canonical URL — just a moment."
    : null;

  return (
    <main className="cp-page">
      <div className="cp-loading-state" aria-live="polite" aria-label={msg}>
        <div className="cp-loading-ring" aria-hidden="true">
          <div /><div /><div /><div />
        </div>
        <p className="cp-loading-text">{msg}</p>
        {sub && <p className="cp-loading-sub">{sub}</p>}
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Error State (full-page, user-friendly)
   ═══════════════════════════════════════════════════════════════════════════════ */

function ErrorState({ type, onRetry }) {
  const cfg = {
    not_found: {
      icon: "🔍",
      title: "Comparison Not Found",
      desc: "This comparison doesn't exist or may have been removed.",
    },
    server_error: {
      icon: "😕",
      title: "Something Went Wrong",
      desc: "We couldn't load this comparison. Please try again.",
      retry: true,
    },
    no_products: {
      icon: "📦",
      title: "No Products Selected",
      desc: "Please select products to compare from a product page.",
    },
  }[type] ?? {
    icon: "😕",
    title: "Something Went Wrong",
    desc: "An unexpected error occurred.",
    retry: true,
  };

  return (
    <main className="cp-page">
      <div className="cp-error-state" role="alert">
        <span className="cp-error-icon" aria-hidden="true">{cfg.icon}</span>
        <h2 className="cp-error-title">{cfg.title}</h2>
        <p className="cp-error-desc">{cfg.desc}</p>
        <div className="cp-error-actions">
          {cfg.retry && onRetry && (
            <button className="cp-error-retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )}
          <Link to="/products" className="cp-btn-back">
            ← Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }) {
  return (
    <span className={`cp-status-badge cp-status-badge--${status}`}>
      {status === "completed" ? "✅ Completed" : "⏳ Draft"}
    </span>
  );
}

/* ─── VS Hero ────────────────────────────────────────────────────────────────── */
function VSHero({ products }) {
  return (
    <div className={`cp-vs-hero cp-vs-hero--${products.length}p`} aria-label="Product comparison header">
      {products.map((p, i) => (
        <React.Fragment key={p._id}>
          <div className="cp-vs-product">
            <div className="cp-vs-img-wrap">
              <img
                className="cp-vs-img"
                src={p.images?.[0] || "/placeholder.png"}
                alt={p.name}
              />
              {i === 0 && (
                <span className="cp-vs-current-badge" aria-label="Currently viewed product">
                  Current
                </span>
              )}
            </div>
            <div className="cp-vs-info">
              <h2 className="cp-vs-name">{p.name}</h2>
              <div className="cp-vs-price">
                ₹{(p.discountPrice || p.price).toLocaleString("en-IN")}
              </div>
              {p.discountPrice && p.discountPrice < p.price && (
                <div className="cp-vs-mrp">
                  MRP <s>₹{p.price.toLocaleString("en-IN")}</s>
                </div>
              )}
              <span className={`cp-vs-stock ${p.stock > 0 ? "in" : "out"}`}>
                {p.stock > 0 ? `In Stock (${p.stock})` : "Out of Stock"}
              </span>
            </div>
          </div>
          {i < products.length - 1 && (
            <div className="cp-vs-divider" aria-hidden="true">
              <div className="cp-vs-line" />
              <span className="cp-vs-badge">VS</span>
              <div className="cp-vs-line" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Meta bar ───────────────────────────────────────────────────────────────── */
function MetaBar({ comparison, isNew }) {
  return (
    <div className="cp-meta-bar" aria-label="Comparison metadata">
      <div className="cp-meta-item">
        <span className="cp-meta-label">ID</span>
        <span className="cp-meta-value cp-meta-id">#{shortId(comparison._id)}</span>
      </div>
      <div className="cp-meta-item">
        <span className="cp-meta-label">Slug</span>
        <span className="cp-meta-value cp-meta-slug" title={comparison.slug}>
          {comparison.slug}
        </span>
      </div>
      <div className="cp-meta-item">
        <span className="cp-meta-label">Status</span>
        <StatusBadge status={comparison.status} />
      </div>
      {isNew !== null && (
        <div className="cp-meta-item">
          <span className="cp-meta-label">Cache</span>
          <span className={`cp-meta-cache ${isNew ? "cp-meta-cache--new" : "cp-meta-cache--hit"}`}>
            {isNew ? "🆕 New" : "✓ Existing"}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── AI Safe JSON Parse Helper ──────────────────────────────────────────────── */
function safeParseAI(aiResponse) {
  if (!aiResponse) return null;
  if (typeof aiResponse === "object") return aiResponse;
  if (typeof aiResponse !== "string") return aiResponse;
  try {
    let str = aiResponse.trim();
    if (str.startsWith("```")) {
      const firstNewline = str.indexOf("\n");
      const lastBackticks = str.lastIndexOf("```");
      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        str = str.substring(firstNewline + 1, lastBackticks).trim();
      }
    }
    return JSON.parse(str);
  } catch (err) {
    return null;
  }
}

/* ─── Winner card ────────────────────────────────────────────────────────────── */
function WinnerCard({ products, aiData }) {
  if (aiData && aiData.winner && (aiData.winner.name || aiData.winner.reason || aiData.winner.productId)) {
    return (
      <section className="cp-section" aria-label="AI Winner Analysis">
        <div className="cp-winner-card cp-winner-card--active">
          <div className="cp-winner-shimmer" aria-hidden="true" />
          <div className="cp-winner-top-row">
            <span className="cp-winner-trophy" aria-hidden="true">🏆</span>
            <span className="cp-winner-score-badge">Score: {aiData.winner.score || 10}/10</span>
          </div>
          <h2 className="cp-winner-title">Winner: {aiData.winner.name || "Best Choice"}</h2>
          {products.length >= 2 && (
            <p className="cp-winner-vs">{products.map((p) => p.name).join(" vs ")}</p>
          )}
          <p className="cp-winner-desc cp-winner-desc--live">
            {aiData.winner.reason}
          </p>
          <div className="cp-winner-coming-chip cp-winner-coming-chip--active">
            <span className="cp-winner-dot cp-winner-dot--active" aria-hidden="true" />
            Powered by Groq AI · Verified Comparison
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cp-section" aria-label="AI Winner Analysis">
      <div className="cp-winner-card">
        <div className="cp-winner-shimmer" aria-hidden="true" />
        <span className="cp-winner-trophy" aria-hidden="true">🏆</span>
        <h2 className="cp-winner-title">AI Winner Analysis</h2>
        {products.length >= 2 && (
          <p className="cp-winner-vs">{products.map((p) => p.name).join(" vs ")}</p>
        )}
        <p className="cp-winner-desc">
          Our AI will weigh every comparison point — price, nutrition, ingredients,
          and suitability for your pet — to declare the best choice for you.
        </p>
        <div className="cp-winner-coming-chip">
          <span className="cp-winner-dot" aria-hidden="true" />
          Powered by Groq AI · Generating Analysis...
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison table ───────────────────────────────────────────────────────── */
function CompareTable({ products, aiData }) {
  if (products.length === 0) return null;

  return (
    <section className="cp-section" aria-label="Comparison table">
      <div className="cp-section-title">
        📊 Comparison Table
        <span className="cp-section-count">{TABLE_ROWS.length} attributes</span>
      </div>
      <div className="cp-table-outer">
        <div className="cp-table" style={{ "--col-count": products.length }} role="table">
          <div className="cp-table-head" role="row">
            <div className="cp-table-cell cp-table-label" role="columnheader">Feature</div>
            {products.map((p) => (
              <div key={p._id} className="cp-table-cell cp-table-product-head" role="columnheader">
                <img className="cp-table-product-img" src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
                <span className="cp-table-product-headname">{p.name}</span>
              </div>
            ))}
          </div>
          {TABLE_ROWS.map((row, idx) => (
            <div
              key={row.key}
              className={`cp-table-row ${idx % 2 === 1 ? "cp-table-row--alt" : ""}`}
              role="row"
            >
              <div className="cp-table-cell cp-table-label" role="rowheader">
                <span className="cp-table-row-icon" aria-hidden="true">{row.icon}</span>
                {row.label}
              </div>
              {products.map((p) => {
                const val = row.getVal(p);
                const aiVal = aiData?.nutrition?.[row.key] || aiData?.[row.key];
                const hasAiVal = aiVal && aiVal !== "Information not available." && aiVal !== "Information not available";

                return (
                  <div
                    key={p._id}
                    className={`cp-table-cell cp-table-value-cell ${val || hasAiVal ? "cp-table-cell--data" : ""}`}
                    role="cell"
                  >
                    {val ? (
                      <span className="cp-table-value">{val}</span>
                    ) : hasAiVal ? (
                      <span className="cp-table-value cp-table-value--ai" title="Populated by AI">
                        ✨ {aiVal}
                      </span>
                    ) : aiData ? (
                      <span className="cp-table-value cp-table-value--muted">—</span>
                    ) : (
                      <span className="cp-ai-phase-tag" title="Populating AI comparison...">🤖 Generating...</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pros & Cons ────────────────────────────────────────────────────────────── */
function ProsConsSection({ products, aiData }) {
  if (products.length === 0) return null;

  return (
    <section className="cp-section" aria-label="Pros and cons comparison">
      <div className="cp-section-title">⚡ Pros &amp; Cons</div>
      <div className={`cp-pc-grid cp-pc-grid--${products.length}col`}>
        {products.map((p) => {
          const firstWord = p.name ? p.name.split(" ")[0].toLowerCase() : "";
          const brandWord = p.brand ? p.brand.toLowerCase() : "";

          const matchedPros = aiData?.pros?.filter(item => 
            (firstWord && item.toLowerCase().includes(firstWord)) ||
            (brandWord && item.toLowerCase().includes(brandWord))
          ) || [];
          const matchedCons = aiData?.cons?.filter(item => 
            (firstWord && item.toLowerCase().includes(firstWord)) ||
            (brandWord && item.toLowerCase().includes(brandWord))
          ) || [];

          const displayPros = matchedPros.length > 0 ? matchedPros : (aiData?.pros || []);
          const displayCons = matchedCons.length > 0 ? matchedCons : (aiData?.cons || []);

          return (
            <div key={p._id} className="cp-pc-card">
              <div className="cp-pc-header">
                <img className="cp-pc-img" src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
                <span className="cp-pc-name">{p.name}</span>
              </div>
              <div className="cp-pc-block">
                <div className="cp-pc-block-title"><span aria-hidden="true">✅</span> Pros</div>
                {aiData && Array.isArray(displayPros) && displayPros.length > 0 ? (
                  <ul className="cp-ai-list">
                    {displayPros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="cp-ai-locked-row">
                    <span className="cp-ai-lock-icon" aria-hidden="true">🤖</span>
                    <span className="cp-ai-lock-text">
                      {aiData ? "No specific pros listed" : "Generating pros..."}
                    </span>
                  </div>
                )}
              </div>
              <div className="cp-pc-block">
                <div className="cp-pc-block-title"><span aria-hidden="true">❌</span> Cons</div>
                {aiData && Array.isArray(displayCons) && displayCons.length > 0 ? (
                  <ul className="cp-ai-list cp-ai-list--cons">
                    {displayCons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="cp-ai-locked-row">
                    <span className="cp-ai-lock-icon" aria-hidden="true">🤖</span>
                    <span className="cp-ai-lock-text">
                      {aiData ? "No specific cons listed" : "Generating cons..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Buy Now ────────────────────────────────────────────────────────────────── */
function BuyNowSection({ products }) {
  if (products.length === 0) return null;

  return (
    <section className="cp-section" aria-label="Buy products section">
      <div className="cp-section-title">🛒 Buy Now</div>
      <div className={`cp-buy-grid cp-buy-grid--${products.length}col`}>
        {products.map((p) => {
          const price   = p.discountPrice || p.price;
          const hasDisc = p.discountPrice && p.discountPrice < p.price;
          const inStock = p.stock > 0;
          return (
            <div key={p._id} className="cp-buy-card">
              <img className="cp-buy-img" src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
              <div className="cp-buy-info">
                <p className="cp-buy-name">{p.name}</p>
                <div className="cp-buy-price-row">
                  <span className="cp-buy-price">₹{price.toLocaleString("en-IN")}</span>
                  {hasDisc && <s className="cp-buy-mrp">₹{p.price.toLocaleString("en-IN")}</s>}
                </div>
                {!inStock && <span className="cp-buy-out-badge">Out of Stock</span>}
              </div>
              <Link
                to={`/products/${p.slug || p._id}`}
                className={`cp-buy-btn ${!inStock ? "cp-buy-btn--oos" : ""}`}
                aria-label={`View ${p.name} product page`}
              >
                {inStock ? "View Product →" : "Out of Stock"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Related Products ───────────────────────────────────────────────────────── */
function RelatedSection({ relatedProducts }) {
  if (relatedProducts.length === 0) return null;

  return (
    <section className="cp-section" aria-label="Related products">
      <div className="cp-section-title">
        🔗 Related Products
        <span className="cp-section-count">{relatedProducts.length}</span>
      </div>
      <div className="cp-related-grid">
        {relatedProducts.map((p) => (
          <Link key={p._id} to={`/products/${p.slug || p._id}`} className="cp-related-card" aria-label={`View ${p.name}`}>
            <div className="cp-related-img-wrap">
              <img className="cp-related-img" src={p.images?.[0] || "/placeholder.png"} alt={p.name} />
            </div>
            <div className="cp-related-body">
              <p className="cp-related-name">{p.name}</p>
              <div className="cp-related-price">₹{(p.discountPrice || p.price).toLocaleString("en-IN")}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── AI Analysis Sections (Phase 4C Live JSON Cards) ────────────────────────── */
function AIAnalysisSection({ comparison, aiData, petLabel, onRetry }) {
  // If AI completed and/or we parsed the JSON successfully
  if (aiData && (comparison?.aiStatus === "completed" || aiData.winner || aiData.summary || aiData.nutrition || aiData.pros || aiData.cons || aiData.finalRecommendation)) {
    return (
      <section className="cp-ai-live-sections" aria-label="Detailed AI Analysis">
        {/* 📝 Summary */}
        {aiData.summary && (
          <div className="cp-section">
            <div className="cp-section-title">📝 AI Summary</div>
            <div className="cp-ai-card">
              <p className="cp-ai-text">{aiData.summary}</p>
            </div>
          </div>
        )}

        {/* 💪 Nutrition Breakdown */}
        {(aiData.nutrition || aiData.protein || aiData.fat || aiData.fiber || aiData.ingredients) && (
          <div className="cp-section">
            <div className="cp-section-title">💪 Nutrition &amp; Ingredients Overview</div>
            <div className="cp-ai-card cp-ai-card--grid">
              <div className="cp-ai-subitem">
                <strong className="cp-ai-subtitle">Protein Content</strong>
                <p className="cp-ai-subtext">{aiData.nutrition?.protein || aiData.protein || "—"}</p>
              </div>
              <div className="cp-ai-subitem">
                <strong className="cp-ai-subtitle">Fat Content</strong>
                <p className="cp-ai-subtext">{aiData.nutrition?.fat || aiData.fat || "—"}</p>
              </div>
              <div className="cp-ai-subitem">
                <strong className="cp-ai-subtitle">Fiber Content</strong>
                <p className="cp-ai-subtext">{aiData.nutrition?.fiber || aiData.fiber || "—"}</p>
              </div>
              <div className="cp-ai-subitem">
                <strong className="cp-ai-subtitle">Ingredient Quality</strong>
                <p className="cp-ai-subtext">{aiData.nutrition?.ingredients || aiData.ingredients || (typeof aiData.nutrition === "string" ? aiData.nutrition : "—")}</p>
              </div>
            </div>
          </div>
        )}

        {/* 🐶 Best For & ⚠ Avoid For */}
        <div className="cp-ai-split-grid">
          {Array.isArray(aiData.bestFor) && aiData.bestFor.length > 0 && (
            <div className="cp-section">
              <div className="cp-section-title">🐶 Best For</div>
              <div className="cp-ai-card cp-ai-card--best">
                <ul className="cp-ai-list">
                  {aiData.bestFor.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {Array.isArray(aiData.avoidFor) && aiData.avoidFor.length > 0 && (
            <div className="cp-section">
              <div className="cp-section-title">⚠ Avoid For</div>
              <div className="cp-ai-card cp-ai-card--avoid">
                <ul className="cp-ai-list cp-ai-list--cons">
                  {aiData.avoidFor.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 💰 Value For Money */}
        {aiData.valueForMoney && (
          <div className="cp-section">
            <div className="cp-section-title">💰 Value For Money</div>
            <div className="cp-ai-card">
              <p className="cp-ai-text">{aiData.valueForMoney}</p>
            </div>
          </div>
        )}

        {/* ⭐ Final Recommendation */}
        {aiData.finalRecommendation && (
          <div className="cp-section">
            <div className="cp-section-title">⭐ Final Recommendation</div>
            <div className="cp-ai-card cp-ai-card--recommend">
              <p className="cp-ai-text cp-ai-text--bold">{aiData.finalRecommendation}</p>
            </div>
          </div>
        )}

        {/* 📌 Disclaimer */}
        {aiData.disclaimer && (
          <div className="cp-section">
            <div className="cp-ai-disclaimer">
              <span className="cp-ai-disclaimer-icon" aria-hidden="true">📌</span>
              <p className="cp-ai-disclaimer-text">{aiData.disclaimer}</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  // If AI generation failed
  if (comparison?.aiStatus === "failed") {
    return (
      <section className="cp-ai-placeholder cp-ai-placeholder--error" aria-label="AI analysis error">
        <span className="cp-ai-placeholder-icon" aria-hidden="true">⚠️</span>
        <h2 className="cp-ai-placeholder-title">AI Analysis Could Not Be Generated</h2>
        <p className="cp-ai-placeholder-text">
          {comparison.aiError || "An unexpected error occurred while generating the AI comparison."}
        </p>
        {onRetry && (
          <button className="cp-error-retry-btn" onClick={onRetry} style={{ marginTop: 16 }}>
            Regenerate AI Analysis
          </button>
        )}
      </section>
    );
  }

  // If AI is currently generating (or pending)
  if (comparison?.aiStatus === "processing" || comparison?.aiStatus === "pending") {
    return (
      <section className="cp-ai-placeholder cp-ai-placeholder--processing" aria-label="AI analysis generating">
        <div className="cp-loading-ring cp-loading-ring--small" aria-hidden="true" style={{ margin: "0 auto 16px" }}>
          <div /><div /><div /><div />
        </div>
        <h2 className="cp-ai-placeholder-title">AI Analysis Generating...</h2>
        <p className="cp-ai-placeholder-text">
          Gemini AI is carefully analyzing nutrition, ingredients, and suitability for your pet.
          Refresh in a moment to view the full analysis!
        </p>
        {onRetry && (
          <button className="cp-error-retry-btn" onClick={onRetry} style={{ marginTop: 16 }}>
            Check Status Now
          </button>
        )}
      </section>
    );
  }

  // Fallback (draft/initial state)
  return (
    <section className="cp-ai-placeholder" aria-label="AI analysis placeholder">
      <div className="cp-ai-placeholder-glow" aria-hidden="true" />
      <span className="cp-ai-placeholder-icon" aria-hidden="true">🧠</span>
      <h2 className="cp-ai-placeholder-title">AI Analysis Coming Soon</h2>
      <p className="cp-ai-placeholder-text">
        Full AI-powered analysis — nutrition tables, ingredient breakdown, breed
        suitability, winner declaration, and personalised recommendations for your{" "}
        <strong>{petLabel?.toLowerCase() || "pet"}</strong> — is ready when generated.
      </p>
      {onRetry && (
        <button className="cp-error-retry-btn" onClick={onRetry} style={{ marginTop: 16 }}>
          Generate AI Analysis
        </button>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function ComparePage() {
  const { slug: urlSlug } = useParams();          // set on /compare/:slug
  const [searchParams]    = useSearchParams();    // set on /compare?products=...
  const navigate          = useNavigate();

  /* ─── Query-param values (only used in creation flow) ───────────────────── */
  const rawProducts = searchParams.get("products") || "";
  const petType     = searchParams.get("type")     || "";
  const breed       = searchParams.get("breed")    || "";
  const productIds  = rawProducts
    ? rawProducts.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const hasSlug     = Boolean(urlSlug);
  const hasProducts = productIds.length > 0;

  /* ─── State ──────────────────────────────────────────────────────────────── */
  const [comparison,      setComparison]      = useState(null);
  const [products,        setProducts]        = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  // Initialise loading=true if there's anything to load — prevents flicker
  const [loading,         setLoading]         = useState(hasSlug || hasProducts);
  const [loadingPhase,    setLoadingPhase]    = useState(
    hasSlug ? "loading" : hasProducts ? "creating" : null
  );
  const [error,           setError]           = useState(
    !hasSlug && !hasProducts ? "no_products" : null
  );
  const [isNew,           setIsNew]           = useState(null);
  // Incrementing this triggers a retry of the main effect
  const [retryFlag,       setRetryFlag]       = useState(0);

  /* ─── Main data effect ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!hasSlug && !hasProducts) return; // empty state handled by initialiser above

    let cancelled = false;

    const run = async () => {
      if (urlSlug) {
        /* ── Canonical URL: load by slug ──────────────────────────────────── */
        setLoading(true);
        setLoadingPhase("loading");
        setError(null);
        setComparison(null);
        setProducts([]);
        setRelatedProducts([]);

        try {
          const { data } = await axios.get(`${API_BASE}/api/compare/${urlSlug}`);
          if (cancelled) return;
          setComparison(data.comparison);
          setProducts(
            Array.isArray(data.comparison.products) ? data.comparison.products : []
          );
          setIsNew(false);
        } catch (err) {
          if (cancelled) return;
          setError(err?.response?.status === 404 ? "not_found" : "server_error");
        } finally {
          if (!cancelled) {
            setLoading(false);
            setLoadingPhase(null);
          }
        }
      } else {
        /* ── Query-param URL: create comparison → redirect to slug ────────── */
        setLoading(true);
        setLoadingPhase("creating");
        setError(null);

        try {
          const { data } = await axios.post(`${API_BASE}/api/compare/create`, {
            productIds,
            petType: petType || undefined,
            breed:   breed   || undefined,
          });
          if (cancelled) return;
          // Replace URL with canonical slug — no IDs, no query params exposed
          navigate(`/compare/${data.comparison.slug}`, { replace: true });
          // Loading stays true — the slug route will run fetchBySlug and take over
        } catch (err) {
          if (cancelled) return;
          setLoading(false);
          setLoadingPhase(null);
          setError("server_error");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSlug, rawProducts, retryFlag]);

  /* ─── Related products effect ────────────────────────────────────────────── */
  useEffect(() => {
    if (products.length === 0) return;
    const category    = products[0]?.categories?.[0];
    if (!category) return;
    const comparedIds = new Set(products.map((p) => String(p._id)));

    axios
      .get(`${API_BASE}/api/products?category=${encodeURIComponent(category)}&limit=10`)
      .then((r) => {
        const raw = r.data;
        const all = Array.isArray(raw.products) ? raw.products
                  : Array.isArray(raw)          ? raw
                  : [];
        setRelatedProducts(
          all.filter((p) => !comparedIds.has(String(p._id))).slice(0, 4)
        );
      })
      .catch(() => {/* silent */});
  }, [products]);

  /* ─── Retry handler ──────────────────────────────────────────────────────── */
  const handleRetry = () => setRetryFlag((n) => n + 1);

  /* ─── Render: loading ────────────────────────────────────────────────────── */
  if (loading) return <LoadingState phase={loadingPhase} />;

  /* ─── Render: error ──────────────────────────────────────────────────────── */
  if (error) {
    return (
      <ErrorState
        type={error}
        onRetry={error === "server_error" ? handleRetry : null}
      />
    );
  }

  /* ─── Safety net ─────────────────────────────────────────────────────────── */
  if (!comparison) return <LoadingState phase="loading" />;

  /* ─── Derived display values ─────────────────────────────────────────────── */
  const petIcon    = comparison.petType === "cat" ? "🐱" : "🐶";
  const petLabel   = comparison.petType ? capitalize(comparison.petType) : "Not specified";
  const breedLabel = comparison.breed   ? formatBreed(comparison.breed)  : null;

  const aiData     = typeof comparison?.aiResponse === "string"
    ? safeParseAI(comparison.aiResponse)
    : comparison?.aiResponse;

  const titleProducts = products.map((p) => p.name).filter(Boolean);
  const pageTitle = titleProducts.length > 0
    ? `${titleProducts.join(" vs ")} | AI Compare | PetRonaq`
    : "AI Compare | PetRonaq";

  const canonicalUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/compare/${comparison.slug}`;

  /* ─── Main render ────────────────────────────────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            titleProducts.length > 0
              ? `AI product comparison for ${titleProducts.join(", ")} on PetRonaq`
              : "AI-powered pet product comparison on PetRonaq"
          }
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <main className="cp-page">

        {/* ── Back ─────────────────────────────────────────────────────────── */}
        <button className="cp-back" onClick={() => navigate(-1)} aria-label="Go back">
          <span className="cp-back-arrow">←</span> Back
        </button>

        {/* ── VS Hero ──────────────────────────────────────────────────────── */}
        <VSHero products={products} />

        {/* ── Meta Bar ─────────────────────────────────────────────────────── */}
        <MetaBar comparison={comparison} isNew={isNew} />

        {/* ── Pet Type + Breed ─────────────────────────────────────────────── */}
        <div className="cp-summary-grid">
          <div className="cp-summary-card" aria-label="Pet type">
            <div className="cp-summary-card-header">
              <div className="cp-summary-card-icon" aria-hidden="true">🐾</div>
              <span className="cp-summary-card-label">Pet Type</span>
            </div>
            <div className="cp-summary-card-value">
              <span className="cp-pet-icon" aria-hidden="true">{petIcon}</span>
              {petLabel}
            </div>
          </div>
          <div className="cp-summary-card" aria-label="Breed">
            <div className="cp-summary-card-header">
              <div className="cp-summary-card-icon" aria-hidden="true">🧬</div>
              <span className="cp-summary-card-label">Breed</span>
            </div>
            <div className="cp-summary-card-value">
              {breedLabel || (
                <span className="cp-summary-card-value-muted">Not specified</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Winner Card ───────────────────────────────────────────────────── */}
        <WinnerCard products={products} aiData={aiData} />

        {/* ── Comparison Table ──────────────────────────────────────────────── */}
        <CompareTable products={products} aiData={aiData} />

        {/* ── Pros & Cons ───────────────────────────────────────────────────── */}
        <ProsConsSection products={products} aiData={aiData} />

        {/* ── Buy Now ───────────────────────────────────────────────────────── */}
        <BuyNowSection products={products} />

        {/* ── Related Products ──────────────────────────────────────────────── */}
        <RelatedSection relatedProducts={relatedProducts} />

        {/* ── AI Live Analysis & Status Cards ───────────────────────────────── */}
        <AIAnalysisSection
          comparison={comparison}
          aiData={aiData}
          petLabel={petLabel}
          onRetry={handleRetry}
        />

      </main>
    </>
  );
}

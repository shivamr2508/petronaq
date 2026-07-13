import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import "../styles/aiCompare.css";

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_PRODUCTS = 3;

const BREED_PRESETS = [
  "Mixed Breed",
  "I Don't Know",
  "Labrador Retriever",
  "German Shepherd",
  "Golden Retriever",
  "Bulldog",
  "Poodle",
  "Beagle",
  "Rottweiler",
  "Yorkshire Terrier",
  "Boxer",
  "Dachshund",
  "Shih Tzu",
  "Doberman",
  "Great Dane",
  "Persian",
  "Siamese",
  "Maine Coon",
  "Bengal",
  "British Shorthair",
  "Ragdoll",
  "Abyssinian",
  "Scottish Fold",
];

/* ─────────────────────────────────────────────────────────────────────────────
   AICompareModal Component
   ───────────────────────────────────────────────────────────────────────────── */

export default function AICompareModal({ isOpen, onClose, currentProduct }) {
  const navigate = useNavigate();

  /* ─── State ──────────────────────────────────────────────────────────────── */
  const [petType, setPetType] = useState("dog");
  const [breedQuery, setBreedQuery] = useState("");
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [selectedBreed, setSelectedBreed] = useState("");

  // Selected products: always starts with currentProduct (locked)
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Product search
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  // Validation
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  /* ─── Refs ───────────────────────────────────────────────────────────────── */
  const breedWrapRef = useRef(null);
  const productWrapRef = useRef(null);
  const productSearchTimeout = useRef(null);

  /* ─── Initialize with current product ───────────────────────────────────── */
  useEffect(() => {
    if (isOpen && currentProduct) {
      setSelectedProducts([{ ...currentProduct, _locked: true }]);
      setPetType("dog");
      setBreedQuery("");
      setSelectedBreed("");
      setProductQuery("");
      setProductResults([]);
      setProductSearchOpen(false);
      setShowMaxWarning(false);
    }
  }, [isOpen, currentProduct]);

  /* ─── Close on Escape ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  /* ─── Prevent body scroll when modal open ────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ─── Close dropdowns when clicking outside ──────────────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (breedWrapRef.current && !breedWrapRef.current.contains(e.target)) {
        setBreedDropdownOpen(false);
      }
      if (productWrapRef.current && !productWrapRef.current.contains(e.target)) {
        setProductSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ─── Product search with debounce ───────────────────────────────────────── */
  const searchProducts = useCallback(
    async (query) => {
      if (!query.trim()) {
        setProductResults([]);
        setProductSearchOpen(false);
        return;
      }
      setProductSearchLoading(true);
      setProductSearchOpen(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/products?keyword=${encodeURIComponent(query)}&limit=10`
        );
        const data = res.data;
        const products = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];
        setProductResults(products);
      } catch (err) {
        console.error("Product search error:", err);
        setProductResults([]);
      } finally {
        setProductSearchLoading(false);
      }
    },
    []
  );

  const handleProductQueryChange = (e) => {
    const val = e.target.value;
    setProductQuery(val);
    clearTimeout(productSearchTimeout.current);
    productSearchTimeout.current = setTimeout(() => {
      searchProducts(val);
    }, 300);
  };

  /* ─── Select / remove products ───────────────────────────────────────────── */
  const isProductSelected = (id) =>
    selectedProducts.some((p) => String(p._id) === String(id));

  const handleSelectProduct = (product) => {
    if (isProductSelected(product._id)) return;
    if (selectedProducts.length >= MAX_PRODUCTS) {
      setShowMaxWarning(true);
      setTimeout(() => setShowMaxWarning(false), 3000);
      return;
    }
    setShowMaxWarning(false);
    setSelectedProducts((prev) => [...prev, product]);
    setProductQuery("");
    setProductResults([]);
    setProductSearchOpen(false);
  };

  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => String(p._id) !== String(id) || p._locked)
    );
    setShowMaxWarning(false);
  };

  /* ─── Breed helpers ──────────────────────────────────────────────────────── */
  const filteredBreeds = BREED_PRESETS.filter((b) =>
    b.toLowerCase().includes(breedQuery.toLowerCase())
  );

  const handleBreedSelect = (breed) => {
    setSelectedBreed(breed);
    setBreedQuery(breed);
    setBreedDropdownOpen(false);
  };

  const handleBreedInputChange = (e) => {
    const val = e.target.value;
    setBreedQuery(val);
    setBreedDropdownOpen(true);
  };

  /* ─── Generate navigation ────────────────────────────────────────────────── */
  const handleGenerate = () => {
    if (selectedProducts.length < 1) return;
    const productIds = selectedProducts.map((p) => p._id).join(",");
    const params = new URLSearchParams();
    params.set("products", productIds);
    params.set("type", petType);
    if (BREED_PRESETS.includes(selectedBreed)) {
      params.set(
        "breed",
        selectedBreed.toLowerCase().replace(/\s+/g, "-")
      );
    }
    onClose();
    navigate(`/compare?${params.toString()}`);
  };

  /* ─── Render guard ───────────────────────────────────────────────────────── */
  if (!isOpen) return null;

  const canGenerate = selectedProducts.length >= 1;

  return (
    <div
      className="aicmp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aicmp-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="aicmp-modal">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="aicmp-header">
          <div className="aicmp-header-left">
            <div className="aicmp-header-icon" aria-hidden="true">🤖</div>
            <div className="aicmp-header-text">
              <h2 className="aicmp-title" id="aicmp-title">
                Compare Products with PetRonaq AI
              </h2>
              <p className="aicmp-subtitle">
                Select up to 3 products to get a detailed AI comparison.
              </p>
            </div>
          </div>
          <button
            className="aicmp-close"
            onClick={onClose}
            aria-label="Close compare modal"
          >
            ✕
          </button>
        </div>

        {/* ─── Body ───────────────────────────────────────────────────────── */}
        <div className="aicmp-body">

          {/* Pet Type */}
          <div className="aicmp-field">
            <label className="aicmp-label">
              🐾 Pet Type
            </label>
            <div className="aicmp-pet-toggle" role="group" aria-label="Select pet type">
              <button
                className={`aicmp-pet-btn ${petType === "dog" ? "active" : ""}`}
                onClick={() => setPetType("dog")}
                aria-pressed={petType === "dog"}
                id="pet-type-dog"
              >
                <span className="aicmp-pet-icon">🐶</span>
                Dog
              </button>
              <button
                className={`aicmp-pet-btn ${petType === "cat" ? "active" : ""}`}
                onClick={() => setPetType("cat")}
                aria-pressed={petType === "cat"}
                id="pet-type-cat"
              >
                <span className="aicmp-pet-icon">🐱</span>
                Cat
              </button>
            </div>
          </div>

          {/* Breed */}
          <div className="aicmp-field">
            <label className="aicmp-label" htmlFor="aicmp-breed-input">
              🧬 Breed{" "}
              <span className="aicmp-label-optional">(Optional)</span>
            </label>
            <div className="aicmp-dropdown-wrap" ref={breedWrapRef}>
              <input
                id="aicmp-breed-input"
                type="text"
                className="aicmp-search-input"
                placeholder="Search your breed..."
                value={breedQuery}
                onChange={handleBreedInputChange}
                onFocus={() => setBreedDropdownOpen(true)}
                autoComplete="off"
              />
              {breedDropdownOpen && (
                <div className="aicmp-dropdown-list" role="listbox" aria-label="Breed options">
                  {filteredBreeds.length === 0 ? (
                    <div className="aicmp-dropdown-empty">No matching breeds</div>
                  ) : (
                    filteredBreeds.map((breed) => (
                      <div
                        key={breed}
                        className={`aicmp-dropdown-item ${selectedBreed === breed ? "selected" : ""}`}
                        role="option"
                        aria-selected={selectedBreed === breed}
                        onClick={() => handleBreedSelect(breed)}
                      >
                        {breed}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="aicmp-field">
            <label className="aicmp-label" htmlFor="aicmp-product-search">
              📦 Products
            </label>

            {/* Counter dots */}
            <div className="aicmp-counter">
              <span>{selectedProducts.length} of {MAX_PRODUCTS} selected</span>
              <div className="aicmp-counter-dots" aria-hidden="true">
                {Array.from({ length: MAX_PRODUCTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`aicmp-counter-dot ${i < selectedProducts.length ? "filled" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Selected product chips */}
            {selectedProducts.length > 0 && (
              <div className="aicmp-selected-chips" role="list" aria-label="Selected products">
                {selectedProducts.map((p) => (
                  <div
                    key={p._id}
                    className={`aicmp-chip ${p._locked ? "locked" : ""}`}
                    role="listitem"
                  >
                    <img
                      className="aicmp-chip-img"
                      src={p.images?.[0] || p.image || "/placeholder.png"}
                      alt={p.name}
                    />
                    <div className="aicmp-chip-info">
                      <div className="aicmp-chip-name">{p.name}</div>
                      <div className="aicmp-chip-price">
                        ₹{p.discountPrice || p.price}
                      </div>
                    </div>
                    {p._locked ? (
                      <span className="aicmp-chip-badge">Current</span>
                    ) : (
                      <button
                        className="aicmp-chip-remove"
                        onClick={() => handleRemoveProduct(p._id)}
                        aria-label={`Remove ${p.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Validation warning */}
            {showMaxWarning && (
              <div className="aicmp-validation" role="alert">
                <span className="aicmp-validation-icon">⚠️</span>
                You can select a maximum of {MAX_PRODUCTS} products. Remove one to add another.
              </div>
            )}

            {/* Search input */}
            {selectedProducts.length < MAX_PRODUCTS && (
              <div className="aicmp-product-search-wrap" ref={productWrapRef}>
                <span className="aicmp-search-icon" aria-hidden="true">🔍</span>
                <input
                  id="aicmp-product-search"
                  type="text"
                  className="aicmp-product-search-input"
                  placeholder="Search products to compare…"
                  value={productQuery}
                  onChange={handleProductQueryChange}
                  onFocus={() => {
                    if (productQuery.trim()) setProductSearchOpen(true);
                  }}
                  autoComplete="off"
                />

                {productSearchOpen && (
                  <div className="aicmp-product-dropdown" role="listbox" aria-label="Product search results">
                    {productSearchLoading ? (
                      <div className="aicmp-product-loading">
                        <div className="aicmp-spinner" aria-hidden="true" />
                        Searching…
                      </div>
                    ) : productResults.length === 0 ? (
                      <div className="aicmp-dropdown-empty">
                        No products found. Try a different keyword.
                      </div>
                    ) : (
                      productResults.map((p) => {
                        const alreadySelected = isProductSelected(p._id);
                        return (
                          <div
                            key={p._id}
                            className={`aicmp-product-option ${alreadySelected ? "disabled" : ""}`}
                            role="option"
                            aria-selected={alreadySelected}
                            aria-disabled={alreadySelected}
                            onClick={() => !alreadySelected && handleSelectProduct(p)}
                          >
                            <img
                              className="aicmp-product-option-img"
                              src={p.images?.[0] || p.image || "/placeholder.png"}
                              alt={p.name}
                            />
                            <div className="aicmp-product-option-info">
                              <div className="aicmp-product-option-name">{p.name}</div>
                              <div className="aicmp-product-option-price">
                                ₹{p.discountPrice || p.price}
                                {alreadySelected && " · Already added"}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─────────────────────────────────────────────────────── */}
        <div className="aicmp-footer">
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={!canGenerate}
            id="aicmp-generate-btn"
            aria-label="Generate AI Comparison"
          >
            <span className="btn-generate-icon" aria-hidden="true">✨</span>
            Generate AI Comparison
          </button>
          <p className="aicmp-footer-note">
            AI analysis will be available in Phase 4 · No data is sent yet
          </p>
        </div>
      </div>
    </div>
  );
}

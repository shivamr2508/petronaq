import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { blogService } from "../../services/blogService";
import BlogPreviewModal from "./BlogPreviewModal";
import BlogStatCard from "./BlogStatCard";
import "../../styles/adminBlogs.css";

// ─────────────────────────────────────────────────────────────────
// cleanHtml: strips redundant span wrappers and un-nests duplicate
// block elements that execCommand used to create.
// Lives at module scope so it can be used in buildPayload and in
// the formatter callbacks without the const temporal-dead-zone.
// ─────────────────────────────────────────────────────────────────
function cleanHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // 1. Unwrap <span> nodes that carry only a redundant inline style
  //    (font-weight:normal / font-style:normal) — these are artefacts
  //    of execCommand("bold") / execCommand("italic") toggling off.
  tmp.querySelectorAll("span").forEach((span) => {
    const style = (span.getAttribute("style") || "").trim();
    const isRedundant =
      !style ||
      /^font-weight\s*:\s*(normal|400)\s*;?$/i.test(style) ||
      /^font-style\s*:\s*normal\s*;?$/i.test(style);
    if (isRedundant) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
  });

  // 2. Un-nest duplicate/invalid block nesting:
  //      <h2><h2>text</h2></h2>  →  <h2>text</h2>
  //      <blockquote><h2><blockquote>…</blockquote></h2></blockquote>
  //      → <h2>…</h2>  (heading wins; blockquote wrapper removed)
  const BLOCK = new Set(["H1","H2","H3","H4","H5","H6","P","BLOCKQUOTE","PRE","DIV"]);
  let changed = true;
  while (changed) {
    changed = false;
    tmp.querySelectorAll("*").forEach((node) => {
      if (!BLOCK.has(node.tagName)) return;
      const children = Array.from(node.childNodes).filter(
        (c) => c.nodeType !== Node.TEXT_NODE || c.textContent.trim() !== ""
      );
      if (children.length === 1 && children[0].nodeType === Node.ELEMENT_NODE) {
        const child = children[0];
        const outerIsHeading = /^H[1-6]$/.test(node.tagName);
        const innerIsBlock = BLOCK.has(child.tagName);
        if (child.tagName === node.tagName || (outerIsHeading && innerIsBlock)) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          changed = true;
        }
      }
    });
  }

  return tmp.innerHTML;
}

const initialState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  images: [],
  category: "General",
  tags: [],
  status: "draft",
  featured: false,
  metaTitle: "",
  metaDescription: "",
  canonical: "",
  ogImage: "",
  relatedProducts: [],
  faq: [],
};

function BlogEditorForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [form, setForm] = useState(initialState);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["General"]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [featuredFile, setFeaturedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blogId, setBlogId] = useState(id || "");
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, featured: 0 });

  const isEditMode = mode === "edit";

  const loadBlog = async () => {
    try {
      setLoading(true);
      const blog = await blogService.getBlogById(id);
      setBlogId(blog._id);
      setForm({
        ...initialState,
        ...blog,
        tags: blog.tags || [],
        faq: blog.faq || [],
        images: blog.images || [],
        relatedProducts: (blog.relatedProducts || []).map((item) => item._id || item),
      });
      setCategories((prev) => (blog.category && !prev.includes(blog.category) ? [...prev, blog.category] : prev));
      setTags((prev) => (blog.tags || []).filter((tag) => tag && !prev.includes(tag)).concat(prev));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productList, categoryList, tagList, statsData] = await Promise.all([
          blogService.getProducts(),
          blogService.getCategories(),
          blogService.getTags(),
          blogService.getStats(),
        ]);

        setProducts(productList || []);
        setCategories((prev) => Array.from(new Set([...(categoryList || []), ...prev])));
        setTags((prev) => Array.from(new Set([...(tagList || []), ...prev])));
        setStats(statsData || { total: 0, published: 0, drafts: 0, featured: 0 });
      } catch (error) {
        toast.error("Unable to load blog metadata");
      }
    };

    loadData();
    if (isEditMode && id) {
      loadBlog();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (form.content || "")) {
      editorRef.current.innerHTML = form.content || "";
    }
  }, [form.content]);

  useEffect(() => {
    if (!hasChanges || form.status !== "draft") return;
    if (!form.title && !form.content && !form.excerpt) return;

    const timeout = window.setTimeout(() => {
      void autosaveDraft();
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [form.title, form.content, form.excerpt, form.category, form.tags, form.status, form.slug, form.metaTitle, form.metaDescription, form.featuredImage, form.images, form.relatedProducts, form.faq, hasChanges]);

  const autosaveDraft = async () => {
    if (!hasChanges || form.status !== "draft") return;

    try {
      setAutoSaving(true);
      const payload = buildPayload();
      const savedBlog = blogId
        ? await blogService.updateBlog(blogId, payload)
        : await blogService.createBlog(payload);

      if (savedBlog?._id) {
        setBlogId(savedBlog._id);
      }
      setHasChanges(false);
      toast.success("Draft autosaved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Autosave failed");
    } finally {
      setAutoSaving(false);
    }
  };

  const buildPayload = () => ({
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    // Run the HTML cleaner one final time before every save so that any
    // previously-stored malformed content is normalized on the way out.
    content: cleanHtml(form.content),
    featuredImage: form.featuredImage,
    images: form.images,
    category: form.category,
    tags: form.tags,
    status: form.status,
    featured: form.featured,
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
    canonical: form.canonical,
    ogImage: form.ogImage,
    relatedProducts: form.relatedProducts,
    faq: form.faq,
  });

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (!form.tags.includes(value)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, value] }));
      setTags((prev) => Array.from(new Set([...prev, value])));
      setHasChanges(true);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
    setHasChanges(true);
  };

  const handleAddCategory = () => {
    const value = categoryInput.trim();
    if (!value) return;
    setCategories((prev) => Array.from(new Set([...prev, value])));
    setForm((prev) => ({ ...prev, category: value }));
    setCategoryInput("");
    setHasChanges(true);
  };

  const handleAddFaq = () => {
    setForm((prev) => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
    setHasChanges(true);
  };

  const updateFaqItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      faq: prev.faq.map((item, faqIndex) => (faqIndex === index ? { ...item, [field]: value } : item)),
    }));
    setHasChanges(true);
  };

  const removeFaqItem = (index) => {
    setForm((prev) => ({ ...prev, faq: prev.faq.filter((_, faqIndex) => faqIndex !== index) }));
    setHasChanges(true);
  };

  const handleProductToggle = (productId) => {
    setForm((prev) => ({
      ...prev,
      relatedProducts: prev.relatedProducts.includes(productId)
        ? prev.relatedProducts.filter((id) => id !== productId)
        : [...prev.relatedProducts, productId],
    }));
    setHasChanges(true);
  };


  // Block-level formatter using the Selection / Range API.
  // This REPLACES the current block tag instead of wrapping it, which
  // is what execCommand("formatBlock") incorrectly does.
  // ─────────────────────────────────────────────────────────────────
  const applyBlockFormat = (tag) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    let node = range.startContainer;

    // Walk up to find the nearest block-level ancestor inside the editor
    const INLINE = new Set(["SPAN","STRONG","B","EM","I","A","CODE","U","S","MARK","ABBR","CITE","Q","SUP","SUB"]);
    const isBlock = (el) => el && el.nodeType === Node.ELEMENT_NODE && !INLINE.has(el.tagName) && el !== editor;

    // If caret is in a text node, start from its parent
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    // Climb to the immediate child of the editor (the top-level block)
    let block = node;
    while (block && block.parentNode !== editor) {
      block = block.parentNode;
    }

    if (!block || block === editor) {
      // No block found — wrap selection text in a new block
      const newBlock = document.createElement(tag);
      try {
        range.surroundContents(newBlock);
      } catch {
        newBlock.appendChild(range.extractContents());
        range.insertNode(newBlock);
      }
      sel.collapse(newBlock, newBlock.childNodes.length);
    } else if (block.tagName.toLowerCase() === tag.toLowerCase()) {
      // Same tag — toggle back to <p>
      const p = document.createElement("p");
      p.innerHTML = block.innerHTML;
      block.parentNode.replaceChild(p, block);
      // Restore caret inside p
      const r = document.createRange();
      r.selectNodeContents(p);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    } else {
      // Different tag — replace in-place, preserving inner content
      const newBlock = document.createElement(tag);
      newBlock.innerHTML = block.innerHTML;
      block.parentNode.replaceChild(newBlock, block);
      // Restore caret at end of new block
      const r = document.createRange();
      r.selectNodeContents(newBlock);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }

    setForm((prev) => ({ ...prev, content: cleanHtml(editor.innerHTML) }));
    setHasChanges(true);
  };

  // ─────────────────────────────────────────────────────────────────
  // Inline formatter (bold / italic) — execCommand is reliable here.
  // List formatter — execCommand is reliable for UL / OL.
  // ─────────────────────────────────────────────────────────────────
  const applyInlineFormat = (command) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, null);
    setForm((prev) => ({ ...prev, content: cleanHtml(editor.innerHTML) }));
    setHasChanges(true);
  };

  const handleImageUpload = async (files, type) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    try {
      setUploading(true);
      const uploaded = await Promise.all(list.map((file) => blogService.uploadImage(file)));
      if (type === "featured") {
        setForm((prev) => ({ ...prev, featuredImage: uploaded[0] || "" }));
      } else {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
      }
      setHasChanges(true);
      toast.success("Images uploaded");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, imageIndex) => imageIndex !== index) }));
    setHasChanges(true);
  };

  const validate = () => {
    if (!form.title.trim() || form.title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return false;
    }
    if (!form.content.trim() || form.content.trim().length < 20) {
      toast.error("Content must be at least 20 characters");
      return false;
    }
    return true;
  };

  const handleSave = async (publish = false) => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = buildPayload();
      payload.status = publish ? "published" : form.status || "draft";
      const savedBlog = blogId
        ? await blogService.updateBlog(blogId, payload)
        : await blogService.createBlog(payload);

      toast.success(publish ? "Blog published" : "Blog saved");
      if (!blogId && savedBlog?._id) {
        setBlogId(savedBlog._id);
      }
      if (!isEditMode) {
        navigate(`/admin/blogs/edit/${savedBlog._id}`);
      }
      setHasChanges(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save blog");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const words = (form.content || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [form.content]);

  if (loading) {
    return <div className="admin-blog-page"><p>Loading blog editor...</p></div>;
  }

  return (
    <div className="admin-blog-page">
      <div className="admin-blog-header">
        <div>
          <h2>{isEditMode ? "Edit Blog" : "Add Blog"}</h2>
          <p>Manage your article content, SEO, and related products in one place.</p>
        </div>
        <div className="admin-blog-actions">
          <button type="button" className="secondary-btn" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <button type="button" className="secondary-btn" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button type="button" className="primary-btn" onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="blog-stats-grid">
        <BlogStatCard title="Total Blogs" value={stats.total} hint="All entries" />
        <BlogStatCard title="Published" value={stats.published} hint="Live" />
        <BlogStatCard title="Draft" value={stats.drafts} hint="In progress" />
        <BlogStatCard title="Featured" value={stats.featured} hint="Pinned" />
      </div>

      <div className="blog-editor-grid">
        <div className="blog-editor-panel">
          <div className="form-section">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleFieldChange("title", event.target.value)}
              placeholder="Blog title"
            />
          </div>

          <div className="form-section">
            <label>Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => handleFieldChange("slug", event.target.value)}
              placeholder="seo-friendly-slug"
            />
          </div>

          <div className="form-section">
            <label>Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(event) => handleFieldChange("excerpt", event.target.value)}
              rows={3}
              placeholder="Short description"
            />
          </div>

          <div className="form-section">
            <label>Content</label>
            <div className="rich-editor-toolbar">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyBlockFormat("h1"); }}>H1</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyBlockFormat("h2"); }}>H2</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyBlockFormat("h3"); }}>H3</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat("bold"); }}><strong>B</strong></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat("italic"); }}><em>I</em></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat("insertUnorderedList"); }}>• List</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat("insertOrderedList"); }}>1. List</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); applyBlockFormat("blockquote"); }}>Quote</button>
            </div>
            <div
              ref={editorRef}
              className="rich-editor"
              contentEditable
              onInput={() => {
                setForm((prev) => ({ ...prev, content: editorRef.current?.innerHTML || prev.content }));
                setHasChanges(true);
              }}
            />
          </div>

          <div className="form-section">
            <label>Featured Image</label>
            <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event.target.files, "featured")} />
            {uploading ? <p>Uploading image...</p> : null}
            {form.featuredImage ? <img className="image-preview-item" src={form.featuredImage} alt="Featured" /> : null}
          </div>

          <div className="form-section">
            <label>Additional Images</label>
            <input type="file" accept="image/*" multiple onChange={(event) => handleImageUpload(event.target.files, "gallery")} />
            <div className="gallery-grid">
              {form.images.map((image, index) => (
                <div key={`${image}-${index}`} className="gallery-card">
                  <img src={image} alt={`Gallery ${index + 1}`} />
                  <button type="button" onClick={() => handleRemoveImage(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label>Category</label>
            <div className="chip-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`chip ${form.category === category ? "active" : ""}`}
                  onClick={() => handleFieldChange("category", category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="inline-field">
              <input
                type="text"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                placeholder="Create a category"
              />
              <button type="button" onClick={handleAddCategory}>
                Add
              </button>
            </div>
          </div>

          <div className="form-section">
            <label>Tags</label>
            <div className="chip-row">
              {tags.map((tag) => (
                <button key={tag} type="button" className={`chip ${form.tags.includes(tag) ? "active" : ""}`} onClick={() => handleFieldChange("tags", form.tags.includes(tag) ? form.tags.filter((item) => item !== tag) : [...form.tags, tag])}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="inline-field">
              <input type="text" value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Create a tag" />
              <button type="button" onClick={handleAddTag}>
                Add
              </button>
            </div>
          </div>

          <div className="form-section">
            <label>Status</label>
            <select value={form.status} onChange={(event) => handleFieldChange("status", event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.featured} onChange={(event) => handleFieldChange("featured", event.target.checked)} />
              Feature this blog
            </label>
          </div>
        </div>

        <div className="blog-sidebar-panel">
          <div className="form-section">
            <label>SEO Panel</label>
            <input type="text" value={form.metaTitle} onChange={(event) => handleFieldChange("metaTitle", event.target.value)} placeholder="Meta title" />
            <textarea value={form.metaDescription} onChange={(event) => handleFieldChange("metaDescription", event.target.value)} rows={3} placeholder="Meta description" />
            <input type="text" value={form.canonical} onChange={(event) => handleFieldChange("canonical", event.target.value)} placeholder="Canonical URL" />
            <input type="text" value={form.ogImage} onChange={(event) => handleFieldChange("ogImage", event.target.value)} placeholder="OG image URL" />
          </div>

          <div className="form-section">
            <label>Related Products</label>
            <div className="related-products-list">
              {products.map((product) => (
                <label key={product._id} className="related-product-item">
                  <input type="checkbox" checked={form.relatedProducts.includes(product._id)} onChange={() => handleProductToggle(product._id)} />
                  {product.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="section-title-row">
              <label>FAQ Builder</label>
              <button type="button" onClick={handleAddFaq}>
                + Add
              </button>
            </div>
            {form.faq.map((item, index) => (
              <div key={`${item.question}-${index}`} className="faq-item">
                <input
                  type="text"
                  value={item.question}
                  onChange={(event) => updateFaqItem(index, "question", event.target.value)}
                  placeholder="Question"
                />
                <textarea
                  value={item.answer}
                  onChange={(event) => updateFaqItem(index, "answer", event.target.value)}
                  placeholder="Answer"
                  rows={3}
                />
                <button type="button" onClick={() => removeFaqItem(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="form-section compact-card">
            <h4>Quick Tips</h4>
            <ul>
              <li>Autosave keeps drafts safe while you edit.</li>
              <li>Use categories and tags to keep search tidy.</li>
              <li>Related products help with blog-driven discovery.</li>
            </ul>
            <p>Estimated reading time: {summary} min</p>
            {autoSaving ? <p className="autosave">Autosaving draft...</p> : null}
          </div>
        </div>
      </div>

      <BlogPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} blog={form} />
    </div>
  );
}

export default BlogEditorForm;

function BlogPreviewModal({ open, onClose, blog }) {
  if (!open || !blog) return null;

  return (
    <div className="blog-preview-overlay" onClick={onClose}>
      <div className="blog-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="blog-preview-header">
          <h3>Preview</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="blog-preview-content">
          <div className="blog-preview-meta">
            <span>{blog.category || "General"}</span>
            <span>{blog.status || "draft"}</span>
          </div>

          <h2>{blog.title || "Untitled Blog"}</h2>
          <p>{blog.excerpt || "A short summary will appear here."}</p>
          <div
            className="blog-preview-body"
            dangerouslySetInnerHTML={{ __html: blog.content || "<p>Write your content...</p>" }}
          />
        </div>
      </div>
    </div>
  );
}

export default BlogPreviewModal;

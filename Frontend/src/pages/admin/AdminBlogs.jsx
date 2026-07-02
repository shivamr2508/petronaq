import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { blogService } from "../../services/blogService";
import "../../styles/adminBlogs.css";

function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, featured: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const loadData = async () => {
    try {
      const [blogList, statsData] = await Promise.all([blogService.getAdminBlogs(), blogService.getStats()]);
      setBlogs(blogList || []);
      setStats(statsData || { total: 0, published: 0, drafts: 0, featured: 0 });
    } catch {
      toast.error("Unable to load blogs");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredBlogs = useMemo(() => {
    return (blogs || []).filter((blog) => {
      const matchesSearch = !search || [blog.title, blog.slug, blog.category, ...(blog.tags || [])].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, search, statusFilter]);

  const paginatedBlogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBlogs.slice(start, start + pageSize);
  }, [filteredBlogs, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / pageSize));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkAction = async (action, category = "") => {
    if (!selectedIds.length) return;

    try {
      await blogService.bulkUpdateBlogs({ ids: selectedIds, action, category });
      toast.success(`Updated ${selectedIds.length} blog(s)`);
      setSelectedIds([]);
      await loadData();
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await blogService.deleteBlog(id);
      toast.success("Blog deleted");
      await loadData();
    } catch {
      toast.error("Unable to delete blog");
    }
  };

  const handleDuplicate = async (blog) => {
    try {
      const payload = {
        ...blog,
        title: `${blog.title} (Copy)`,
        slug: `${blog.slug || "blog"}-copy`,
        status: "draft",
        featured: false,
      };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      await blogService.createBlog(payload);
      toast.success("Blog duplicated");
      await loadData();
    } catch {
      toast.error("Unable to duplicate blog");
    }
  };

  return (
    <div className="admin-blog-page">
      <div className="admin-blog-header">
        <div>
          <h2>Manage Blogs</h2>
          <p>Search, filter, update, and publish content without leaving the admin dashboard.</p>
        </div>
        <div className="admin-blog-actions">
          <button type="button" className="secondary-btn" onClick={() => navigate("/admin/blogs/add")}>+ Add Blog</button>
        </div>
      </div>

      <div className="blog-stats-grid">
        <div className="blog-stat-card">
          <h4>Total Blogs</h4>
          <p>{stats.total}</p>
        </div>
        <div className="blog-stat-card">
          <h4>Published</h4>
          <p>{stats.published}</p>
        </div>
        <div className="blog-stat-card">
          <h4>Draft</h4>
          <p>{stats.drafts}</p>
        </div>
        <div className="blog-stat-card">
          <h4>Featured</h4>
          <p>{stats.featured}</p>
        </div>
      </div>

      <div className="admin-blog-list">
        <div className="blog-toolbar">
          <div className="controls">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blogs" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="controls">
            <input value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} placeholder="Bulk category" />
            <button type="button" onClick={() => handleBulkAction("category", bulkCategory)}>Bulk Category</button>
            <button type="button" onClick={() => handleBulkAction("publish")}>Bulk Publish</button>
            <button type="button" onClick={() => handleBulkAction("draft")}>Bulk Draft</button>
            <button type="button" onClick={() => handleBulkAction("feature")}>Bulk Feature</button>
            <button type="button" onClick={() => handleBulkAction("delete")}>Bulk Delete</button>
          </div>
        </div>

        <table className="blog-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th>Views</th>
              <th>Reading</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBlogs.map((blog) => (
              <tr key={blog._id} className="blog-row">
                <td><input type="checkbox" checked={selectedIds.includes(blog._id)} onChange={() => toggleSelect(blog._id)} /></td>
                <td>
                  <strong>{blog.title}</strong>
                  <div>{blog.slug}</div>
                </td>
                <td>{blog.status}</td>
                <td>{blog.category}</td>
                <td>{blog.views || 0}</td>
                <td>{blog.readingTime || 1} min</td>
                <td>
                  <div className="blog-row-actions">
                    <Link to={`/admin/blogs/edit/${blog._id}`}>Edit</Link>
                    <button type="button" onClick={() => handleDuplicate(blog)}>Duplicate</button>
                    <button type="button" onClick={() => handleDelete(blog._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <span>Showing {pagedBlogsRange(paginatedBlogs.length, page, pageSize, filteredBlogs.length)}</span>
          <div className="pagination-actions">
            <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function pagedBlogsRange(length, page, pageSize, total) {
  if (!length) return "0 results";
  const start = (page - 1) * pageSize + 1;
  return `${start}-${Math.min(start + length - 1, total)} of ${total}`;
}

export default AdminBlogs;

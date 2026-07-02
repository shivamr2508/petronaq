import { Link } from "react-router-dom";

function Breadcrumbs({ items = [] }) {
  return (
    <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
      <Link to="/blog">Blog</Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          <span className="breadcrumb-separator">/</span>
          {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;

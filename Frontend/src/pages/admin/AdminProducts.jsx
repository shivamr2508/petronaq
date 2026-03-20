import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/adminProduct.css";

function AdminProducts() {

  const [products,setProducts] = useState([]);

  useEffect(()=>{
    fetchProducts();
  },[]);

  const fetchProducts = async()=>{

    const res = await axios.get(
      "/api/products"
    );

    setProducts(res.data);

  };

  const handleDelete = async(id)=>{

    const token = localStorage.getItem("token");

    await axios.delete(
      `/api/products/${id}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    fetchProducts();

  };

  return(

<div className="admin-products-page">

<div className="products-header">

<h2>Manage Products</h2>

<a
href="/admin/add-product"
className="add-product-btn"
>
+ Add Product
</a>

</div>


<div className="products-list">

{products.map((product)=>(
  
<div key={product._id} className="product-row">

<div className="product-image">

<img
src={product.images?.[0]}
alt={product.name}
/>

</div>


<div className="product-details">

<div className="product-top">

<h3>{product.name}</h3>

<span className="price">
₹{product.price}
</span>

</div>


<p>
<b>Pets:</b> {product.petTypes?.join(", ")}
</p>

<p>
<b>Category:</b> {product.categories?.join(", ")}
</p>

<p>
<b>Stock:</b> {product.stock}
</p>



<div className="product-actions">

<a
href={`/admin/edit-product/${product._id}`}
className="edit-btn"
>
Edit
</a>

<button
className="delete-btn"
onClick={()=>handleDelete(product._id)}
>
Delete
</button>

</div>

</div>

</div>

))}

</div>

</div>

  );
}

export default AdminProducts;
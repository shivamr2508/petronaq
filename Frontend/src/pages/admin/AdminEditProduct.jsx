import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/adminEdit.css";

function AdminEditProduct() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [name,setName] = useState("");
  const [price,setPrice] = useState("");
  const [smallDescription, setSmallDescription] = useState("");
const [discountPrice, setDiscountPrice] = useState("");
  const [stock,setStock] = useState(0);
  const [description,setDescription] = useState("");

  const [petTypes,setPetTypes] = useState([]);
  const [categories,setCategories] = useState([]);

  const [image,setImage] = useState(null);
  const [currentImage,setCurrentImage] = useState("");

  useEffect(()=>{
    fetchProduct();
  },[]);


  const fetchProduct = async()=>{

    const res = await axios.get(
      `/api/products/${id}`
    );

    const product = res.data;

    setName(product.name);
    setPrice(product.price);
    setSmallDescription(product.smallDescription || "");
setDiscountPrice(product.discountPrice || "");
    setStock(product.stock);
    setDescription(product.description);

    setCurrentImage(product.images[0]);

    setPetTypes(product.petTypes || []);
    setCategories(product.categories || []);

  };


  const handleCheckbox = (value,state,setState)=>{

    if(state.includes(value)){
      setState(state.filter(item=>item !== value));
    }
    else{
      setState([...state,value]);
    }

  };


  const handleSubmit = async(e)=>{

    e.preventDefault();

    const token = localStorage.getItem("token");

    let imageUrl = currentImage;

    if(image){

      const formData = new FormData();
      formData.append("image",image);

      const uploadRes = await axios.post(
        "/api/upload",
        formData,
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      imageUrl = uploadRes.data.url;

    }

    await axios.put(
  `/api/products/${id}`,
  {
    name,
    smallDescription, // ✅ NEW
    description,
    price,
    discountPrice, // ✅ NEW
    stock,
    images: [imageUrl],
    petTypes,
    categories
  },
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    alert("Product updated");

    navigate("/admin/products");

  };


  return(

<div className="admin-edit-page">

<h2 className="page-title">
Edit Product
</h2>

<div className="form-card">

<form
onSubmit={handleSubmit}
className="admin-product-form"
>

{/* BASIC INFO */}

<div className="form-section">

<h3>Basic Information : </h3>


<div className="input-group">
  <label>Product Name</label>
  <input
    value={name}
    placeholder="Enter product name"
    onChange={(e)=>setName(e.target.value)}
  />
</div>

<div className="input-group">
  <label>MRP Price (Original Price)</label>
  <input
    type="number"
    value={price}
    placeholder="Enter original price (e.g. 500)"
    onChange={(e)=>setPrice(e.target.value)}
  />
</div>

<div className="input-group">
  <label>Selling Price (Discount Price)</label>
  <input
    type="number"
    value={discountPrice}
    placeholder="Enter discounted price (e.g. 399)"
    onChange={(e)=>setDiscountPrice(e.target.value)}
  />
</div>

<div className="input-group">
  <label>Stock Quantity</label>
  <input
    type="number"
    value={stock}
    placeholder="Available stock"
    onChange={(e)=>setStock(Number(e.target.value))}
  />
</div>

{/* <input
value={name}
placeholder="Product Name"
onChange={(e)=>setName(e.target.value)}
/>


<input
type="number"
value={price}
placeholder="Original Price (MRP)"
onChange={(e)=>setPrice(e.target.value)}
/>

<input
type="number"
value={discountPrice}
placeholder="Discount Price (Selling Price)"
onChange={(e)=>setDiscountPrice(e.target.value)}
/>


<input
type="number"
value={stock}
placeholder="Stock Quantity"
onChange={(e)=>setStock(Number(e.target.value))}
/> */}

</div>


{/* PET TYPES */}

<div className="form-section">

<h3>Pet Types</h3>

<div className="checkbox-group">

<label>
<input
type="checkbox"
checked={petTypes.includes("Dog")}
onChange={()=>handleCheckbox("Dog",petTypes,setPetTypes)}
/>
Dog
</label>

<label>
<input
type="checkbox"
checked={petTypes.includes("Cat")}
onChange={()=>handleCheckbox("Cat",petTypes,setPetTypes)}
/>
Cat
</label>

<label>
<input
type="checkbox"
checked={petTypes.includes("Fish")}
onChange={()=>handleCheckbox("Fish",petTypes,setPetTypes)}
/>
Fish
</label>

<label>
<input
type="checkbox"
checked={petTypes.includes("Bird")}
onChange={()=>handleCheckbox("Bird",petTypes,setPetTypes)}
/>
Bird
</label>

</div>

</div>


{/* CATEGORIES */}

<div className="form-section">

<h3>Categories</h3>

<div className="checkbox-group">

<label>
<input
type="checkbox"
checked={categories.includes("Food")}
onChange={()=>handleCheckbox("Food",categories,setCategories)}
/>
Food
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Toys")}
onChange={()=>handleCheckbox("Toys",categories,setCategories)}
/>
Toys
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Treats")}
onChange={()=>handleCheckbox("Treats",categories,setCategories)}
/>
Treats
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Accessories")}
onChange={()=>handleCheckbox("Accessories",categories,setCategories)}
/>
Accessories
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Grooming")}
onChange={()=>handleCheckbox("Grooming",categories,setCategories)}
/>
Grooming
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Beds")}
onChange={()=>handleCheckbox("Beds",categories,setCategories)}
/>
Beds
</label>

<label>
<input
type="checkbox"
checked={categories.includes("Health")}
onChange={()=>handleCheckbox("Health",categories,setCategories)}
/>
Health
</label>

</div>

</div>


{/* DESCRIPTION */}

<div className="form-section">

  <h3>Short Description</h3>

<textarea
value={smallDescription}
placeholder="Small description (for cards)"
onChange={(e)=>setSmallDescription(e.target.value)}
/>

<h3>Detailed Description</h3>

<textarea
value={description}
onChange={(e)=>setDescription(e.target.value)}
/>

</div>


{/* IMAGE */}

<div className="form-section">

<h3>Product Image</h3>

<img
src={currentImage}
className="current-image"
alt="product"
/>

<input
type="file"
onChange={(e)=>setImage(e.target.files[0])}
/>

</div>


<button className="submit-btn">
Update Product
</button>

</form>

</div>

</div>

  );

}

export default AdminEditProduct;
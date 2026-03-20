import { useState } from "react";
import axios from "axios";
import "../../styles/adminAddProduct.css";

function AdminAddProduct() {

  const [name,setName] = useState("");
  const [price,setPrice] = useState("");
  const [stock,setStock] = useState(0);
  const [description,setDescription] = useState("");
  const [images,setImages] = useState([]);
  const [previewImages,setPreviewImages] = useState([]);
  const [petTypes,setPetTypes] = useState([]);
  const [categories,setCategories] = useState([]);

  const handleImages = (e)=>{

    const files = Array.from(e.target.files);

    setImages(files);

    const previews = files.map(file =>
      URL.createObjectURL(file)
    );

    setPreviewImages(previews);

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

    try{

      let uploadedUrls = [];

      for(let img of images){

        const formData = new FormData();
        formData.append("image",img);

        const uploadRes = await axios.post(
          "/api/upload",
          formData,
          {
            headers:{
              Authorization:`Bearer ${token}`
            }
          }
        );

        uploadedUrls.push(uploadRes.data.url);

      }

      await axios.post(
        "/api/products",
        {
          name,
          price:Number(price),
          stock:Number(stock),
          description,
          images:uploadedUrls,
          petTypes,
          categories
        },
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      alert("Product added");

      window.location.href="/admin/products";

    }
    catch(error){

      console.error(error);
      alert("Error adding product");

    }

  };

  return(

<div className="admin-add-page">

<h2 className="page-title">
Add New Product
</h2>

<div className="form-card">

<form
onSubmit={handleSubmit}
className="admin-product-form"
>

{/* BASIC INFO */}

<div className="form-section">

<h3>Basic Information</h3>

<input
type="text"
placeholder="Product Name"
onChange={(e)=>setName(e.target.value)}
required
/>

<input
type="number"
placeholder="Price"
onChange={(e)=>setPrice(e.target.value)}
required
/>

<input
type="number"
placeholder="Stock Quantity"
value={stock}
onChange={(e)=>setStock(Number(e.target.value))}
/>

</div>


{/* PET TYPES */}

<div className="form-section">

<h3>Pet Types</h3>

<div className="checkbox-group">

<label>
<input
type="checkbox"
onChange={()=>handleCheckbox("Dog",petTypes,setPetTypes)}
/>
Dog
</label>

<label>
<input
type="checkbox"
onChange={()=>handleCheckbox("Cat",petTypes,setPetTypes)}
/>
Cat
</label>

<label>
<input
type="checkbox"
onChange={()=>handleCheckbox("Fish",petTypes,setPetTypes)}
/>
Fish
</label>

<label>
<input
type="checkbox"
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

<label><input type="checkbox" onChange={()=>handleCheckbox("Food",categories,setCategories)}/>Food</label>
<label><input type="checkbox" onChange={()=>handleCheckbox("Toys",categories,setCategories)}/>Toys</label>
<label><input type="checkbox" onChange={()=>handleCheckbox("Accessories",categories,setCategories)}/>Accessories</label>
<label><input type="checkbox" onChange={()=>handleCheckbox("Grooming",categories,setCategories)}/>Grooming</label>
<label><input type="checkbox" onChange={()=>handleCheckbox("Beds",categories,setCategories)}/>Beds</label>
<label><input type="checkbox" onChange={()=>handleCheckbox("Health",categories,setCategories)}/>Health</label>

</div>

</div>


{/* DESCRIPTION */}

<div className="form-section">

<h3>Description</h3>

<textarea
placeholder="Product Description"
onChange={(e)=>setDescription(e.target.value)}
required
/>

</div>


{/* IMAGES */}

<div className="form-section">

<h3>Product Images</h3>

<input
type="file"
multiple
onChange={handleImages}
/>

<div className="image-preview">

{previewImages.map((img,index)=>(
<img
key={index}
src={img}
alt="preview"
/>
))}

</div>

</div>


<button
className="submit-btn"
>
Add Product
</button>

</form>

</div>

</div>

  );
}

export default AdminAddProduct;
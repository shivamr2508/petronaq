import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";
import "../../styles/adminCoupons.css";

function AdminCoupons() {

  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {

    const token = localStorage.getItem("token");

    const res = await axios.get(
      `${API_BASE}/api/coupons`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    setCoupons(res.data);

  };

  const createCoupon = async (e) => {

    e.preventDefault();

    const token = localStorage.getItem("token");

    await axios.post(
      `${API_BASE}/api/coupons`,
      { code, discount },
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    setCode("");
    setDiscount("");

    fetchCoupons();

  };

  const deleteCoupon = async (id) => {

    const token = localStorage.getItem("token");

    await axios.delete(
      `${API_BASE}/api/coupons/${id}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    fetchCoupons();

  };

  return (

<div className="admin-coupons-page">

<h2 className="page-title">
Manage Coupons
</h2>

{/* CREATE COUPON */}

<div className="coupon-form-card">

<h3>Create New Coupon</h3>

<form
onSubmit={createCoupon}
className="coupon-form"
>

<input
placeholder="Coupon Code"
value={code}
onChange={(e)=>setCode(e.target.value)}
required
/>

<input
placeholder="Discount %"
value={discount}
onChange={(e)=>setDiscount(e.target.value)}
required
/>

<button className="create-coupon-btn">
Create Coupon
</button>

</form>

</div>


{/* COUPONS LIST */}

<div className="coupon-grid">

{coupons.map((coupon)=>(
  
<div key={coupon._id} className="coupon-card">

<div className="coupon-info">

<h3>{coupon.code}</h3>

<span className="coupon-discount">
{coupon.discount}% OFF
</span>

</div>

<button
className="delete-coupon-btn"
onClick={()=>deleteCoupon(coupon._id)}
>
Delete
</button>

</div>

))}

</div>

</div>

  );

}

export default AdminCoupons;
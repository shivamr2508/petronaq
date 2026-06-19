import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";
import "../../styles/adminOrder.css";

function AdminOrders() {

const [orders,setOrders] = useState([]);

useEffect(()=>{
fetchOrders();
},[]);


const fetchOrders = async()=>{

const token = localStorage.getItem("token");

	const res = await axios.get(
		`${API_BASE}/api/orders`,
		{
			headers:{ Authorization:`Bearer ${token}` }
		}
	);

const validOrders = res.data.filter(
order => order.address !== null
);

setOrders(validOrders);

};


const updateStatus = async(id,status)=>{

const token = localStorage.getItem("token");

	await axios.put(
		`${API_BASE}/api/orders/${id}/status`,
{ status },
{
headers:{ Authorization:`Bearer ${token}` }
}
);

fetchOrders();

};



return(

<div className="admin-orders-page">

<h2 className="orders-title">
Manage Orders
</h2>


{orders.map(order=>(

<div key={order._id} className="order-card">

{/* HEADER */}

<div className="order-header">

<div>
<h3>Order #{order._id.slice(-6)}</h3>
<span className="order-status status-${order.status.replace(/\s/g,'')}`}">
{order.status}
</span>
</div>

<select
className="status-select"
value={order.status}
onChange={(e)=>updateStatus(order._id,e.target.value)}
>

<option value="Pending">Pending</option>

<option value="Confirmed">Confirmed</option>

<option value="Shipped">Shipped</option>

<option value="Out for Delivery">Out for Delivery</option>

<option value="Delivered">Delivered</option>

<option value="Cancelled">Cancelled</option>

</select>

</div>


{/* CUSTOMER */}

<div className="order-section">

<h4>Customer</h4>

<p><b>Name:</b> {order.user ? order.user.name : "Unknown"}</p>

<p><b>Email:</b> {order.user ? order.user.email : "N/A"}</p>

<p><b>Phone:</b> {order.address?.phone}</p>

</div>


{/* ADDRESS */}

<div className="order-section">

<h4>Delivery Address</h4>

<p>
{order.address?.addressLine}
<br/>
{order.address?.city} - {order.address?.postalCode}
</p>

</div>


{/* PRODUCTS */}

<div className="order-section">

<h4>Products</h4>

<div className="products-list">

{order.items.map((item,index)=>(

<div key={index} className="order-product">

<img
src={item.image || "/no-image.png"}
alt={item.name}
/>

<div className="product-info">

<p className="product-name">
{item.name}
</p>

<p>
₹{item.price} × {item.quantity}
</p>

<p className="subtotal">
Subtotal: ₹{item.price * item.quantity}
</p>

</div>

</div>

))}

</div>

</div>


{/* ORDER TOTAL */}

<div className="order-summary">

<p>Subtotal: ₹{order.subtotal}</p>

<p>Delivery: ₹{order.deliveryCharge}</p>

<p className="total">
Total: ₹{order.totalAmount}
</p>

</div>

</div>

))}

</div>

);

}

export default AdminOrders;
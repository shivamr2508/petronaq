import axios from "axios";
import { useEffect, useState } from "react";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "../services/addressService";
import { placeOrder } from "../services/orderService";
import { useNavigate, useLocation } from "react-router-dom";
import { getCart } from "../services/cartService";
import { updateCartItem } from "../services/cartService";
import { removeFromCart } from "../services/cartService";
import pincodeCoordinates from "../utils/pincodeCoordinates";
import "../styles/checkout.css";

import { showSuccess, showError } from "../utils/toast";

function CheckoutPage() {

  const [showAddressForm, setShowAddressForm] = useState(false);
 
  const [placingOrder, setPlacingOrder] = useState(false);

const [newAddress, setNewAddress] = useState({
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  lat: 23.9716,
  lng: 72.5317
});

  
const [cartItems, setCartItems] = useState([]);



  const [couponCode, setCouponCode] = useState("");
const [discount, setDiscount] = useState(0);
const [totalAmount, setTotalAmount] = useState(0);
const [finalTotal, setFinalTotal] = useState(0);
const [deliveryCharge, setDeliveryCharge] = useState(0);
const navigate = useNavigate();
const location = useLocation();

const params = new URLSearchParams(location.search);

const checkoutProductId = params.get("productId");
const checkoutQty = parseInt(params.get("qty")) || 1;
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
   const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  setTotalAmount(subtotal);

}, [cartItems]);

useEffect(() => {

  const total = totalAmount - discount + deliveryCharge;

  setFinalTotal(total);

}, [totalAmount, discount, deliveryCharge]);





//   const fetchCartItems = async () => {

//   const cart = await getCart();

//   if (checkoutProductId) {

//     const item = cart.items.find(
//       i => i.product._id === checkoutProductId
//     );

//     setCartItems(item ? [item] : []);

//   } else {

//     setCartItems(cart.items);

//   }

// };


const fetchCartItems = async () => {

  if (checkoutProductId) {

    // Buy Now flow → fetch product directly

    const res = await axios.get(
      `/api/products/${checkoutProductId}`
    );

    const product = res.data;

    setCartItems([
      {
        product,
        quantity: checkoutQty
      }
    ]);

  } else {

    // Normal cart checkout

    const cart = await getCart();

    setCartItems(cart.items);

  }

};

//   const applyCoupon = async () => {

//   try {

//     const token = localStorage.getItem("token");

//     const res = await axios.get(
//       "/api/coupons",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const coupon = res.data.find(
//       c => c.code.toLowerCase() === couponCode.toLowerCase()
//     );

//     if (!res.data || res.data.length === 0) {

//       alert("No coupons available");

//       return;

//     }

//     const discountAmount =
//       totalAmount * (coupon.discount / 100);

//     const newTotal =
//       totalAmount - discountAmount;

//     setDiscount(discountAmount);

//     setFinalTotal(newTotal);

//     alert("Coupon applied");

//   } catch (error) {

//     alert("Error applying coupon");

//   }

// };

const applyCoupon = async () => {

  try {

    const token = localStorage.getItem("token");

    const res = await axios.get(
      "/api/coupons",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.data || res.data.length === 0) {
      showError("No coupons available");
      return;
    }

    const coupon = res.data.find(
      c => c.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (!coupon) {
      showError("Invalid coupon code");
      return;
    }

    const discountAmount =
      totalAmount * (coupon.discount / 100);

    const newTotal =
      totalAmount - discountAmount;

    setDiscount(discountAmount);
    setFinalTotal(newTotal);

    showSuccess("Coupon applied 🎉");

  } catch (error) {

    showError("Error applying coupon");

  }

};


//   const fetchCartTotal = async () => {

//   const token = localStorage.getItem("token");

//   const res = await axios.get(
//     "/api/cart",
//     {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     }
//   );

//   // const total = res.data.items.reduce(
//   //   (sum, item) =>
//   //     sum + item.product.price * item.quantity,
//   //   0
//   // );

//   let items = res.data.items;

// if (checkoutProductId) {

//   const productRes = await axios.get(
//     `/api/products/${checkoutProductId}`
//   );

//   const product = productRes.data;

//   items = [
//     {
//       product,
//       quantity: 1
//     }
//   ];

// }

// const total = items.reduce(
//   (sum, item) =>
//     sum + item.product.price * item.quantity,
//   0
// );

//   setTotalAmount(total);
//   setFinalTotal(total);

// };

  useEffect(() => {

    fetchAddresses();
    // fetchCartTotal();
    fetchCartItems();

  }, []);

  const handleAddressChange = (e) => {

  setNewAddress({
    ...newAddress,
    [e.target.name]: e.target.value
  });

};


const handleEditAddress = (address) => {

  setNewAddress({
    fullName: address.fullName,
    phone: address.phone,
    addressLine: address.addressLine,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode
  });

  setEditingAddressId(address._id);
  setShowAddressForm(true);
};

//-------------

const handleSaveAddress = async () => {

  try {

    const fullQuery = `${newAddress.postalCode}, Ahmedabad, Gujarat, India`;

    console.log("Searching:", fullQuery);

    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: fullQuery,
          format: "json",
          limit: 1,
          countrycodes: "in",
          viewbox: "72.35,23.20,72.75,22.90", // Ahmedabad bounding box
          bounded: 1
        },
        headers: {
          "Accept-Language": "en"
        }
      }
    );

    if (!geoRes.data || geoRes.data.length === 0) {

        showError("Invalid Ahmedabad postal code");

      return;

    }

    const lat = parseFloat(geoRes.data[0].lat);
    const lng = parseFloat(geoRes.data[0].lon);

    console.log("Coordinates found:", lat, lng);

    const addressWithCoords = {
      ...newAddress,
      lat,
      lng
    };

    await addAddress(addressWithCoords);

     showSuccess("Address saved successfully");

    fetchAddresses();

    setShowAddressForm(false);

  } catch (error) {

    console.error(error);

     showError("Error saving address");

  }

};

//-----------


  const fetchAddresses = async () => {

    const data = await getAddresses();

    setAddresses(data);

  };

//  const handleOrder = async () => {

//   if (!selectedAddress) {

//     // alert("Select address");
//      showError("Please select or Add an address");
//     return;

//   }

//   try {

//     const orderItems = cartItems.map(item => ({
//       productId: item.product._id,
//       quantity: item.quantity
//     }));

//     const order = await placeOrder({
//       addressId: selectedAddress,
//       items: orderItems
//     });

//       showSuccess("Order placed successfully 🎉");
//     navigate("/order-success", {
//       state: { order }
//     });

//   } catch (error) {

//     console.error(error);
//        showError("Order failed. Try again");   

//   }

// };


const handleOrder = async () => {

  if (placingOrder) return; // 🚨 prevent double click

  if (!selectedAddress) {
    showError("Please select an address");
    return;
  }

  try {

    setPlacingOrder(true);

    const orderItems = cartItems.map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));

    const order = await placeOrder({
      addressId: selectedAddress,
      items: orderItems,
       discount: discount  
    });

    showSuccess("Order placed successfully 🎉");

    navigate("/order-success", {
      state: { order }
    });

  } catch (error) {

    showError("Order failed. Try again");

  } finally {
    setPlacingOrder(false);
  }

};


const calculateDelivery = (addressId) => {

  const address = addresses.find(a => a._id === addressId);

  if (!address || !address.lat) return;

  const CENTER_LAT = 23.0943;
  const CENTER_LNG = 72.5417;

  const toRad = (value) => value * Math.PI / 180;

  const R = 6371;

  const dLat = toRad(address.lat - CENTER_LAT);
  const dLng = toRad(address.lng - CENTER_LNG);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(CENTER_LAT)) *
    Math.cos(toRad(address.lat)) *
    Math.sin(dLng/2) *
    Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;

  if (distance <= 10) {

    setDeliveryCharge(0);

    setFinalTotal(totalAmount - discount);

  }

  else if (distance <= 30) {

    setDeliveryCharge(50);

    setFinalTotal(totalAmount - discount + 50);

  }

  else {

    showError("Delivery not available");

  }

};



//---

const increaseQty = async (productId) => {

  const item = cartItems.find(
    item => item.product._id === productId
  );

  if (item.quantity >= item.product.stock) {
    showError("Maximum stock reached");
    return;
  }

  const newQty = item.quantity + 1;

  if (checkoutProductId) {

    // BUY NOW → update locally
    setCartItems(prev =>
      prev.map(i =>
        i.product._id === productId
          ? { ...i, quantity: newQty }
          : i
      )
    );

  } else {

    // CART → update database
    await updateCartItem(productId, newQty);

    fetchCartItems();
    // fetchCartTotal();

  }

};



const decreaseQty = async (productId) => {

  const item = cartItems.find(
    item => item.product._id === productId
  );

  const newQty = item.quantity - 1;

  if (checkoutProductId) {

    // BUY NOW FLOW

    if (newQty <= 0) {

      setCartItems(prev =>
        prev.filter(i => i.product._id !== productId)
      );

    } else {

      setCartItems(prev =>
        prev.map(i =>
          i.product._id === productId
            ? { ...i, quantity: newQty }
            : i
        )
      );

    }

  } else {

    // CART FLOW

    
if (newQty <= 0) {

  // remove from backend
  await removeFromCart(productId);

    showSuccess("Item removed from cart");

  // remove from UI
  setCartItems(prev =>
    prev.filter(i => i.product._id !== productId)
  );

  return;

}

    await updateCartItem(productId, newQty);

    fetchCartItems();
    // fetchCartTotal();

  }

};

//---

const updateTotals = (items) => {

  const subtotal = items.reduce(

    (sum, item) => sum + item.product.price * item.quantity,

    0

  );

  setTotalAmount(subtotal);

  const final = subtotal - discount + deliveryCharge;

  setFinalTotal(final);

};

const handleDeleteAddress = async (id) => {

try{

await deleteAddress(id);

 showSuccess("Address deleted");

fetchAddresses();

}catch(error){

showError("Failed to delete address");

}

}

 return (
<div className="checkout-container">

{/* DELIVERY DETAILS */}

{/* DELIVERY DETAILS */}
  <div className="left-side">

<div className="checkout-section">

<h2 className="section-title">Delivery Details</h2>

{/* SHOW FORM IF NO ADDRESS */}

{addresses.length === 0 && (

<div className="address-form">

<input
name="fullName"
placeholder="Full Name"
value={newAddress.fullName}
onChange={handleAddressChange}
/>

<input
name="phone"
placeholder="Phone Number"
value={newAddress.phone}
onChange={handleAddressChange}
/>

<input
name="addressLine"
placeholder="House / Street Address"
value={newAddress.addressLine}
onChange={handleAddressChange}
/>

<div className="form-row">

<input
name="city"
placeholder="City"
value={newAddress.city}
onChange={handleAddressChange}
/>

<input
name="postalCode"
placeholder="Postal Code"
value={newAddress.postalCode}
onChange={handleAddressChange}
/>

</div>

<input
name="state"
placeholder="State"
value={newAddress.state}
onChange={handleAddressChange}
/>

<button
className="save-address-btn"
onClick={handleSaveAddress}
>
Save Address
</button>

</div>

)}

{/* SHOW SAVED ADDRESSES */}

{addresses.map((address) => (

<div
key={address._id}
className={`address-card ${selectedAddress === address._id ? "active" : ""}`}
onClick={()=>{
setSelectedAddress(address._id)
calculateDelivery(address._id)
}}
>

<div className="address-select">

<input
type="radio"
checked={selectedAddress === address._id}
readOnly
/>

</div>

<div className="address-info">

<p><b>{address.fullName}</b></p>

<p>{address.phone}</p>

<p>{address.addressLine}</p>

<p>
{address.city}, {address.state} - {address.postalCode}
</p>

</div>

<div className="address-actions">

<button
className="edit-btn"
onClick={(e)=>{
e.stopPropagation()
handleEditAddress(address)
}}
>
Edit
</button>

<button
className="delete-btn"
onClick={(e)=>{
e.stopPropagation()
handleDeleteAddress(address._id)
}}
>
Delete
</button>

</div>

</div>

))}

{/* SHOW ADD ADDRESS BUTTON ONLY IF ADDRESS EXISTS */}

{addresses.length > 0 && !showAddressForm && (

<button
className="add-address-btn"
onClick={()=>setShowAddressForm(true)}
>
+ Add New Address
</button>

)}

{/* SHOW FORM WHEN CLICKING ADD ADDRESS */}

{showAddressForm && addresses.length > 0 && (

<div className="address-form">

<input
name="fullName"
placeholder="Full Name"
value={newAddress.fullName}
onChange={handleAddressChange}
/>

<input
name="phone"
placeholder="Phone Number"
value={newAddress.phone}
onChange={handleAddressChange}
/>

<input
name="addressLine"
placeholder="House / Street Address"
value={newAddress.addressLine}
onChange={handleAddressChange}
/>

<div className="form-row">

<input
name="city"
placeholder="City"
value={newAddress.city}
onChange={handleAddressChange}
/>

<input
name="postalCode"
placeholder="Postal Code"
value={newAddress.postalCode}
onChange={handleAddressChange}
/>

</div>

<input
name="state"
placeholder="State"
value={newAddress.state}
onChange={handleAddressChange}
/>

<button
className="save-address-btn"
onClick={handleSaveAddress}
>
Save Address
</button>

</div>

)}

</div>


{/* PRODUCTS */}

<div className="checkout-section">

<h2 className="section-title">Products</h2>

{cartItems.map(item => (

<div key={item.product._id} className="checkout-product">

<img src={item.product.images[0]} />

<div className="product-info">

<p className="product-name">{item.product.name}</p>

<p className="product-price">₹{item.product.price}</p>

<div className="qty-control">

<button onClick={()=>decreaseQty(item.product._id)}>
-
</button>

<span>{item.quantity}</span>

<button
onClick={()=>increaseQty(item.product._id)}
disabled={item.quantity >= item.product.stock}
>
+
</button>

</div>

<p className="product-subtotal">
Subtotal: ₹{item.product.price * item.quantity}
</p>

</div>

</div>

))}

</div>

</div>

{/* ORDER SUMMARY */}

<div className="checkout-section order-summary">

<h2 className="section-title">Order Summary</h2>

<div className="summary-item">
<span>Subtotal</span>
<span>₹{totalAmount}</span>
</div>

<div className="summary-item">
<span>Discount</span>
<span>- ₹{discount}</span>
</div>

<div className="summary-item">
<span>Delivery</span>
<span>
{deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
</span>
</div>

<hr/>

<div className="summary-item total">
<span>Total</span>
<span>₹{finalTotal}</span>
</div>


<input
className="coupon-input"
placeholder="Coupon Code"
value={couponCode}
onChange={(e)=>setCouponCode(e.target.value)}
/>

<button
className="btn btn-secondary"
onClick={applyCoupon}
>
Apply Coupon
</button>


<button
  className="place-order-btn"
  onClick={handleOrder}
  disabled={placingOrder}
>
  {placingOrder ? "Placing Order..." : "Place Order (COD)"}
</button>

</div>

</div>
)

};

export default CheckoutPage;















//-----------------------NEW----------------





// import axios from "axios";
// import { useEffect, useState } from "react";
// import { getAddresses, addAddress } from "../services/addressService";
// import { placeOrder } from "../services/orderService";
// import { useNavigate } from "react-router-dom";
// import { getCart } from "../services/cartService";
// import "../styles/checkout.css";

// function CheckoutPage() {

//   const navigate = useNavigate();

//   // ADDRESS STATES
//   const [addresses, setAddresses] = useState([]);
//   const [selectedAddress, setSelectedAddress] = useState("");

//   const [showAddressForm, setShowAddressForm] = useState(false);

//   const [newAddress, setNewAddress] = useState({
//     fullName: "",
//     phone: "",
//     addressLine: "",
//     city: "",
//     state: "",
//     postalCode: ""
//   });

//   // CART STATES
//   const [cartItems, setCartItems] = useState([]);

//   // PRICE STATES
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [discount, setDiscount] = useState(0);
//   const [finalTotal, setFinalTotal] = useState(0);

//   // COUPON
//   const [couponCode, setCouponCode] = useState("");



//   // FETCH ADDRESSES
//   const fetchAddresses = async () => {

//     try {

//       const data = await getAddresses();

//       setAddresses(data);

//     } catch {

//       alert("Error loading addresses");

//     }

//   };


//   // FETCH CART ITEMS AND TOTAL
//   const fetchCartData = async () => {

//     try {

//       const cart = await getCart();

//       setCartItems(cart.items);

//       const total = cart.items.reduce( 
//         (sum, item) =>
//           sum + item.product.price * item.quantity,
//         0
//       );

//       setTotalAmount(total);
//       setFinalTotal(total);

//     } catch {

//       alert("Error loading cart");

//     }

//   };



//   useEffect(() => {

//     fetchAddresses();
//     fetchCartData();

//   }, []);



//   // HANDLE ADDRESS INPUT CHANGE
//   const handleAddressChange = (e) => {

//     setNewAddress({
//       ...newAddress,
//       [e.target.name]: e.target.value
//     });

//   };


//   // SAVE NEW ADDRESS
//   const handleSaveAddress = async () => {

//     try {

//       await addAddress(newAddress);

//       setShowAddressForm(false);

//       setNewAddress({
//         fullName: "",
//         phone: "",
//         addressLine: "",
//         city: "",
//         state: "",
//         postalCode: ""
//       });

//       fetchAddresses();

//       alert("Address added successfully");

//     } catch {

//       alert("Error adding address");

//     }

//   };



//   // APPLY COUPON
//   const applyCoupon = async () => {

//     try {

//       const token = localStorage.getItem("token");

//       const res = await axios.get(
//         "/api/coupons",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!couponCode) {

//         alert("Enter coupon code");
//         return;

//       }

//       const coupon = res.data.find(
//         c => c.code.toLowerCase() === couponCode.toLowerCase()
//       );

//       if (!coupon) {

//         alert("Invalid coupon");
//         return;

//       }

//       const discountAmount =
//         totalAmount * (coupon.discount / 100);

//       const newTotal =
//         totalAmount - discountAmount;

//       setDiscount(discountAmount);
//       setFinalTotal(newTotal);

//       alert("Coupon applied successfully");

//     } catch {

//       alert("Error applying coupon");

//     }

//   };



//   // PLACE ORDER
//   const handleOrder = async () => {

//     if (!selectedAddress) {

//       alert("Please select address");
//       return;

//     }

//     try {

//       const order = await placeOrder({

//         addressId: selectedAddress,
//         totalAmount: finalTotal

//       });

//       navigate("/order-success", {
//         state: { order }
//       });

//     } catch {

//       alert("Order failed");

//     }

//   };



//   return (

//     <div className="checkout-container">


//       {/* LEFT SIDE */}
//       <div className="checkout-left">

//         <h2>Select Address</h2>

//         <button
//           className="btn btn-primary"
//           onClick={() =>
//             setShowAddressForm(!showAddressForm)
//           }
//         >
//           Add Address
//         </button>


//         {/* ADDRESS FORM */}
//         {showAddressForm && (

//           <div className="address-form">

//             <input
//               name="fullName"
//               placeholder="Full Name"
//               value={newAddress.fullName}
//               onChange={handleAddressChange}
//             />

//             <input
//               name="phone"
//               placeholder="Phone"
//               value={newAddress.phone}
//               onChange={handleAddressChange}
//             />

//             <input
//               name="addressLine"
//               placeholder="Address"
//               value={newAddress.addressLine}
//               onChange={handleAddressChange}
//             />

//             <input
//               name="city"
//               placeholder="City"
//               value={newAddress.city}
//               onChange={handleAddressChange}
//             />

//             <input
//               name="state"
//               placeholder="State"
//               value={newAddress.state}
//               onChange={handleAddressChange}
//             />

//             <input
//               name="postalCode"
//               placeholder="Postal Code"
//               value={newAddress.postalCode}
//               onChange={handleAddressChange}
//             />

//             <button
//               className="btn btn-secondary"
//               onClick={handleSaveAddress}
//             >
//               Save Address
//             </button>

//           </div>

//         )}



//         {/* SAVED ADDRESSES */}
//         {addresses.map(address => (

//           <div
//             key={address._id}
//             className="address-card"
//           >

//             <input
//               type="radio"
//               name="address"
//               checked={selectedAddress === address._id}
//               onChange={() =>
//                 setSelectedAddress(address._id)
//               }
//             />

//             <div>

//               <p><b>{address.fullName}</b></p>

//               <p>{address.addressLine}</p>

//               <p>{address.city}, {address.state}</p>

//               <p>{address.phone}</p>

//             </div>

//           </div>

//         ))}



//         {/* PRODUCTS */}
//         <h2>Products</h2>

//         {cartItems.map(item => (

//           <div
//             key={item.product._id}
//             className="checkout-product"
//           >

//             <img
//               src={item.product.images[0]?.url}
//               width="60"
//               alt=""
//             />

//             <div>

//               <p>{item.product.name}</p>

//               <p>Qty: {item.quantity}</p>

//               <p>₹{item.product.price}</p>

//             </div>

//           </div>

//         ))}

//       </div>



//       {/* RIGHT SIDE */}
//       <div className="checkout-right">

//         <h2>Order Summary</h2>

//         <div className="summary-item">
//           <span>Subtotal</span>
//           <span>₹{totalAmount}</span>
//         </div>

//         <div className="summary-item">
//           <span>Discount</span>
//           <span>- ₹{discount}</span>
//         </div>

//         <hr />

//         <div className="summary-item total">
//           <span>Total</span>
//           <span>₹{finalTotal}</span>
//         </div>


//         <input
//           placeholder="Coupon Code"
//           value={couponCode}
//           onChange={(e) =>
//             setCouponCode(e.target.value)
//           }
//         />


//         <button
//           className="btn btn-secondary"
//           onClick={applyCoupon}
//         >
//           Apply Coupon
//         </button>


//         <button
//           className="btn btn-primary place-order-btn"
//           onClick={handleOrder}
//         >
//           Place Order (COD)
//         </button>

//       </div>

//     </div>

//   );

// }

// export default CheckoutPage;
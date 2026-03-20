// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer
// } from "recharts";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import "../../styles/admin.css";

// function AdminDashboard() {

//   const navigate = useNavigate();

//   const [analytics, setAnalytics] = useState(null);

//   useEffect(() => {

//     fetchAnalytics();

//   }, []);

//   const fetchAnalytics = async () => {

//     const token = localStorage.getItem("token");

//     const response = await axios.get(
//       "/api/admin/analytics",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     setAnalytics(response.data);

//   };

//   if (!analytics) return <p>Loading...</p>;


//   const monthlySalesData = Object.entries(analytics.monthlySales || {}).map(
//   ([month, revenue]) => ({
//     month,
//     revenue
//   })
// );

// const orderStatusData = Object.entries(analytics.orderStatus || {}).map(
//   ([status, count]) => ({
//     name: status,
//     value: count
//   })
// );

// const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];


//   return (
//     <div className="container">

//       <h2>Admin Dashboard</h2>

//       <div className="admin-grid">

//         <div className="admin-card">
//           Users: {analytics.totalUsers}
//         </div>

//         <div className="admin-card">
//           Products: {analytics.totalProducts}
//         </div>

//         <div className="admin-card">
//           Orders: {analytics.totalOrders}
//         </div>

//         <div className="admin-card">
//           Revenue: ₹{analytics.totalRevenue}
//         </div>

//         <div className="admin-card">
//   Delivered Products: {analytics.deliveredProducts}
// </div>

// <div className="admin-card">
//   Delivered Revenue: ₹{analytics.deliveredRevenue}
// </div>

//     <h3>Monthly Sales</h3>

// <ResponsiveContainer width="100%" height={300}>
//   <LineChart data={monthlySalesData}>
//     <CartesianGrid strokeDasharray="3 3" />
//     <XAxis dataKey="month" />
//     <YAxis />
//     <Tooltip />
//     <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
//   </LineChart>
// </ResponsiveContainer>

//     <h3>Order Status</h3>

// <ResponsiveContainer width="100%" height={300}>
//   <PieChart>
//     <Pie
//       data={orderStatusData}
//       dataKey="value"
//       nameKey="name"
//       cx="50%"
//       cy="50%"
//       outerRadius={100}
//       label
//     >
//       {orderStatusData.map((entry, index) => (
//         <Cell key={index} fill={COLORS[index % COLORS.length]} />
//       ))}
//     </Pie>
//     <Tooltip />
//   </PieChart>
// </ResponsiveContainer>

//         <a href="/admin/products" className="btn btn-primary">
//   Manage Products
// </a>

//       <a href="/admin/orders" className="btn btn-primary">
//   Manage Orders
// </a>

//       <a href="/admin/coupons" className="btn btn-primary">
//   Manage Coupons
// </a>

//     <button
//   className="btn btn-primary"
//   onClick={() => navigate("/admin/reviews")}
// >
//   Manage Reviews
// </button>

//       </div>

//     </div>
//   );

// }

// export default AdminDashboard;





import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import {
  FaUsers,
  FaBox,
  FaShoppingCart,
  FaRupeeSign,
  FaTruck
} from "react-icons/fa";

import "../../styles/Dashboard.css";

function AdminDashboard() {

  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {

    const token = localStorage.getItem("token");

    const res = await axios.get(
      "/api/admin/analytics",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setAnalytics(res.data);
  };

  if (!analytics) return <p>Loading...</p>;

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const monthlyData = months.map(month => ({
    month,
    revenue: analytics.monthlySales?.[month] || 0
  }));

  const dailyData = analytics.dailySales || [];

  const orderStatusData = Object.entries(analytics.orderStatus || {})
  .map(([status,count]) => ({
    name: status,
    value: count
  }));

  const COLORS = ["#FF6B6B","#4ECDC4","#FFD93D","#6C5CE7","#00B894"];

  return (

    <div className="admin-page">

      <div className="admin-wrapper">

        {/* MANAGE PANEL */}

        <div className="manage-panel">

          <h3 className="manage-title">Manage</h3>

          <div className="manage-buttons">

            <button onClick={()=>navigate("/admin/products")}>
              Products
            </button>

            <button onClick={()=>navigate("/admin/orders")}>
              Orders
            </button>

            <button onClick={()=>navigate("/admin/coupons")}>
              Coupons
            </button>

            <button onClick={()=>navigate("/admin/reviews")}>
              Reviews
            </button>

          </div>

        </div>


        {/* DASHBOARD TITLE */}

        <h2 className="dashboard-title">
          Admin Dashboard
        </h2>


        {/* STATS */}   

        <div className="stats-grid">

<div className="stat-card">
<div className="stat-icon"><FaUsers/></div>

<div className="stat-info">
<span className="stat-title">Users</span>
<span className="stat-value">{analytics.totalUsers}</span>
</div>

</div>

<div className="stat-card">
<div className="stat-icon"><FaBox/></div>

<div className="stat-info">
<span className="stat-title">Products</span>
<span className="stat-value">{analytics.totalProducts}</span>
</div>

</div>

<div className="stat-card">
<div className="stat-icon"><FaShoppingCart/></div>

<div className="stat-info">
<span className="stat-title">Orders</span>
<span className="stat-value">{analytics.totalOrders}</span>
</div>

</div>

<div className="stat-card">
<div className="stat-icon"><FaTruck/></div>

<div className="stat-info">
<span className="stat-title">Delivered</span>
<span className="stat-value">{analytics.deliveredProducts}</span>
</div>

</div>

<div className="stat-card revenue-card">
<div className="stat-icon"><FaRupeeSign/></div>

<div className="stat-info">
<span className="stat-title">Revenue</span>
<span className="stat-value">₹{analytics.totalRevenue}</span>
</div>

</div>

</div>


        {/* MONTHLY REVENUE */}

        <div className="chart-card">

          <h3>Monthly Revenue</h3>

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={monthlyData}>

              <CartesianGrid strokeDasharray="3 3"/>

              <XAxis dataKey="month"/>

              <YAxis/>

              <Tooltip/>

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B6B"
                fill="#FF6B6B33"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>


        {/* ORDER STATUS */}

        <div className="chart-card">

          <h3>Order Status</h3>

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={orderStatusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >

                {orderStatusData.map((entry,index)=>(
                  <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                ))}

              </Pie>

              <Tooltip/>

            </PieChart>

          </ResponsiveContainer>

        </div>


        {/* DAILY SALES */}

        <div className="chart-card">

          <h3>Daily Sales</h3>

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={dailyData}>

              <CartesianGrid strokeDasharray="3 3"/>

              <XAxis dataKey="day"/>

              <YAxis/>

              <Tooltip/>

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4ECDC4"
              />

            </LineChart>

          </ResponsiveContainer>

        </div>


        {/* LOW STOCK */}

        <div className="chart-card">

          <h3>Low Stock Alert</h3>

          {analytics.lowStockProducts?.length === 0 ? (

            <p>No products are low in stock</p>

          ) : (

            <div className="low-stock-list">

              {analytics.lowStockProducts.map((product,index)=>(

                <div key={index} className="low-stock-item">

                  <span>{product.name}</span>

                  <span className="stock-warning">
                    Stock: {product.stock}
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

export default AdminDashboard;
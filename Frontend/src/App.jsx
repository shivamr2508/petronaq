import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; //
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import MainLayout from "./layouts/MainLayout";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrderPage";
import WishlistPage from "./pages/WishlistPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminEditProduct from "./pages/admin/AdminEditProduct";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AddAddressPage from "./pages/AddAddressPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ReviewPage from "./pages/ReviewPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AccountPage from "./pages/AccountPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import ReturnPolicyPage from "./pages/ReturnPolicyPage";


function App() {
  return (
    <MainLayout>

         <Toaster
  position="top-center"
  containerStyle={{ top: "80px" }}
  toastOptions={{
    style: {
      borderRadius: "12px",
      background: "#1f2937",
      color: "#fff",
    },
    success: {
      style: { background: "#2c3b36" },
    },
    error: {
      style: { background: "#7d0c00" },
    },
  }}
/>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />  
        <Route path="/cart" element={<CartPage />} /> 
        <Route path="/account" element={<AccountPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/add-product" element={<AdminAddProduct />} />
        <Route path="/admin/edit-product/:id" element={<AdminEditProduct />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/add-address" element={<AddAddressPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/review/:productId/:orderId" element={<ReviewPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />}/>
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
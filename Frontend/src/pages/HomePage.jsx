import ProductGrid from "../components/ProductsGrid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { Helmet } from "react-helmet-async";

function HomePage() {
  const navigate = useNavigate();

  const [showPets, setShowPets] = useState(false);
  const [showPetsTitle, setShowPetsTitle] = useState(false);
  const [showProductsTitle, setShowProductsTitle] = useState(false);

  useEffect(() => {
    const heroTimer = setTimeout(() => {
      setShowPets(true);
    }, 2200);

    const titleTimer = setTimeout(() => {
      setShowPetsTitle(true);
    }, 2600); // slightly after hero finishes

    return () => {
      clearTimeout(heroTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("products-section");

      if (section) {
        const position = section.getBoundingClientRect().top;

        if (position < window.innerHeight - 100) {
          setShowProductsTitle(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
  <>
    <Helmet>
      <title>PetRonaq - Buy Dog Food, Cat Food & Pet Supplies Online</title>

      <meta
        name="description"
        content="Buy premium dog food, cat food, treats, toys and pet accessories online at PetRonaq."
      />

      <meta
        name="keywords"
        content="dog food, cat food, pet shop, pet supplies, pet accessories, PetRonaq"
      />
    </Helmet>

    <div className="home">
      {/* HERO */}

      <section className={`hero ${showPets ? "hero-moved" : ""}`}>
        {showPets && <img src="/Pets55.png" alt="pets" className="hero-pets" />}

        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-line line1"> All Your Pet Needs </span>
            <span className="title-line line2"> in One Place </span>
          </h1>
          <p className="hero-sub"> Everything your furry friends love 🐾 </p>
          <button className="shop-btn" onClick={() => navigate("/products")}>
            {" "}
            Shop Now{" "}
          </button>
        </div>
      </section>

      {/*  Hero for desktop version  */}

      <div className="hero-desktop">

    {/* LEFT CONTENT */}
    <div className="hero-left">
      <h1>
        All Your Pet Needs <br /> in One Place
      </h1>

      <p>Everything your furry friends love 🐾</p>

      <button className="shop-btn" onClick={() => navigate("/products")}>
        Shop Now
      </button>
    </div>

    {/* CENTER PET IMAGE */}
    {/* <img src="/Pet00.png" alt="pets" className="hero-pets-desktop" /> */}
     {showPets && (
  <>
    <img src="/Pet00.png" alt="pets" className="hero-pets-desktop" />

    {/* DOG CHAT */}
    <div className="chat dog-chat">
      Hey! Want some treats? 🐶
    </div>

    {/* CAT CHAT */}
    <div className="chat cat-chat">
      Only if it's premium 😼
    </div>
  </>
)}

    {/* RIGHT PRODUCT IMAGE */}
    <img src="/Product.png" alt="product" className="hero-product" />

   

  </div>

  {/* --------------------------------------------- */}

      {/* CATEGORY  */}

      <section className={`categories ${showPets ? "categories-moved" : ""}`}>
        <h2
          className={`section-title pets-title ${showPetsTitle ? "title-animate" : ""}`}
        >
          Shop by Pets{" "}
        </h2>
        <div className="category-scroll">
          <div
            className="category-card dog"
            onClick={() => navigate("/products?petType=Dog")}
          >
            <div className="category-icon">🐶</div>
            <div className="category-text">
              <h3>Dog</h3>
              <p>Explore all products for dogs</p>
            </div>
          </div>
          <div
            className="category-card cat"
            onClick={() => navigate("/products?petType=Cat")}
          >
            <div className="category-icon">🐱</div>
            <div className="category-text">
              <h3>Cat</h3>
              <p>Explore all products for cats</p>
            </div>
          </div>
          <div
            className="category-card fish"
            onClick={() => navigate("/products?petType=Fish")}
          >
            <div className="category-icon">🐟</div>
            <div className="category-text">
              <h3>Fish</h3>
              <p>Explore all products for fish</p>
            </div>
          </div>
          <div
            className="category-card bird"
            onClick={() => navigate("/products?petType=Bird")}
          >
            <div className="category-icon">🐦</div>
            <div className="category-text">
              <h3>Bird</h3>
              <p>Explore all products for birds</p>
            </div>
          </div>
        </div>

        <section className="promo-banner">
          <h3>Healthy Pets, Happy Life🐾</h3>
          <p>Premium food and accessories for your pets</p>
          <button onClick={() => navigate("/products")}> Explore Now </button>
        </section>
      </section>

      {/* PRODUCTS */}

      <section id="products-section" className="products">
        <h2
          className={`section-title products-title ${showProductsTitle ? "title-animate" : ""}`}
        >
          Best Selling Products{" "}
        </h2>
        <ProductGrid />
      </section>

      {/* 
<section className="why"> 
<h2 className="section-title"> Why PetShop🐾 </h2>
 <div className="why-grid"> 
<div className="why-card"> 🐶 <p>Quality Pet Food</p> 
</div>
 <div className="why-card"> 🚚 <p>Fast Delivery</p> 
</div> 
<div className="why-card"> 💖 <p>Trusted by Pet Owners</p> 
</div> 
</div>
 </section> 
     {/* comments */}
    </div>
  </>
);
}



export default HomePage;

import { Link } from "react-router-dom";
import "../styles/footer.css";

function Footer() {

  return (
    <footer className="footer">

      <div className="container">

        <div className="footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/shipping-policy">Shipping Policy</Link>
          <Link to="/return-policy">Return Policy</Link>
        </div>

        <p>
          © 2026 PetRonaq. All rights reserved.
        </p>

      </div>

    </footer>
  );

}

export default Footer;
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";

import { showSuccess, showError } from "../utils/toast";

function AddAddressPage() {

  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const token = localStorage.getItem("token");

    const addressData = {

      fullName: fullName,
      phone: phone,
      addressLine: addressLine,
      city: city,
      state: state,
      postalCode: postalCode

    };

    console.log("Sending address:", addressData);

    await axios.post(
      "http://localhost:5000/api/address",
      addressData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

     showSuccess("Address saved");

  } catch (error) {

    console.error(error);

    showError("Error saving address");

  }

};

  return (
    <div className="container">

      <h2>Add Address</h2>

      <form onSubmit={handleSubmit} className="admin-form">

        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <input
          placeholder="Address Line"
          value={addressLine}
          onChange={(e) =>
            setAddressLine(e.target.value)
          }
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) =>
            setCity(e.target.value)
          }
        />

        <input
          placeholder="State"
          value={state}
          onChange={(e) =>
            setState(e.target.value)
          }
        />

        <input
          placeholder="Postal Code"
          value={postalCode}
          onChange={(e) =>
            setPostalCode(e.target.value)
          }
        />

        <button className="btn btn-primary">
          Save Address
        </button>

      </form>

    </div>
  );

}

export default AddAddressPage;
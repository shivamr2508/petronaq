import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicPetProfile } from "../services/petService";
import { FaPhone, FaWhatsapp, FaExclamationTriangle, FaCheckCircle, FaPaw, FaMapMarkerAlt } from "react-icons/fa";
import "../styles/publicProfile.css";

const PublicPetProfilePage = () => {
  const { token } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const res = await getPublicPetProfile(token);
        if (res.success) {
          setPet(res.data);
        } else {
          setError(res.message || "Sorry, we couldn't find this Pet ID.");
        }
      } catch (err) {
        setError("Sorry, we couldn't find this Pet ID or there was a network error.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchPet();
  }, [token]);

  if (loading) {
    return (
      <div className="public-profile-center">
        <div className="skeleton-loader">
          <div className="skeleton-circle"></div>
          <div className="skeleton-line" style={{ width: "50%", height: "32px" }}></div>
          <div className="skeleton-line" style={{ width: "33%", height: "16px" }}></div>
          <div className="skeleton-btn"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-center">
        <div className="error-card">
          <FaExclamationTriangle className="error-icon" />
          <h2>Oops!</h2>
          <p>{error}</p>
          <Link to="/" className="btn-home">
            Go to PetRonaq Home
          </Link>
        </div>
      </div>
    );
  }

  if (pet?.status === "unactivated") {
    return (
      <div className="public-profile-center">
        <div className="error-card">
          <FaPaw className="unactivated-icon" />
          <h2>Unactivated Pet ID</h2>
          <p>This PetRonaq ID has not been activated yet.</p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>If you are the owner, please log in to your account to activate this tag.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-container">
      {/* Header / Banner */}
      <div className="public-profile-header">
        <h1>
          <FaPaw /> PetRonaq Pet ID
        </h1>
        <p>{pet.petId}</p>
      </div>

      {/* Main Content Area */}
      <div className="public-profile-content">
        
        {/* Status Alert */}
        {pet.status === "LOST" && (
          <div className="status-alert lost">
            <FaExclamationTriangle /> THIS PET IS REPORTED LOST
          </div>
        )}
        {pet.status === "FOUND" && (
          <div className="status-alert found">
            <FaCheckCircle /> This pet has been marked as found
          </div>
        )}

        {/* Pet Card */}
        <div className="pet-card">
          {/* Photo */}
          <div className="pet-photo-container">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.petName} className="pet-photo" />
            ) : (
              <div className="pet-photo-placeholder">
                <FaPaw />
                <span>No Photo Available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="pet-details">
            <h2>{pet.petName || "Unknown Pet"}</h2>
            <p className="pet-breed">
              {pet.breed || "Unknown Breed"} {pet.species && `• ${pet.species}`}
            </p>

            {(pet.ownerName || pet.fullAddress) && (
              <div className="pet-owner-info">
                {pet.ownerName && (
                  <p><strong>Owner Name</strong> {pet.ownerName}</p>
                )}
                {pet.fullAddress && (
                  <div className="address-row">
                    <FaMapMarkerAlt />
                    <p><strong>Address</strong> {pet.fullAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {pet.contacts && pet.contacts.length > 0 ? (
            pet.contacts.map((contact, idx) => (
              <div key={idx} className="contact-row">
                <a 
                  href={`tel:${contact.phone}`} 
                  className={`btn ${idx === 0 ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <FaPhone /> Call {contact.name || "Owner"} {idx === 0 ? "(Primary)" : ""}
                </a>
              </div>
            ))
          ) : (
            <div className="no-contact">
              No contact information available.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default PublicPetProfilePage;

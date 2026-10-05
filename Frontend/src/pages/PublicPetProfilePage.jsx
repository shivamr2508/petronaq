import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicPetProfile } from "../services/petService";
import { FaMapMarkerAlt, FaUser, FaPaw, FaHeart, FaPhoneAlt, FaExclamationTriangle } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
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
      <div className="public-profile-container">
        <div className="public-profile-wrapper loading-wrapper">
          <div className="skeleton-loader">
            <div className="skeleton-circle"></div>
            <div className="skeleton-line" style={{ width: "50%", height: "32px" }}></div>
            <div className="skeleton-line" style={{ width: "33%", height: "16px" }}></div>
            <div className="skeleton-btn"></div>
            <div className="skeleton-btn"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-container">
        <div className="public-profile-wrapper error-wrapper">
          <div className="error-card">
            <FaExclamationTriangle className="error-icon" />
            <h2>Oops!</h2>
            <p>{error}</p>
            <Link to="/" className="btn-home">
              Go to PetRonaq Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pet?.status === "unactivated") {
    return (
      <div className="public-profile-container">
        <div className="public-profile-wrapper error-wrapper">
          <div className="error-card">
            <FaPaw className="unactivated-icon" />
            <h2>Unactivated Pet ID</h2>
            <p>This PetRonaq ID has not been activated yet.</p>
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>If you are the owner, please log in to your account to activate this tag.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-profile-container">
      <div className="public-profile-wrapper">
        
        {/* Header */}
        <div className="profile-header">
          <FaPaw className="header-icon" />
          <div className="header-text">
            <h1>PetRonaq</h1>
            <p>Pet Profile</p>
          </div>
        </div>

        {/* Photo */}
        <div className="profile-photo-container">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.petName} className="profile-photo" />
          ) : (
            <div className="profile-photo-placeholder">
              <FaPaw />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="profile-content">
          
          {/* Pet Title & Badge */}
          <div className="pet-title-section">
            <div className="pet-title-left">
              <h1 className="pet-name">
                {pet.petName || "Unknown"} <MdVerified className="verified-badge" />
              </h1>
              <p className="pet-breed">{pet.breed || "Unknown Breed"}</p>
            </div>
            <div className="pet-title-right">
              <div className="safety-accent">
                <FaHeart className="heart-icon" />
                <div className="accent-text">
                  <span>Love</span>
                  <span>Care</span>
                  <span>Always Safe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Card */}
          {pet.ownerName && (
            <div className="info-card">
              <div className="info-icon-wrapper">
                <FaUser className="info-icon" />
              </div>
              <div className="info-text">
                <span className="info-label">Owner Name</span>
                <span className="info-value">{pet.ownerName}</span>
              </div>
            </div>
          )}

          {/* Contacts Section */}
          {pet.contacts && pet.contacts.length > 0 && (
            <div className="contacts-section">
              {pet.contacts.map((contact, idx) => {
                if (idx === 0) {
                  return (
                    <div key={idx} className="primary-contact-card">
                      <div className="contact-info-row">
                        <div className="info-icon-wrapper primary-icon-wrapper">
                          <FaPhoneAlt className="primary-info-icon" />
                        </div>
                        <div className="info-text">
                          <span className="info-label">Primary Phone</span>
                          <span className="info-value">{contact.phone}</span>
                        </div>
                        <div className="primary-badge">Primary</div>
                      </div>
                      <a href={`tel:${contact.phone}`} className="btn-call-primary">
                        <FaPhoneAlt /> Call Owner
                      </a>
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="info-card secondary-contact-card">
                      <div className="secondary-contact-left">
                        <div className="info-icon-wrapper">
                          <FaPhoneAlt className="info-icon" />
                        </div>
                        <div className="info-text">
                          <span className="info-label">Phone {idx + 1} (Optional)</span>
                          <span className="info-value">{contact.phone}</span>
                        </div>
                      </div>
                      <a href={`tel:${contact.phone}`} className="btn-call-secondary">
                        <FaPhoneAlt /> Call
                      </a>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Address */}
          {pet.fullAddress && (
            <div className="info-card address-card">
              <div className="info-icon-wrapper address-icon-wrapper">
                <FaMapMarkerAlt className="address-info-icon" />
              </div>
              <div className="info-text">
                <span className="info-label">Address</span>
                <span className="info-value address-value">{pet.fullAddress}</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="profile-footer">
          <div className="footer-graphic">
            <h2>Every Pet</h2>
            <p>Deserves to be Home <FaHeart className="footer-heart" /></p>
          </div>
          <div className="footer-brand">
            <h3>PetRonaq</h3>
            <p>Keep Pets Safe &bull; Connected &bull; Always Loved</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicPetProfilePage;

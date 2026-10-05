import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styles/petActivation.css";
import { FiEye, FiEyeOff, FiUploadCloud, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";

function PetActivationPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [petId, setPetId] = useState("");
  const [activationPin, setActivationPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  
  // Success state
  const [publicToken, setPublicToken] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("Please login to activate a PetRonaq ID");
      navigate("/login?redirect=/activate-pet");
    }
  }, [token, navigate]);

  const handleNextStep = () => {
    if (!petId.trim() || !/^PRN-\d+$/.test(petId.trim().toUpperCase())) {
      toast.error("Invalid PetRonaq ID format (e.g., PRN-000001)");
      return;
    }
    if (!/^\d{6}$/.test(activationPin)) {
      toast.error("Activation PIN must be exactly 6 digits");
      return;
    }
    setPetId(petId.trim().toUpperCase());
    setStep(2);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Unsupported file type. Only JPG, PNG, and WEBP are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5 MB.");
        return;
      }
      setPhotoFile(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!petName.trim() || !breed.trim() || !ownerName.trim() || !primaryPhone.trim() || !fullAddress.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setLoading(true);
    let uploadedPhotoUrl = "";

    try {
      if (photoFile) {
        const formData = new FormData();
        formData.append("image", photoFile);

        const uploadRes = await axios.post(`${API_BASE}/api/upload/pet`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        uploadedPhotoUrl = uploadRes.data.url;
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to upload photo. Please try again or skip photo.");
      return; // Stop if photo upload fails, allow retry
    }

    try {
      const res = await axios.post(`${API_BASE}/api/pets/activate`, {
        petId: petId,
        activationPin: activationPin,
        petName: petName.trim(),
        breed: breed.trim(),
        photo: uploadedPhotoUrl,
        ownerName: ownerName.trim(),
        primaryPhone: primaryPhone.trim(),
        phone2: phone2.trim(),
        phone3: phone3.trim(),
        fullAddress: fullAddress.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setPublicToken(res.data.data.publicToken);
        setStep(3);
        toast.success("PetRonaq ID Activated Successfully");
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Activation failed. Please check your Pet ID and PIN.");
      
      // If it's a brute force or PIN error, take them back to step 1
      if (error.response?.data?.message?.includes("PIN") || error.response?.data?.message?.includes("attempts")) {
        setStep(1);
      }
    }
  };

  if (!token) return null;

  return (
    <div className="activation-page">
      <div className="activation-header">
        <h1>Activate PetRonaq ID</h1>
        <p>Register your pet's smart tag to keep them safe.</p>
      </div>

      <div className="activation-card">
        {step === 1 && (
          <div className="step-1">
            <div className="form-group">
              <label>PetRonaq ID <span className="required">*</span></label>
              <input
                type="text"
                className="activation-input"
                placeholder="e.g. PRN-000001"
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Activation PIN <span className="required">*</span></label>
              <div className="pin-input-container">
                <input
                  type={showPin ? "text" : "password"}
                  className="activation-input"
                  placeholder="6-digit PIN"
                  value={activationPin}
                  onChange={(e) => setActivationPin(e.target.value)}
                  maxLength={6}
                />
                <button 
                  type="button" 
                  className="toggle-pin" 
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              className="primary-btn" 
              onClick={handleNextStep}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="step-2">
            <div className="form-group">
              <label>Pet Photo (Optional)</label>
              <label className="photo-upload-container">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Pet Preview" className="photo-preview" />
                ) : (
                  <>
                    <FiUploadCloud className="upload-icon" />
                    <span>Click to upload a photo of your pet</span>
                    <small style={{color: '#6b7280'}}>JPG, PNG, WEBP up to 5MB</small>
                  </>
                )}
              </label>
            </div>

            <div className="form-group">
              <label>Pet Name <span className="required">*</span></label>
              <input
                type="text"
                className="activation-input"
                placeholder="Pet's Name"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Breed <span className="required">*</span></label>
              <input
                type="text"
                className="activation-input"
                placeholder="e.g. Golden Retriever"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Owner Name <span className="required">*</span></label>
              <input
                type="text"
                className="activation-input"
                placeholder="Your Full Name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Primary Phone <span className="required">*</span></label>
              <input
                type="tel"
                className="activation-input"
                placeholder="10-digit mobile number"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone 2 (Optional)</label>
              <input
                type="tel"
                className="activation-input"
                placeholder="Alternative number"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone 3 (Optional)</label>
              <input
                type="tel"
                className="activation-input"
                placeholder="Emergency number"
                value={phone3}
                onChange={(e) => setPhone3(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Full Address <span className="required">*</span></label>
              <textarea
                className="activation-input"
                placeholder="House No., Street, City, State, PIN Code"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                rows={3}
                required
              />
            </div>

            <button 
              type="submit" 
              className="primary-btn"
              disabled={loading}
            >
              {loading ? <div className="loading-spinner"></div> : "Save & Activate"}
            </button>
            <button 
              type="button" 
              className="primary-btn secondary-btn"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="success-state">
            <FiCheckCircle className="success-icon" />
            <h2>PetRonaq ID Activated Successfully</h2>
            <p>Your pet's profile is now securely linked to you.</p>
            
            <div className="pet-summary">
              <p><strong>Pet Name:</strong> {petName}</p>
              <p><strong>PetRonaq ID:</strong> {petId}</p>
            </div>

            <button 
              className="primary-btn"
              onClick={() => navigate(`/p/${publicToken}`)}
            >
              View Pet Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PetActivationPage;

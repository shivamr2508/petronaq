import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";
import "../../styles/adminPets.css";

function AdminPets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        `${API_BASE}/api/pets/admin/generate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.message || "Failed to generate Pet ID");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred while generating the Pet ID");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.qrCode) return;
    
    const link = document.createElement("a");
    link.href = result.qrCode;
    link.download = `${result.petId}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-pets-page">
      <div className="admin-pets-container">
        <div className="admin-pets-header">
          <h2>PetRonaq Pet IDs</h2>
          <p>Generate new PetRonaq IDs and download their unique QR codes.</p>
        </div>

        <div className="admin-pets-actions">
          <button 
            className="btn-generate-pet" 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate New Pet ID"}
          </button>
        </div>

        {error && (
          <div className="admin-pets-error">
            {error}
          </div>
        )}

        {result && (
          <div className="admin-pets-result">
            <h3>Successfully Generated!</h3>
            
            <div className="result-grid">
              <div className="result-info">
                <div className="info-group">
                  <label>Pet ID</label>
                  <div className="info-value">{result.petId}</div>
                </div>

                <div className="info-group pin-warning-group">
                  <label>Activation PIN</label>
                  <div className="info-value pin-value">{result.activationPin}</div>
                  <p className="pin-warning">
                    <strong>⚠️ WARNING:</strong> Save this PIN securely. It will not be shown again!
                  </p>
                </div>
              </div>

              <div className="result-qr">
                <label>QR Code</label>
                <div className="qr-container">
                  {result.qrCode ? (
                    <img src={result.qrCode} alt="Generated QR Code" />
                  ) : (
                    <div className="no-qr">No QR Code returned</div>
                  )}
                </div>
                <button 
                  className="btn-download-qr" 
                  onClick={handleDownload}
                  disabled={!result.qrCode}
                >
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPets;

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicPetProfile } from "../services/petService";
import { FaPhone, FaWhatsapp, FaExclamationTriangle, FaCheckCircle, FaPaw, FaMapMarkerAlt } from "react-icons/fa";

const PublicPetProfilePage = () => {
  const { token } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFoundModal, setShowFoundModal] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center w-full max-w-md">
          <div className="rounded-full bg-gray-300 h-40 w-40 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-gray-300 rounded-lg w-full mb-4"></div>
          <div className="h-12 bg-gray-300 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="inline-block bg-[#1f2937] text-white px-6 py-3 rounded-lg font-medium">
            Go to PetRonaq Home
          </Link>
        </div>
      </div>
    );
  }

  if (pet?.status === "unactivated") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mt-10 text-center">
          <FaPaw className="text-[#1f2937] text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unactivated Pet ID</h2>
          <p className="text-gray-600 mb-6">This PetRonaq ID has not been activated yet.</p>
          <p className="text-sm text-gray-500">If you are the owner, please log in to your account to activate this tag.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Banner */}
      <div className="bg-[#1f2937] text-white text-center py-4 px-4 shadow-md rounded-b-3xl">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <FaPaw /> PetRonaq Pet ID
        </h1>
        <p className="text-xs text-gray-300 mt-1 uppercase tracking-wider">{pet.petId}</p>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 -mt-4 relative z-10">
        
        {/* Status Alert */}
        {pet.status === "LOST" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <FaExclamationTriangle /> THIS PET IS REPORTED LOST
          </div>
        )}
        {pet.status === "FOUND" && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm">
            <FaCheckCircle /> This pet has been marked as found
          </div>
        )}

        {/* Pet Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Photo */}
          <div className="w-full h-72 bg-gray-200 flex items-center justify-center overflow-hidden">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.petName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center">
                <FaPaw className="text-6xl mb-2 opacity-50" />
                <span className="text-sm font-medium">No Photo Available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{pet.petName || "Unknown Pet"}</h2>
            <p className="text-gray-500 font-medium mb-4">
              {pet.breed || "Unknown Breed"} {pet.species && `• ${pet.species}`}
            </p>

            {(pet.ownerName || pet.fullAddress) && (
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 mb-6 border border-gray-100 shadow-inner">
                {pet.ownerName && (
                  <p className="mb-2"><strong className="text-gray-900 block text-xs uppercase tracking-wide">Owner Name</strong> {pet.ownerName}</p>
                )}
                {pet.fullAddress && (
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                    <p><strong className="text-gray-900 block text-xs uppercase tracking-wide">Address</strong> {pet.fullAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-10">
          
          {pet.contacts && pet.contacts.length > 0 ? (
            pet.contacts.map((contact, idx) => (
              <div key={idx} className="flex gap-2">
                <a 
                  href={`tel:${contact.phone}`} 
                  className={`flex-1 text-white py-4 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors ${idx === 0 ? 'bg-red-600 hover:bg-red-700 text-lg' : 'bg-[#1f2937] hover:bg-gray-800'}`}
                >
                  <FaPhone /> Call {contact.name || "Owner"} {idx === 0 ? "(Primary)" : ""}
                </a>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm bg-gray-200 p-4 rounded-xl">
              No contact information available.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default PublicPetProfilePage;

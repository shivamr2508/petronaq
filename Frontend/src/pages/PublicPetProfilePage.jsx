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

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Gender</span>
                <span className="font-semibold text-gray-800">{pet.gender || "-"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Age</span>
                <span className="font-semibold text-gray-800">{pet.age || "-"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Color</span>
                <span className="font-semibold text-gray-800">{pet.color || "-"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Marks</span>
                <span className="font-semibold text-gray-800 line-clamp-1">{pet.identificationMarks || "-"}</span>
              </div>
            </div>

            {(pet.city || pet.area) && (
              <div className="flex items-start gap-2 text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-xl">
                <FaMapMarkerAlt className="text-red-500 mt-0.5" />
                <span>
                  {pet.area && `${pet.area}, `}{pet.city}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          
          {pet.contacts && pet.contacts.length > 0 ? (
            pet.contacts.map((contact, idx) => (
              <div key={idx} className="flex gap-2">
                <a 
                  href={`tel:${contact.phone}`} 
                  className="flex-1 bg-[#1f2937] text-white py-4 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-colors"
                >
                  <FaPhone /> Call {contact.name || "Owner"}
                </a>
                {contact.whatsapp && (
                  <a 
                    href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                  >
                    <FaWhatsapp className="text-xl" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm bg-gray-200 p-4 rounded-xl">
              No public contact information available.
            </div>
          )}

          <button 
            onClick={() => setShowFoundModal(true)}
            className="w-full bg-white border-2 border-[#1f2937] text-[#1f2937] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FaPaw /> I Found This Pet
          </button>
        </div>

      </div>

      {/* Temporary Found Modal */}
      {showFoundModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              <FaCheckCircle />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Found Pet reporting will be available soon. Please use the contact buttons to reach the owner directly for now.
            </p>
            <button 
              onClick={() => setShowFoundModal(false)}
              className="w-full bg-[#1f2937] text-white py-3 rounded-xl font-bold shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicPetProfilePage;

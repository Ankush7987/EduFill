// src/BookingForm.jsx
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "./firebase"; 
import { CheckCircle, X } from 'lucide-react'; // Icons ke liye

export default function BookingForm() {
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  
  const [formData, setFormData] = useState({
    studentName: '',
    phone: '',
    examType: 'NEET UG', 
    institute: 'Ribosome' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 6-digit unique token generate karne ka function
  const generateToken = () => {
    return "EDU-" + Math.floor(100000 + Math.random() * 900000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let collectionName = "Other_Students"; 
      if (formData.institute === "Ribosome") {
        collectionName = "Ribosome_Students";
      } else if (formData.institute === "Unacademy") {
        collectionName = "Unacademy_Students";
      }

      // Naya token banaya
      const newToken = generateToken();

      // Firestore mein data aur token dono save karna
      await addDoc(collection(db, collectionName), {
        studentName: formData.studentName,
        phone: formData.phone,
        examType: formData.examType,
        institute: formData.institute,
        tokenNumber: newToken, // Token database mein gaya
        timestamp: serverTimestamp() 
      });

      // State update ki popup dikhane ke liye
      setGeneratedToken(newToken);
      setShowPopup(true);
      
      // Form khali kar diya
      setFormData({ studentName: '', phone: '', examType: 'NEET UG', institute: 'Ribosome' });

    } catch (error) {
      console.error("Error saving document: ", error);
      alert("System error! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setGeneratedToken('');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border rounded-2xl shadow-xl relative">
      <h2 className="text-2xl font-bold mb-6 text-center text-eduBlue">Book Your Slot</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Student Name</label>
          <input 
            type="text" name="studentName" value={formData.studentName} onChange={handleChange} 
            required className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-eduBlue bg-gray-50"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">WhatsApp Number</label>
          <input 
            type="tel" name="phone" value={formData.phone} onChange={handleChange} 
            required className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-eduBlue bg-gray-50"
            placeholder="9752519051"
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit number"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Select Exam</label>
          <select 
            name="examType" value={formData.examType} onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-eduBlue bg-gray-50"
          >
            <option value="NEET UG">NEET UG</option>
            <option value="JEE">JEE (Main & Adv)</option>
            <option value="CUET">CUET</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Student Category</label>
          <select 
            name="institute" value={formData.institute} onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-eduBlue bg-gray-50"
          >
            <option value="Ribosome">Ribosome Institute Student</option>
            <option value="Unacademy">Unacademy Camp Student</option>
            <option value="Other">Other / Direct Student</option>
          </select>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-eduBlue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition shadow-md"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </form>

      {/* SUCCESS POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-fade-in-up">
            <button onClick={closePopup} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            
            <div className="flex justify-center mb-4">
              <CheckCircle size={64} className="text-eduGreen" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Slot Booked!</h3>
            <p className="text-gray-600 mb-6">Aapka form filling slot successfully book ho gaya hai. Please take a screenshot.</p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Your Unique Token No.</p>
              <p className="text-3xl font-extrabold text-eduBlue tracking-wider">{generatedToken}</p>
            </div>
            
            <button 
              onClick={closePopup}
              className="w-full bg-eduGreen text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
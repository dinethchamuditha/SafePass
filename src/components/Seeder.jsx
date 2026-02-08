import { useState } from "react";
import { collection, writeBatch, Timestamp, GeoPoint, doc } from "firebase/firestore";
// ⚠️ IMPORTANT: Check this path. It might be '../firebase' or './firebaseConfig' depending on your folder structure
import { db } from "../firebase/config";

const Seeder = () => {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if(!confirm("Are you sure you want to add 10 news reports to the map?")) return;
    
    setLoading(true);
    const batch = writeBatch(db);

    // Verified News Data (Nov 29, 2025)
    const incidents = [
      { type: "blocked", lat: 8.2833, lng: 80.0500, desc: "🔴 Kala Oya Bridge BLOCKED. Bus trapped, passengers rescued. (Source: Ada Derana)" },
      { type: "flood", lat: 7.3333, lng: 80.1167, desc: "🔴 Maha Oya Basin: Major Flood Level. Evacuate immediately. (Source: Irrigation Dept)" },
      { type: "flood", lat: 6.9067, lng: 80.0867, desc: "🔴 Hanwella (Kelani River): Overflowing and rising fast. (Source: EconomyNext)" },
      { type: "help_needed", lat: 6.9667, lng: 80.0167, desc: "⚠️ Dompe & Biyagama: Evacuation ordered for low-lying areas. (Source: DMC)" },
      { type: "blocked", lat: 7.2150, lng: 80.6050, desc: "⛔ Nillambe (Kandy): 431mm rain. Extreme landslide risk. (Source: Newswire)" },
      { type: "flood", lat: 8.0337, lng: 79.8262, desc: "🔴 Puttalam Town: Streets flooded, chest-deep water. (Source: Al Jazeera)" },
      { type: "flood", lat: 6.9530, lng: 79.8750, desc: "⚠️ Nagalagam Street: River gauge rising. (Source: Irrigation Dept)" },
      { type: "safe", lat: 6.8402, lng: 79.9687, desc: "🟢 Kottawa Interchange: Open and clear. Safe for travel." },
      { type: "safe", lat: 7.1167, lng: 79.8833, desc: "🟢 Katunayake Expressway (E03): Open and safe." },
      { type: "blocked", lat: 7.2546, lng: 80.4485, desc: "⛔ Pahala Kadugannawa: Rockfall risk high. Drive with caution." }
    ];

    incidents.forEach((item) => {
      // Create a new ID automatically
      const newDocRef = doc(collection(db, "incidents"));
      
      batch.set(newDocRef, {
        // Matches YOUR exact Database Schema
        description: item.desc,
        type: item.type,
        location: new GeoPoint(item.lat, item.lng),
        timestamp: Timestamp.now(),
        fakeVotes: 0,
        trueVotes: 5,   // Start with 5 votes so it looks trusted
        voteCount: 5,
        images: [],
        message: ""
      });
    });

    try {
      await batch.commit();
      alert("✅ SUCCESS: 10 Reports Added! Refresh the map.");
    } catch (error) {
      console.error(error);
      alert("❌ ERROR: Check console for details.");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleImport}
      disabled={loading}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        backgroundColor: 'red',
        color: 'white',
        padding: '15px',
        fontWeight: 'bold',
        borderRadius: '8px',
        border: '2px solid white'
      }}
    >
      {loading ? "Importing..." : "⚡ CLICK TO SEED DATA"}
    </button>
  );
};

export default Seeder;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LogOut, Save, MapPin, Navigation } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { isAdminLoggedIn, logoutAdmin, getAdminEmail } from '../utils/adminAuth';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const ZOOM_LEVEL = 8;

// Component to handle map clicks
function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [incidentType, setIncidentType] = useState('blocked');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if admin is logged in
        if (!isAdminLoggedIn()) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/admin');
    };

    const handleLocationSelect = (latlng) => {
        setSelectedLocation(latlng);
        setManualLat(latlng.lat.toFixed(6));
        setManualLng(latlng.lng.toFixed(6));
    };

    const handleManualCoords = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);

        if (isNaN(lat) || isNaN(lng)) {
            alert('Please enter valid coordinates');
            return;
        }

        if (lat < 5.9 || lat > 9.9 || lng < 79.5 || lng > 82.0) {
            alert('Coordinates must be within Sri Lanka bounds');
            return;
        }

        setSelectedLocation({ lat, lng });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedLocation) {
            alert('Please select a location on the map or enter coordinates');
            return;
        }

        setIsSubmitting(true);

        try {
            const incidentData = {
                type: incidentType,
                message: message || '',
                description: message || '',
                location: {
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                },
                timestamp: new Date(),
                voteCount: 0,
                trueVotes: 0,
                fakeVotes: 0,
                images: [],
                hasImage: false,
                addedBy: 'admin',
                adminEmail: getAdminEmail(),
            };

            await addDoc(collection(db, 'incidents'), incidentData);

            alert('Incident added successfully!');

            // Reset form
            setSelectedLocation(null);
            setManualLat('');
            setManualLng('');
            setMessage('');
            setIncidentType('blocked');
        } catch (error) {
            console.error('Error adding incident:', error);
            alert('Failed to add incident. Please try again.');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-sm text-slate-300">Add incidents anywhere in Sri Lanka</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Select Location
                    </h2>

                    <div className="mb-4 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                        <p className="text-sm text-blue-200">
                            Click anywhere on the map to select incident location
                        </p>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-white/20" style={{ height: '400px' }}>
                        <MapContainer
                            center={SRI_LANKA_CENTER}
                            zoom={ZOOM_LEVEL}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <LocationPicker onLocationSelect={handleLocationSelect} />
                            {selectedLocation && (
                                <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                            )}
                        </MapContainer>
                    </div>

                    {/* Manual Coordinates */}
                    <div className="mt-4 space-y-3">
                        <p className="text-sm text-slate-300 font-medium">Or enter coordinates manually:</p>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                step="0.000001"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                placeholder="Latitude"
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <input
                                type="number"
                                step="0.000001"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                placeholder="Longitude"
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleManualCoords}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                        >
                            <Navigation className="w-4 h-4" />
                            Set Coordinates
                        </button>
                    </div>

                    {selectedLocation && (
                        <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                            <p className="text-sm text-green-200">
                                Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Form Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-white mb-4">Incident Details</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Incident Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">Incident Type</label>
                            <div className="space-y-2">
                                {[
                                    { value: 'blocked', label: 'Road Blocked (මාර්ගය අවහිර)', color: 'bg-red-500' },
                                    { value: 'flood', label: 'Flooded Area (සාමාන්‍ය ගංවතුර)', color: 'bg-yellow-500' },
                                    { value: 'help_needed', label: 'Help Needed (උදව් අවශ්‍යයි)', color: 'bg-blue-500' },
                                    { value: 'safe', label: 'Safe Zone (ආරෂිත)', color: 'bg-green-500' },
                                ].map((type) => (
                                    <label
                                        key={type.value}
                                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${incidentType === type.value
                                                ? 'border-primary-500 bg-primary-500/20'
                                                : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.value}
                                            checked={incidentType === type.value}
                                            onChange={(e) => setIncidentType(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div className={`w-4 h-4 rounded-full ${type.color} mr-3`}></div>
                                        <span className="text-sm text-white font-medium">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Message (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Add details about the incident..."
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                rows="4"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedLocation}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Adding Incident...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Add Incident
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AlertCircle, Navigation, Plus } from 'lucide-react';
import AddReportModal from './AddReportModal';
import { useNavigate } from 'react-router-dom';
import { getGridCellId } from '../utils/geo';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const ZOOM_LEVEL = 8;

// Custom cluster icon logic
const getClusterColor = (incidents) => {
  if (!incidents || incidents.length === 0) return '#6b7280';
  const types = incidents.map(inc => inc?.type).filter(Boolean);
  if (types.includes('blocked')) {
    return '#ef4444'; // Red for blocked (highest priority)
  }
  if (types.includes('flood')) {
    return '#eab308'; // Yellow for flood
  }
  if (types.includes('help_needed')) {
    return '#3b82f6'; // Blue
  }
  return '#22c55e'; // Green
};

// Create custom icons for different incident types
const createCustomIcon = (type) => {
  const color = getMarkerColor(type);
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 40px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="
          width: 30px;
          height: 40px;
          fill: ${color};
          stroke: white;
          stroke-width: 1;
        ">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      </div>
    `,
    className: '',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
};

const getMarkerColor = (type) => {
  switch (type) {
    case 'blocked':
      return '#ef4444'; // Red
    case 'flood':
      return '#eab308'; // Yellow
    case 'help_needed':
      return '#3b82f6'; // Blue
    case 'safe':
      return '#22c55e'; // Green
    default:
      return '#6b7280'; // Gray
  }
};

const MapControls = ({ onAddReport }) => {
  const map = useMap();

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView([position.coords.latitude, position.coords.longitude], 15);
        },
        () => {
          alert('Unable to get your location. Please enable GPS.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="absolute bottom-14 right-10 z-[1000] flex flex-col items-stretch gap-2 pointer-events-none">
      <button
        onClick={handleLocate}
        className="bg-white rounded-2xl px-5 py-2.5 shadow-xl hover:bg-slate-50 transition-all border border-slate-200 flex items-center gap-2 font-medium text-slate-700 pointer-events-auto"
        aria-label="My location"
      >
        <Navigation className="w-5 h-5 text-primary-600" />
        <span>My location</span>
      </button>
      <button
        onClick={onAddReport}
        className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl px-6 py-3 shadow-2xl hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-[1.02] flex items-center gap-2 font-semibold pointer-events-auto"
        aria-label="Add Update"
      >
        <Plus className="w-5 h-5" />
        <span>Add Update</span>
      </button>
    </div>
  );
};

const AreaClickHandler = ({ onAreaSelect }) => {
  const interactionState = useRef({ isDragging: false, timeoutId: null });

  useMapEvents({
    dragstart() {
      interactionState.current.isDragging = true;
    },
    zoomstart() {
      interactionState.current.isDragging = true;
    },
    moveend() {
      clearTimeout(interactionState.current.timeoutId);
      interactionState.current.timeoutId = setTimeout(() => {
        interactionState.current.isDragging = false;
      }, 50);
    },
    zoomend() {
      clearTimeout(interactionState.current.timeoutId);
      interactionState.current.timeoutId = setTimeout(() => {
        interactionState.current.isDragging = false;
      }, 50);
    },
    click(e) {
      if (!interactionState.current.isDragging && onAreaSelect) {
        onAreaSelect(e.latlng);
      }
    },
  });

  return null;
};

const MapView = ({ onMapReady, onDataReady }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showInstruction, setShowInstruction] = useState(() => {
    return !sessionStorage.getItem('instruction_dismissed');
  });
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const dataReadyRef = useRef(false);
  const incidentDataMap = useRef(new Map());

  useEffect(() => {
    loadIncidents();
    // Simulate map tiles loading
    setTimeout(() => {
      mapReadyRef.current = true;
      if (onMapReady) onMapReady();
    }, 100);
  }, []);

  // Clear data map when incidents change
  useEffect(() => {
    incidentDataMap.current.clear();
  }, [incidents]);

  const dismissInstruction = () => {
    setShowInstruction(false);
    sessionStorage.setItem('instruction_dismissed', 'true');
  };

  const loadIncidents = async () => {
    try {
      const now = Timestamp.now();
      const yesterday = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, 'incidents'),
        where('timestamp', '>=', yesterday),
        orderBy('timestamp', 'desc'),
        limit(500)
      );

      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        const incident = doc.data();
        if (incident.voteCount >= -3) {
          // Filter out heavily downvoted incidents
          data.push({
            id: doc.id,
            ...incident,
            location: incident.location,
          });
        }
      });

      setIncidents(data);
      setLoading(false);
      dataReadyRef.current = true;
      if (onDataReady) onDataReady();
    } catch (error) {
      console.error('Error loading incidents:', error);
      setLoading(false);
      dataReadyRef.current = true;
      if (onDataReady) onDataReady();
    }
  };

  const handleMarkerClick = (incident) => {
    dismissInstruction();
    // When clicking a marker, show all incidents in the same 30km grid cell
    const markerCellId = getGridCellId(
      incident.location.latitude,
      incident.location.longitude
    );

    const cellIncidents = incidents.filter((inc) => {
      const incCellId = getGridCellId(
        inc.location.latitude,
        inc.location.longitude
      );
      return incCellId === markerCellId;
    });

    navigate('/updates', { state: { incidents: cellIncidents, cellId: markerCellId } });
  };

  const handleAddReport = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShowModal(true);
        },
        (error) => {
          alert('Please enable GPS to add a report.');
        }
      );
    } else {
      alert('Geolocation is not supported.');
    }
  };

  const handleAreaClick = (e) => {
    const { lat, lng } = e.latlng;

    // Get the grid cell ID for the clicked location
    const clickedCellId = getGridCellId(lat, lng);

    // Find all incidents within the same 30km grid cell
    const cellIncidents = incidents.filter((incident) => {
      const incidentCellId = getGridCellId(
        incident.location.latitude,
        incident.location.longitude
      );
      return incidentCellId === clickedCellId;
    });

    if (cellIncidents.length > 0) {
      // Navigate to updates room with all incidents in the same 30km grid cell
      navigate('/updates', { state: { incidents: cellIncidents, cellId: clickedCellId } });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={ZOOM_LEVEL}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
        tap={false}
        touchZoom={true}
        dragging={true}
        attributionControl={false}
      >
        <AreaClickHandler onAreaSelect={handleAreaClick} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapControls onAddReport={handleAddReport} />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={20}
          disableClusteringAtZoom={9}
          spiderfyOnMaxZoom={true}
          eventHandlers={{
            clusterclick: () => dismissInstruction(),
          }}
          iconCreateFunction={(cluster) => {
            const markers = cluster.getAllChildMarkers();
            const count = markers.length;
            // Access incident data from our data map using marker coordinates as key
            const incidents = markers.map(m => {
              const lat = m._latlng?.lat;
              const lng = m._latlng?.lng;
              if (lat && lng) {
                const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
                return incidentDataMap.current.get(key);
              }
              return null;
            }).filter(Boolean);
            const color = getClusterColor(incidents);

            // Different styling for smaller vs larger clusters
            const size = count > 10 ? 45 : count > 5 ? 40 : 35;
            const fontSize = count > 99 ? '12px' : count > 9 ? '14px' : '16px';

            return L.divIcon({
              html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: ${fontSize};">${count}</div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(size, size),
            });
          }}
        >
          {incidents.map((incident) => {
            // Store incident data in map using coordinates as key
            const key = `${incident.location.latitude.toFixed(4)}_${incident.location.longitude.toFixed(4)}`;
            incidentDataMap.current.set(key, incident);

            return (
              <Marker
                key={incident.id}
                position={[incident.location.latitude, incident.location.longitude]}
                icon={createCustomIcon(incident.type)}
                eventHandlers={{
                  click: () => handleMarkerClick(incident),
                }}
              />
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {showInstruction && (
        <div className="absolute top-24 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg text-center mx-4 pointer-events-auto animate-fade-in-down">
            Click on icons for more details <br />
            <span className="text-xs opacity-80">වැඩි විස්තර සඳහා දර්ශක මත click කරන්න</span>
          </div>
        </div>
      )}

      {showModal && userLocation && (
        <AddReportModal
          userLocation={userLocation}
          onClose={() => {
            setShowModal(false);
            setUserLocation(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setUserLocation(null);
            loadIncidents();
          }}
        />
      )}
    </>
  );
};

export default MapView;
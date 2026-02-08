import { useState, useEffect, useRef } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

import {

  doc,

  updateDoc,

  increment,

  collection,

  query,

  where,

  orderBy,

  limit,

  getDocs,

  Timestamp,

} from 'firebase/firestore';

import { db } from '../firebase/config';

import { getGridCellId } from '../utils/geo';



const GalleryView = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const { incidents: initialIncidents, incident, cellId: initialCellId } = location.state || {};

  const [votedUpdates, setVotedUpdates] = useState(new Set());
  const [areaIncidents, setAreaIncidents] = useState(initialIncidents || []);

  const [areaCellId, setAreaCellId] = useState(() => {
    if (initialCellId) return initialCellId;

    // Safety check: ensure initialIncidents is an array and has items
    const baseIncident = (Array.isArray(initialIncidents) && initialIncidents.length > 0 && initialIncidents[0]) || incident;

    if (baseIncident?.location) {
      return getGridCellId(baseIncident.location.latitude, baseIncident.location.longitude);
    }
    return null;
  });

  const [loadingArea, setLoadingArea] = useState(!initialIncidents && !!incident);

  const zoneLabel = areaCellId ? areaCellId.replace('grid_', 'Zone ') : '30km Radius';

  const locationNameCache = useRef(new Map());

  const [locationNames, setLocationNames] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const closeLightbox = () => setLightboxImage(null);



  useEffect(() => {

    if (initialIncidents && initialIncidents.length) {

      setAreaIncidents(initialIncidents);

      if (!initialCellId && initialIncidents[0]?.location) {

        setAreaCellId(

          getGridCellId(

            initialIncidents[0].location.latitude,

            initialIncidents[0].location.longitude

          )

        );

      } else if (initialCellId) {

        setAreaCellId(initialCellId);

      }

      setLoadingArea(false);

      return;

    }



    if (!initialIncidents && incident?.location) {

      const derivedCell = getGridCellId(incident.location.latitude, incident.location.longitude);

      setAreaCellId(derivedCell);



      const fetchIncidentsForCell = async () => {

        setLoadingArea(true);

        try {

          const now = Timestamp.now();

          const yesterday = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);

          const incidentsQuery = query(

            collection(db, 'incidents'),

            where('timestamp', '>=', yesterday),

            orderBy('timestamp', 'desc'),

            limit(500)

          );

          const snapshot = await getDocs(incidentsQuery);

          const results = [];

          snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            if (data.voteCount >= -3 && data.location) {

              const incidentCell = getGridCellId(

                data.location.latitude,

                data.location.longitude

              );

              if (incidentCell === derivedCell) {

                results.push({

                  id: docSnap.id,

                  ...data,

                });

              }

            }

          });

          setAreaIncidents(results);

        } catch (error) {

          console.error('Error loading incidents for updates room:', error);

        } finally {

          setLoadingArea(false);

        }

      };



      fetchIncidentsForCell();

    }

  }, [initialIncidents, incident, initialCellId]);



  useEffect(() => {

    const savedVotes = localStorage.getItem('safepass_voted_updates');

    if (savedVotes) {

      try {

        const votes = JSON.parse(savedVotes);

        setVotedUpdates(new Set(votes));

      } catch (e) {

        console.error('Error loading votes:', e);

      }

    }

  }, []);


  useEffect(() => {

    let isMounted = true;

    if (!areaIncidents.length) {

      return () => {

        isMounted = false;

      };

    }



    const seedFromCache = {};

    areaIncidents.forEach((incident) => {

      if (!incident.location) {

        return;

      }

      const cacheKey = incident.location?.latitude != null && incident.location?.longitude != null
        ? `${incident.location.latitude.toFixed(3)},${incident.location.longitude.toFixed(3)}`
        : 'unknown';

      if (locationNameCache.current.has(cacheKey)) {

        seedFromCache[incident.id] = locationNameCache.current.get(cacheKey);

      }

    });



    if (Object.keys(seedFromCache).length) {

      setLocationNames((prev) => ({ ...prev, ...seedFromCache }));

    }



    const incidentsNeedingNames = areaIncidents.filter((incident) => {

      if (!incident.location) return false;

      const cacheKey = incident.location?.latitude != null && incident.location?.longitude != null
        ? `${incident.location.latitude.toFixed(3)},${incident.location.longitude.toFixed(3)}`
        : 'unknown';

      return !locationNameCache.current.has(cacheKey);

    });



    if (!incidentsNeedingNames.length) {

      return () => {

        isMounted = false;

      };

    }



    const fetchNames = async () => {

      for (const incident of incidentsNeedingNames) {

        const { latitude, longitude } = incident.location || {};

        if (latitude == null || longitude == null) {

          continue;

        }

        const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

        let label = 'Unknown area';

        try {

          const response = await fetch(

            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,

            {

              headers: {

                'User-Agent': 'SafePass/1.0 (contact@toolteek.com)',

                'Accept-Language': 'en',

              },

            }

          );

          if (response.ok) {

            const data = await response.json();

            label =

              data?.address?.village ||

              data?.address?.town ||

              data?.address?.city ||

              data?.display_name?.split(',')[0] ||

              'Unknown area';

          }

        } catch {

          label = 'Unknown area';

        }



        locationNameCache.current.set(cacheKey, label);



        if (isMounted) {

          setLocationNames((prev) => ({

            ...prev,

            [incident.id]: label,

          }));

        }



        await new Promise((resolve) => setTimeout(resolve, 800));

      }

    };



    fetchNames();



    return () => {

      isMounted = false;

    };

  }, [areaIncidents]);



  const allUpdates = Array.isArray(areaIncidents) ? areaIncidents.flatMap((item, itemIndex) => {
    if (!item) return [];

    const updates = [];
    const incidentId = item.id || `incident_${itemIndex}`;
    const baseIncidentInfo = {
      voteCount: item.voteCount ?? 0,
      trueVotes: item.trueVotes ?? 0,
      fakeVotes: item.fakeVotes ?? 0,
      location: item.location || null,
    };

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      item.images.forEach((img, imgIndex) => {
        const updateId = `${incidentId}_image_${imgIndex}`;
        updates.push({
          id: updateId,
          url: img,
          message: item.message || item.description || '',
          timestamp: item.timestamp,
          incidentId: incidentId,
          imageIndex: imgIndex,
          type: item.type,
          hasImage: true,
          ...baseIncidentInfo,
        });
      });
    } else {
      const updateId = `${incidentId}_message`;
      updates.push({
        id: updateId,
        url: null,
        message: item.message || item.description || '',
        timestamp: item.timestamp,
        incidentId: incidentId,
        imageIndex: 0,
        type: item.type,
        hasImage: false,
        ...baseIncidentInfo,
      });
    }
    return updates;
  }) : [];



  if (loadingArea) {

    return (

      <div className="fixed inset-0 z-[2000] bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white">

        <div className="text-center space-y-3 px-8">

          <div className="text-primary-300 text-sm uppercase tracking-widest">Updates Room</div>

          <p className="text-slate-200">Loading latest community reports...</p>

        </div>

      </div>

    );

  }



  if (!loadingArea && (!areaIncidents || areaIncidents.length === 0)) {

    return (

      <div className="fixed inset-0 z-[2000] bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-white">

        <div className="text-center space-y-3 px-8">

          <h2 className="text-2xl font-semibold">Updates Room</h2>

          <p className="text-slate-300">No updates have been reported in this 30km zone yet.</p>

          <button

            onClick={() => navigate(-1)}

            className="mt-4 px-6 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm font-medium"

          >

            Go back

          </button>

        </div>

      </div>

    );

  }



  const formatTimestamp = (timestamp) => {

    if (!timestamp) return 'Unknown time';

    let date = null;

    try {

      if (timestamp.toDate) {

        date = timestamp.toDate();

      } else if (typeof timestamp === 'number') {

        date = new Date(timestamp);

      } else if (typeof timestamp === 'string') {

        date = new Date(timestamp);

      } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {

        date = new Date(timestamp.seconds * 1000);

      }

    } catch {

      date = null;

    }



    if (!date || Number.isNaN(date.getTime())) {

      return 'Unknown time';

    }



    const now = new Date();

    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);

    const hours = Math.floor(diff / 3600000);

    const days = Math.floor(diff / 86400000);



    if (minutes < 1) return 'Just now';

    if (minutes < 60) return `${minutes}m ago`;

    if (hours < 24) return `${hours}h ago`;

    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();

  };



  const handleVote = async (updateId, isTrue) => {
    if (votedUpdates.has(updateId)) {
      showNotification('You can only vote one time');
      return;
    }

    try {
      const update = allUpdates.find((u) => u.id === updateId);
      if (!update) {
        console.error('Update not found:', updateId);
        return;
      }

      console.log('Voting on incident:', update.incidentId, 'Vote:', isTrue ? 'True' : 'Fake');

      const incidentRef = doc(db, 'incidents', update.incidentId);
      await updateDoc(incidentRef, {
        voteCount: increment(isTrue ? 1 : -1),
        trueVotes: isTrue ? increment(1) : increment(0),
        fakeVotes: !isTrue ? increment(1) : increment(0),
      });

      console.log('Vote saved to Firebase successfully');

      // Update local state immediately
      setAreaIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== update.incidentId) return inc;
          const newInc = {
            ...inc,
            voteCount: (inc.voteCount || 0) + (isTrue ? 1 : -1),
            trueVotes: (inc.trueVotes || 0) + (isTrue ? 1 : 0),
            fakeVotes: (inc.fakeVotes || 0) + (!isTrue ? 1 : 0),
          };
          console.log('Updated incident locally:', newInc);
          return newInc;
        })
      );

      const newVotedUpdates = new Set([...votedUpdates, updateId]);
      setVotedUpdates(newVotedUpdates);
      localStorage.setItem('safepass_voted_updates', JSON.stringify(Array.from(newVotedUpdates)));

      showNotification(isTrue ? 'Voted True!' : 'Voted Fake!');
    } catch (error) {
      console.error('Error voting:', error);
      showNotification('Failed to save vote. Please try again.');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'blocked':
        return 'bg-danger';
      case 'flood':
        return 'bg-yellow-500';
      case 'help_needed':
        return 'bg-blue-500';
      case 'safe':
        return 'bg-safe';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'blocked':
        return 'Road Blocked (මාර්ගය අවහිර)';
      case 'flood':
        return 'Flooded Area (සාමාන්‍ය ගංවතුර)';
      case 'help_needed':
        return 'Help Needed (උදව් අවශ්‍යයි)';
      case 'safe':
        return 'Safe Zone (ආරෂිත)';
      default:
        return type.replace('_', ' ');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-900/95 to-transparent p-4">

        <div className="flex items-center justify-between">

          <button

            onClick={() => navigate(-1)}

            className="bg-white/10 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-colors border border-white/20"

          >

            <ArrowLeft className="w-6 h-6" />

          </button>

          <div className="text-white font-semibold text-right">

            <div className="text-xs uppercase tracking-widest text-primary-200">Updates Room</div>

            <div className="text-sm text-slate-300">

              {zoneLabel} · {allUpdates.length} update{allUpdates.length === 1 ? '' : 's'}

            </div>

          </div>

        </div>

      </div>



      {/* Updates Feed */}

      <div className="h-full overflow-y-auto pt-24 pb-10 px-4">
        <div className="flex flex-col gap-4 pb-8 max-w-2xl mx-auto">

          {allUpdates.map((update, index) => {

            const hasVoted = votedUpdates.has(update.id);

            const trueVotes = update.trueVotes ?? 0;

            const fakeVotes = update.fakeVotes ?? 0;

            const locationLabel =
              update.location && locationNames[update.incidentId]
                ? locationNames[update.incidentId]
                : update.location && update.location.latitude != null && update.location.longitude != null
                  ? `${update.location.latitude.toFixed(2)}, ${update.location.longitude.toFixed(2)}`
                  : 'Unknown area';

            return (
              <div
                key={update.id || index}
                className="bg-white/95 rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
              >

                {update.hasImage && update.url && (

                  <div className="relative bg-black aspect-square cursor-pointer group" onClick={() => setLightboxImage(update.url)}>
                    <img
                      src={update.url}
                      alt={`Update ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                    <div className="absolute top-3 right-3 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleVote(update.id, true)}
                        disabled={hasVoted}
                        className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md ${hasVoted
                          ? 'bg-black/40 text-slate-300 cursor-not-allowed'
                          : 'bg-safe/90 text-white hover:bg-green-600'
                          }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        True ({trueVotes})
                      </button>
                      <button
                        onClick={() => handleVote(update.id, false)}
                        disabled={hasVoted}
                        className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md ${hasVoted
                          ? 'bg-black/40 text-slate-300 cursor-not-allowed'
                          : 'bg-danger/90 text-white hover:bg-red-600'
                          }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Fake ({fakeVotes})
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getTypeColor(update.type)}`}></div>
                    <span className="text-xs font-semibold uppercase text-slate-600 tracking-wide">
                      {getTypeLabel(update.type)}
                    </span>
                    <div className="flex items-center text-xs text-slate-400 ml-auto">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTimestamp(update.timestamp)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Near {locationLabel}
                  </div>

                  {update.message && (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {update.message}
                    </p>
                  )}

                  {!update.hasImage && !update.message && (
                    <p className="text-sm text-slate-500 italic">No additional details provided.</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleVote(update.id, true)}
                      disabled={hasVoted}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${hasVoted
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-safe/90 text-white hover:bg-green-600'
                        }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      True ({trueVotes})
                    </button>
                    <button
                      onClick={() => handleVote(update.id, false)}
                      disabled={hasVoted}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${hasVoted
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-danger/80 text-white hover:bg-red-600'
                        }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Fake ({fakeVotes})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div >
      </div >

      {/* Lightbox */}
      {
        lightboxImage && (
          <div
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img
              src={lightboxImage}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      }

      {/* Notification Toast */}
      {
        notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2500] bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )
      }
    </div >
  );
};

export default GalleryView;

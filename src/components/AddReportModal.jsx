import { useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { X, Upload, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const AddReportModal = ({ userLocation, onClose, onSuccess }) => {
  const [reportType, setReportType] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const checkSpamProtection = () => {
    const lastSubmission = localStorage.getItem('lastReportSubmission');
    if (lastSubmission) {
      const timeDiff = Date.now() - parseInt(lastSubmission);
      if (timeDiff < 2 * 60 * 1000) {
        const remainingSeconds = Math.ceil((2 * 60 * 1000 - timeDiff) / 1000);
        alert(`Please wait ${remainingSeconds} seconds before submitting another report.`);
        return false;
      }
    }
    return true;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob.size > 1024 * 1024) {
                // If still > 1MB, reduce quality
                canvas.toBlob(
                  (compressedBlob) => {
                    resolve(compressedBlob || blob);
                  },
                  'image/jpeg',
                  0.7
                );
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            0.85
          );
        };
      };
    });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed.');
      return;
    }

    const compressedImages = await Promise.all(
      files.map(async (file) => {
        if (file.size > 1024 * 1024) {
          return await compressImage(file);
        }
        return file;
      })
    );

    setImages([...images, ...compressedImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reportType) {
      alert('Please select a report type.');
      return;
    }

    if (!checkSpamProtection()) {
      return;
    }

    setUploading(true);

    try {
      // Upload images with metadata to fix CORS
      const imageUrls = [];
      for (const image of images) {
        try {
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(7);
          const imageRef = ref(storage, `incidents/${timestamp}_${randomId}`);

          // Add metadata with content type
          const metadata = {
            contentType: image.type || 'image/jpeg',
            cacheControl: 'public, max-age=31536000',
          };

          await uploadBytes(imageRef, image, metadata);
          const url = await getDownloadURL(imageRef);
          imageUrls.push(url);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          if (uploadError.code === 'storage/unauthorized') {
            alert('Storage upload failed. Please verify your Firebase Storage bucket name and security rules.');
            setUploading(false);
            return;
          }
          alert(`Image upload failed: ${uploadError.message || uploadError.code || 'Unknown error'}`);
          setUploading(false);
          return;
        }
      }

      // Save to Firestore (even if no images)
      await addDoc(collection(db, 'incidents'), {
        location: new GeoPoint(userLocation.lat, userLocation.lng),
        type: reportType,
        description: message.substring(0, 140),
        message: message,
        timestamp: serverTimestamp(),
        voteCount: 0,
        trueVotes: 0,
        fakeVotes: 0,
        images: imageUrls,
      });

      localStorage.setItem('lastReportSubmission', Date.now().toString());
      onSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(error?.message || 'Failed to submit report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold">Add Report - වාර්ථා කරන්න</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <div className="space-y-2">
              <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${reportType === 'blocked'
                ? 'border-danger bg-red-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="blocked"
                  checked={reportType === 'blocked'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mr-3"
                />
                <div className="w-4 h-4 rounded-full bg-danger mr-3"></div>
                <span className="font-medium">Road Blocked (මාර්ගය අවහිර)</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${reportType === 'flood'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="flood"
                  checked={reportType === 'flood'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mr-3"
                />
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                <span className="font-medium">Flooded Area (සාමාන්‍ය ගංවතුර)</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${reportType === 'help_needed'
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="help_needed"
                  checked={reportType === 'help_needed'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mr-3"
                />
                <div className="w-4 h-4 rounded-full bg-primary-500 mr-3"></div>
                <span className="font-medium">Help Needed (උදව් අවශ්‍යයි)</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${reportType === 'safe'
                ? 'border-safe bg-green-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="safe"
                  checked={reportType === 'safe'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mr-3"
                />
                <div className="w-4 h-4 rounded-full bg-safe mr-3"></div>
                <span className="font-medium">Safe Zone (ආරෂිත)</span>
              </label>
            </div>
          </div>

          {/* Location Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Location</label>
            <div className="h-48 rounded-lg overflow-hidden border">
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                  attribution=""
                />
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }}
                />
              </MapContainer>
            </div>
            <a
              href={`http://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline mt-2 inline-block font-medium"
            >
              Navigate Here
            </a>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Message (ඔබේ පණිවිඩය) </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the situation... (ඔබ අවට තත්වය පැහැදිලි කරන්න) "
              className="w-full p-3 border rounded-lg resize-none"
              rows="3"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Images (රූප) (Max 5)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-colors bg-slate-50"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Images
            </button>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={uploading || !reportType}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-all transform hover:scale-[1.02] disabled:transform-none"
          >
            {uploading ? (
              'Uploading...'
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddReportModal;

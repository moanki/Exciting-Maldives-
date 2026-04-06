import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Hotel } from 'lucide-react';
import Map, { Marker, NavigationControl, MapRef, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

const ATOLL_COORDINATES: Record<string, { lat: number, lng: number }> = {
  "North Malé Atoll": { lat: 4.4167, lng: 73.5000 },
  "South Malé Atoll": { lat: 3.9667, lng: 73.4333 },
  "Ari Atoll": { lat: 3.8667, lng: 72.8333 },
  "Baa Atoll": { lat: 5.1667, lng: 73.0000 },
  "Lhaviyani Atoll": { lat: 5.3333, lng: 73.5000 },
  "Dhaalu Atoll": { lat: 2.8333, lng: 72.9167 }
};

export default function MaldivesMap() {
  const mapRef = useRef<MapRef>(null);
  const [resorts, setResorts] = useState<any[]>([]);
  const [selectedResort, setSelectedResort] = useState<any | null>(null);

  useEffect(() => {
    const fetchResorts = async () => {
      const { data } = await supabase.from('resorts').select('id, name, atoll, category, images');
      if (data) {
        // Assign coordinates based on atoll with a slight random offset to prevent overlap
        const resortsWithCoords = data.map((resort, index) => {
          const baseCoords = ATOLL_COORDINATES[resort.atoll] || { lat: 4.1755, lng: 73.5093 }; // Default to Malé
          
          // Generate a deterministic pseudo-random offset based on the index
          const offsetLat = (Math.sin(index * 12.9898) * 43758.5453 % 1) * 0.15 - 0.075;
          const offsetLng = (Math.cos(index * 78.233) * 43758.5453 % 1) * 0.15 - 0.075;

          return {
            ...resort,
            lat: baseCoords.lat + offsetLat,
            lng: baseCoords.lng + offsetLng
          };
        });
        setResorts(resortsWithCoords);
      }
    };
    fetchResorts();
  }, []);

  const atolls = Object.entries(ATOLL_COORDINATES).map(([name, coords]) => ({
    name,
    ...coords,
    resorts: resorts.filter(r => r.atoll === name).length
  }));

  const [viewState, setViewState] = useState({
    longitude: 73.2207,
    latitude: 3.2028,
    zoom: 6,
    pitch: 45,
    bearing: 0
  });

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif mb-4 text-brand-ink">Island <span className="italic">Geography</span></h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold font-sans">Explore the 26 natural atolls of the Maldives</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Map Visualization */}
          <div className="relative aspect-[3/4] bg-blue-50 rounded-[40px] overflow-hidden border border-blue-100 shadow-inner">
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              attributionControl={false}
            >
              <NavigationControl position="bottom-right" />
              
              {/* Resort Markers */}
              {resorts.map((resort) => (
                <Marker
                  key={resort.id}
                  longitude={resort.lng}
                  latitude={resort.lat}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setSelectedResort(resort);
                    if (mapRef.current) {
                      mapRef.current.flyTo({
                        center: [resort.lng, resort.lat],
                        zoom: 10,
                        duration: 1500
                      });
                    }
                  }}
                >
                  <div className="relative group cursor-pointer">
                    <div className="w-6 h-6 bg-brand-navy text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:scale-110 transition-transform hover:bg-brand-teal">
                      <Hotel size={12} />
                    </div>
                  </div>
                </Marker>
              ))}

              {/* Popup for Selected Resort */}
              {selectedResort && (
                <Popup
                  longitude={selectedResort.lng}
                  latitude={selectedResort.lat}
                  anchor="top"
                  onClose={() => setSelectedResort(null)}
                  closeOnClick={false}
                  className="z-50"
                  maxWidth="250px"
                >
                  <div className="p-1">
                    {selectedResort.images?.[0] && (
                      <img 
                        src={selectedResort.images[0]} 
                        alt={selectedResort.name} 
                        className="w-full h-24 object-cover rounded-lg mb-3"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h3 className="font-serif text-lg text-brand-ink leading-tight mb-1">{selectedResort.name}</h3>
                    <p className="text-xs text-gray-500 font-sans mb-3">{selectedResort.atoll}</p>
                    <Link 
                      to={`/resorts/${selectedResort.id}`}
                      className="block w-full text-center bg-brand-teal text-white text-[10px] uppercase tracking-widest font-bold py-2 rounded-lg hover:bg-brand-navy transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </Popup>
              )}
            </Map>
          </div>

          {/* Atoll List */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif text-brand-ink">Resort Zones</h2>
            <p className="text-gray-500 font-sans font-light leading-relaxed text-lg">
              The Maldives is divided into administrative atolls, each offering a unique experience. Click on an atoll to zoom in and discover the resorts located there.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {atolls.map((atoll, idx) => (
                <div 
                  key={idx} 
                  className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-brand-teal/20 transition-all group cursor-pointer"
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.flyTo({
                        center: [atoll.lng, atoll.lat],
                        zoom: 9,
                        duration: 2000
                      });
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-lg text-brand-ink group-hover:text-brand-teal transition-colors">{atoll.name}</h3>
                    <MapPin size={16} className="text-gray-300 group-hover:text-brand-teal transition-colors" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 font-sans">{atoll.resorts} Resorts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

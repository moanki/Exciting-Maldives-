import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MaldivesMap() {
  const mapRef = useRef<MapRef>(null);

  const atolls = [
    { name: "North Malé Atoll", resorts: 24, lat: 4.4167, lng: 73.5000 },
    { name: "South Malé Atoll", resorts: 18, lat: 3.9667, lng: 73.4333 },
    { name: "Ari Atoll", resorts: 32, lat: 3.8667, lng: 72.8333 },
    { name: "Baa Atoll", resorts: 15, lat: 5.1667, lng: 73.0000 },
    { name: "Lhaviyani Atoll", resorts: 12, lat: 5.3333, lng: 73.5000 },
    { name: "Dhaalu Atoll", resorts: 10, lat: 2.8333, lng: 72.9167 }
  ];

  const [viewState, setViewState] = useState({
    longitude: 73.2207,
    latitude: 3.2028,
    zoom: 5,
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
            >
              <NavigationControl position="bottom-right" />
              {atolls.map((atoll, idx) => (
                <Marker
                  key={idx}
                  longitude={atoll.lng}
                  latitude={atoll.lat}
                  anchor="bottom"
                >
                  <div className="relative group cursor-pointer">
                    <div className="w-4 h-4 bg-brand-teal rounded-full shadow-lg group-hover:scale-150 transition-transform border-2 border-white"></div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      <p className="text-xs font-bold uppercase tracking-widest font-sans text-brand-ink">{atoll.name}</p>
                      <p className="text-[10px] text-gray-500 font-sans">{atoll.resorts} Resorts</p>
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>
          </div>

          {/* Atoll List */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif text-brand-ink">Resort Zones</h2>
            <p className="text-gray-500 font-sans font-light leading-relaxed text-lg">
              The Maldives is divided into administrative atolls, each offering a unique experience. From the vibrant North Malé to the pristine Baa Atoll (a UNESCO Biosphere Reserve).
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
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 font-sans">{atoll.resorts} Exclusive Resorts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

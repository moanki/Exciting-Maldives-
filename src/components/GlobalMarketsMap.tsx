import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

const safeArray = (val: any) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

export default function GlobalMarketsMap({ settings, globalMarkets }: { settings: any, globalMarkets: any[] }) {
  const [activeMarket, setActiveMarket] = useState<any | null>(null);

  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        longitude: 20,
        latitude: 20,
        zoom: 1.5,
        pitch: 0,
        bearing: 0
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      interactive={true}
      dragPan={true}
      scrollZoom={false}
      attributionControl={false}
    >
      {(safeArray(settings.global_markets).length > 0 ? safeArray(settings.global_markets) : globalMarkets).map((market: any, i: number) => {
        const lat = parseFloat(market.lat);
        const lng = parseFloat(market.lng);
        
        if (isNaN(lat) || isNaN(lng)) return null;

        return (
          <Marker
            key={`marker-${i}`}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setActiveMarket(market);
            }}
          >
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-4 bg-brand-teal/20 rounded-full blur-md animate-pulse"></div>
              <div className="relative bg-brand-teal text-white p-2 rounded-full shadow-lg border-2 border-white/20 group-hover:scale-110 transition-transform">
                <MapPin size={20} />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-brand-navy/80 backdrop-blur-sm text-white px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                {market.countries || market.name}
              </div>
            </div>
          </Marker>
        );
      })}

      {activeMarket && (
        <Popup
          longitude={parseFloat(activeMarket.lng)}
          latitude={parseFloat(activeMarket.lat)}
          anchor="bottom"
          offset={[0, -40]}
          onClose={() => setActiveMarket(null)}
          closeButton={false}
          className="global-market-popup"
        >
          <div className="p-4 min-w-[200px]">
            <h3 className="font-serif text-xl text-brand-navy mb-1">{activeMarket.name}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">{activeMarket.countries}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{activeMarket.description}</p>
          </div>
        </Popup>
      )}
    </Map>
  );
}

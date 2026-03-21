import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { MapPin, Plane, Coffee, Home, Star, CheckCircle, ArrowLeft, Calendar, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ResortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resort, setResort] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    roomType: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchResort = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setResort(data);
      }
      setLoading(false);
    };
    fetchResort();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('booking_requests')
        .insert({
          agent_id: session.user.id,
          resort_id: id,
          resort_name: resort.name,
          check_in: bookingForm.checkIn,
          check_out: bookingForm.checkOut,
          guests: bookingForm.guests,
          room_type: bookingForm.roomType,
          notes: bookingForm.notes,
          status: 'new'
        });
      
      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif italic text-xl">Loading resort...</div>;
  if (!resort) return <div className="h-screen flex items-center justify-center font-serif text-xl">Resort not found</div>;

  return (
    <div className="pb-24">
      {/* Hero Gallery */}
      <div className="relative h-[70vh] group">
        <img 
          src={resort.images?.[0] || `https://picsum.photos/seed/${resort.name}/1920/1080`} 
          alt={resort.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white hover:text-black transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="absolute bottom-12 left-8 right-8 max-w-7xl mx-auto">
          <div className="flex items-center text-white/80 uppercase tracking-[0.3em] text-xs font-bold mb-4 font-sans">
            <MapPin size={14} className="mr-2" /> {resort.atoll}, Maldives
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-4">{resort.name}</h1>
          <div className="flex gap-4">
            <span className="bg-brand-teal text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans">
              {resort.category}
            </span>
            <span className="bg-white/20 backdrop-blur text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans">
              {resort.transfer_type}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-3xl font-serif mb-6">About the Resort</h2>
            <div className="prose prose-stone max-w-none text-gray-600 font-sans font-light leading-relaxed text-lg">
              <ReactMarkdown>{resort.description}</ReactMarkdown>
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-gray-100">
            <div className="text-center">
              <Plane className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 font-sans">Transfer</p>
              <p className="text-sm font-medium font-sans">{resort.transfer_type}</p>
            </div>
            <div className="text-center">
              <Coffee className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 font-sans">Meal Plans</p>
              <p className="text-sm font-medium font-sans">{resort.meal_plans?.join(', ')}</p>
            </div>
            <div className="text-center">
              <Home className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 font-sans">Rooms</p>
              <p className="text-sm font-medium font-sans">{resort.room_types?.length || 0} Types</p>
            </div>
            <div className="text-center">
              <Star className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 font-sans">Category</p>
              <p className="text-sm font-medium font-sans">{resort.category}</p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-serif mb-8">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resort.highlights?.map((h: string, i: number) => (
                <div key={i} className="flex items-center p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                  <CheckCircle className="text-brand-teal mr-3" size={20} />
                  <span className="text-gray-700 font-medium font-sans">{h}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-serif mb-8">Room Types</h2>
            <div className="space-y-6">
              {resort.room_types?.map((room: any, i: number) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 flex flex-col md:flex-row shadow-sm">
                  <div className="md:w-1/3 aspect-video md:aspect-auto">
                    <img 
                      src={room.image || `https://picsum.photos/seed/${room.name}/600/400`} 
                      alt={room.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-serif mb-2">{room.name}</h3>
                    <p className="text-gray-500 text-sm font-sans font-light mb-4">{room.description}</p>
                    <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-brand-teal font-sans">
                      <span>Max Guests: {room.max_guests}</span>
                      <span>Size: {room.size}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            {submitted ? (
              <div className="text-center py-8">
                <div className="bg-brand-teal/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-brand-teal" size={40} />
                </div>
                <h3 className="text-2xl font-serif mb-2">Request Sent</h3>
                <p className="text-gray-500 text-sm mb-8 font-sans">Our sales team will contact you shortly with the best rates.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="w-full border border-gray-200 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all font-sans"
                >
                  New Request
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif mb-6">Request Booking</h3>
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Check In</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="date" 
                          required
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                          value={bookingForm.checkIn}
                          onChange={(e) => setBookingForm({...bookingForm, checkIn: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Check Out</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="date" 
                          required
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                          value={bookingForm.checkOut}
                          onChange={(e) => setBookingForm({...bookingForm, checkOut: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Guests</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="number" 
                        min="1"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({...bookingForm, guests: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Room Type</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                      value={bookingForm.roomType}
                      onChange={(e) => setBookingForm({...bookingForm, roomType: e.target.value})}
                    >
                      <option value="">Select a room...</option>
                      {resort.room_types?.map((r: any) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Special Notes</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/20 min-h-[100px] font-sans"
                      placeholder="Honeymoon, dietary requirements, etc."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-ink text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all disabled:opacity-50 font-sans"
                  >
                    {submitting ? 'Processing...' : 'Request Booking'}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest mt-4 font-sans">
                    B2B Exclusive Rates • No Payment Required Now
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';

export default function ProtectedResources() {
  const { id } = useParams<{ id: string }>();
  const [password, setPassword] = useState('');
  const [resource, setResource] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAccess = async () => {
    const { data, error } = await supabase
      .from('protected_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('Resource not found');
      return;
    }

    const passwords = data.passwords || (data.password ? [data.password] : []);
    
    if (passwords.includes(password)) {
      setResource(data);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (resource) {
    return (
      <div className="py-20 px-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif mb-6">{resource.title}</h1>
        <a href={resource.file_url} target="_blank" rel="noreferrer" className="bg-brand-teal text-white px-6 py-3 rounded-full">
          Download Resource
        </a>
      </div>
    );
  }

  return (
    <div className="py-20 px-10 max-w-md mx-auto">
      <h1 className="text-2xl font-serif mb-6">Enter Password</h1>
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        placeholder="Password"
      />
      <button onClick={handleAccess} className="w-full bg-brand-navy text-white p-3 rounded-lg">
        Access Resource
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

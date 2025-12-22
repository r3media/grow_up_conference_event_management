import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Building2, Briefcase, Phone, MapPin, IdCard } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ContactView = () => {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const fetchContact = async () => {
    try {
      const response = await axios.get(`${API}/public/contact/${contactId}`);
      setContact(response.data);
    } catch (error) {
      console.error('Failed to fetch contact:', error);
      setError('Contact not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Contact Not Found</h2>
          <p className="text-slate-600">The contact you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const getTypeColor = (type) => {
    const colors = {
      attendee: 'bg-blue-100 text-blue-700 border-blue-200',
      speaker: 'bg-purple-100 text-purple-700 border-purple-200',
      exhibitor: 'bg-green-100 text-green-700 border-green-200',
      sponsor: 'bg-amber-100 text-amber-700 border-amber-200',
      vip: 'bg-red-100 text-red-700 border-red-200',
      media: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://customer-assets.emergentagent.com/job_b24daee5-f6b3-4e7a-8cbd-5bf09369a819/artifacts/pq64btdj_ep-logo.png"
            alt="EventPass"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">Contact Information</h1>
        </div>

        {/* Contact Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <User size={48} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">{contact.name}</h2>
            {contact.title && (
              <p className="text-indigo-100 text-center text-lg">{contact.title}</p>
            )}
            <div className="flex justify-center mt-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getTypeColor(contact.type)}`}>
                {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 space-y-6">
            {contact.company && (
              <div className="flex items-start space-x-4">
                <div className="bg-indigo-100 p-3 rounded-lg flex-shrink-0">
                  <Building2 className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">Company</p>
                  <p className="text-lg text-slate-900 font-semibold">{contact.company}</p>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-start space-x-4">
                <div className="bg-emerald-100 p-3 rounded-lg flex-shrink-0">
                  <Mail className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">Email</p>
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-lg text-indigo-600 hover:text-indigo-700 font-semibold break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                  <Phone className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">Phone</p>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-lg text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {contact.booth_number && (
              <div className="flex items-start space-x-4">
                <div className="bg-amber-100 p-3 rounded-lg flex-shrink-0">
                  <MapPin className="text-amber-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">Booth Number</p>
                  <p className="text-lg text-slate-900 font-semibold">{contact.booth_number}</p>
                </div>
              </div>
            )}

            {contact.ticket_type && (
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
                  <IdCard className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 font-medium">Ticket Type</p>
                  <p className="text-lg text-slate-900 font-semibold">{contact.ticket_type}</p>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {contact.qr_code && (
            <div className="border-t border-slate-200 bg-slate-50 p-8">
              <p className="text-center text-sm text-slate-600 mb-4">
                This information was accessed via QR code scan
              </p>
              <div className="flex justify-center">
                <img 
                  src={contact.qr_code} 
                  alt="Contact QR Code" 
                  className="w-32 h-32 border-4 border-white rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-600">
          <p>Powered by EventPass</p>
        </div>
      </div>
    </div>
  );
};

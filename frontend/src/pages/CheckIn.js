import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { QrCode, Search, CheckCircle, Clock, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CheckIn = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedInContacts, setCheckedInContacts] = useState(new Set());
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchContacts();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0].event_id);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/contacts?event_id=${selectedEvent}`);
      setContacts(response.data);
      setStats({
        total: response.data.length,
        checkedIn: checkedInContacts.size
      });
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  const handleCheckIn = (contactId) => {
    const newCheckedIn = new Set(checkedInContacts);
    newCheckedIn.add(contactId);
    setCheckedInContacts(newCheckedIn);
    setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
    toast.success('Contact checked in successfully!');
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div data-testid="checkin-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Check-In</h2>
            <p className="text-slate-600 mt-1">Manage attendee check-ins with QR scanning</p>
          </div>
          <div className="w-64">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger data-testid="event-select">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.event_id} value={event.event_id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Attendees</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Checked In</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.checkedIn}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.total - stats.checkedIn}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-input"
              className="pl-10"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredContacts.map((contact) => {
                  const isCheckedIn = checkedInContacts.has(contact.contact_id);
                  return (
                    <tr
                      key={contact.contact_id}
                      data-testid={`contact-row-${contact.contact_id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{contact.name}</div>
                          <div className="text-sm text-slate-500">{contact.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {contact.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {contact.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCheckedIn ? (
                          <span className="flex items-center text-emerald-600 text-sm font-medium">
                            <CheckCircle size={16} className="mr-1" />
                            Checked In
                          </span>
                        ) : (
                          <span className="flex items-center text-slate-400 text-sm">
                            <Clock size={16} className="mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          onClick={() => handleCheckIn(contact.contact_id)}
                          disabled={isCheckedIn}
                          data-testid={`checkin-button-${contact.contact_id}`}
                          size="sm"
                        >
                          {isCheckedIn ? 'Checked In' : 'Check In'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
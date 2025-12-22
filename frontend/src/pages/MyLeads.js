import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Download, Trash2, Search, Users, Building2, Mail, Phone, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const url = selectedEvent && selectedEvent !== 'all' ? `${API}/leads?event_id=${selectedEvent}` : `${API}/leads`;
      const response = await axios.get(url);
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const url = selectedEvent && selectedEvent !== 'all' ? `${API}/leads/export?event_id=${selectedEvent}` : `${API}/leads/export`;
      const response = await axios.get(url, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Leads exported successfully!');
    } catch (error) {
      console.error('Failed to export leads:', error);
      toast.error('Failed to export leads');
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await axios.delete(`${API}/leads/${leadId}`);
      toast.success('Lead deleted successfully!');
      fetchLeads();
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.contact_company && lead.contact_company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type) => {
    const colors = {
      attendee: 'bg-blue-100 text-blue-700',
      speaker: 'bg-purple-100 text-purple-700',
      exhibitor: 'bg-green-100 text-green-700',
      sponsor: 'bg-amber-100 text-amber-700',
      vip: 'bg-red-100 text-red-700',
      media: 'bg-slate-100 text-slate-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div data-testid="my-leads-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Leads</h2>
            <p className="text-slate-600 mt-1">Contacts you've scanned - {filteredLeads.length} total</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger data-testid="event-filter-select">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.event_id} value={event.event_id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExport}
              data-testid="export-leads-button"
              disabled={leads.length === 0}
            >
              <Download size={18} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-leads-input"
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'No leads found' : 'No leads yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Use the Scanner to scan attendee QR codes and they will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Scanned
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.lead_id}
                      data-testid={`lead-row-${lead.lead_id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{lead.contact_name}</div>
                          {lead.contact_title && (
                            <div className="text-xs text-slate-500">{lead.contact_title}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-600">
                          {lead.contact_company ? (
                            <>
                              <Building2 size={14} className="mr-1 text-slate-400" />
                              {lead.contact_company}
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${lead.contact_email}`}
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <Mail size={14} className="mr-1" />
                          {lead.contact_email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.contact_phone ? (
                          <a
                            href={`tel:${lead.contact_phone}`}
                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            <Phone size={14} className="mr-1" />
                            {lead.contact_phone}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(lead.contact_type)}`}>
                          {lead.contact_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1 text-slate-400" />
                          {new Date(lead.scanned_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          onClick={() => handleDelete(lead.lead_id)}
                          data-testid={`delete-lead-${lead.lead_id}`}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

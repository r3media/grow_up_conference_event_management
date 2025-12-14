import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Users, Mail, Building2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    event_id: '',
    type: 'attendee',
    name: '',
    email: '',
    company: '',
    title: '',
    phone: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchContacts();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      if (response.data.length > 0) {
        setFormData({ ...formData, event_id: response.data[0].event_id });
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const url = filter === 'all' ? `${API}/contacts` : `${API}/contacts?type=${filter}`;
      const response = await axios.get(url);
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/contacts`, formData);
      toast.success('Contact created successfully!');
      setOpen(false);
      setFormData({
        event_id: events[0]?.event_id || '',
        type: 'attendee',
        name: '',
        email: '',
        company: '',
        title: '',
        phone: ''
      });
      fetchContacts();
    } catch (error) {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    }
  };

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
      <div data-testid="contacts-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Contacts</h2>
            <p className="text-slate-600 mt-1">Manage attendees, speakers, exhibitors, and sponsors</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-contact-button">
                <Plus size={20} className="mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="event_id">Event</Label>
                  <Select value={formData.event_id} onValueChange={(value) => setFormData({ ...formData, event_id: value })}>
                    <SelectTrigger data-testid="contact-event-select">
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
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger data-testid="contact-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="speaker">Speaker</SelectItem>
                      <SelectItem value="exhibitor">Exhibitor</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="contact-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="contact-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    data-testid="contact-company-input"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="contact-title-input"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-contact-button">
                  Add Contact
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {['all', 'attendee', 'speaker', 'exhibitor', 'sponsor', 'vip', 'media'].map((type) => (
            <Button
              key={type}
              onClick={() => setFilter(type)}
              variant={filter === type ? 'default' : 'secondary'}
              data-testid={`filter-${type}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Users className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No contacts yet</h3>
            <p className="text-slate-600 mb-6">Add your first contact to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div
                key={contact.contact_id}
                data-testid={`contact-card-${contact.contact_id}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{contact.name}</h3>
                    {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(contact.type)}`}>
                    {contact.type}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  {contact.company && (
                    <div className="flex items-center">
                      <Building2 size={16} className="mr-2 text-slate-400" />
                      {contact.company}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2 text-slate-400" />
                    {contact.email}
                  </div>
                  {contact.booth_number && (
                    <div className="text-xs text-slate-500">Booth: {contact.booth_number}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
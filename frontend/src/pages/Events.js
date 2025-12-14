import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Calendar, MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Events = () => {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    venue: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/events`, {
        name: formData.name,
        venue: formData.venue,
        description: formData.description,
        dates: {
          start: formData.start_date,
          end: formData.end_date
        }
      });
      toast.success('Event created successfully!');
      setOpen(false);
      setFormData({ name: '', venue: '', description: '', start_date: '', end_date: '' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    }
  };

  return (
    <Layout>
      <div data-testid="events-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Events</h2>
            <p className="text-slate-600 mt-1">Manage your conferences and expos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-event-button">
                <Plus size={20} className="mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="event-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                    data-testid="event-venue-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      data-testid="event-start-date-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      data-testid="event-end-date-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="event-description-input"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-event-button">
                  Create Event
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No events yet</h3>
            <p className="text-slate-600 mb-6">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.event_id}
                data-testid={`event-card-${event.event_id}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{event.name}</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-slate-400" />
                    {event.venue}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-slate-400" />
                    {event.dates.start} - {event.dates.end}
                  </div>
                </div>
                {event.description && (
                  <p className="mt-3 text-sm text-slate-500">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
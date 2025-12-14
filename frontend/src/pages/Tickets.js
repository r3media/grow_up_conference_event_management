import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Plus, Ticket, DollarSign, Users, Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Tickets = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    event_id: '',
    name: '',
    description: '',
    price: '',
    currency: 'usd',
    quantity: '',
    start_sale: '',
    end_sale: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchTickets();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0].event_id);
        setFormData(prev => ({ ...prev, event_id: response.data[0].event_id }));
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API}/tickets?event_id=${selectedEvent}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ticketData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        sold: 0
      };

      if (editingTicket) {
        await axios.put(`${API}/tickets/${editingTicket.ticket_id}`, ticketData);
        toast.success('Ticket updated successfully!');
      } else {
        await axios.post(`${API}/tickets`, ticketData);
        toast.success('Ticket created successfully!');
      }
      
      setOpen(false);
      setEditingTicket(null);
      setFormData({
        event_id: selectedEvent,
        name: '',
        description: '',
        price: '',
        currency: 'usd',
        quantity: '',
        start_sale: '',
        end_sale: ''
      });
      fetchTickets();
    } catch (error) {
      console.error('Failed to save ticket:', error);
      toast.error('Failed to save ticket');
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      event_id: ticket.event_id,
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price.toString(),
      currency: ticket.currency,
      quantity: ticket.quantity?.toString() || '',
      start_sale: ticket.start_sale || '',
      end_sale: ticket.end_sale || ''
    });
    setOpen(true);
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await axios.delete(`${API}/tickets/${ticketId}`);
      toast.success('Ticket deleted successfully!');
      fetchTickets();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleDialogClose = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingTicket(null);
      setFormData({
        event_id: selectedEvent,
        name: '',
        description: '',
        price: '',
        currency: 'usd',
        quantity: '',
        start_sale: '',
        end_sale: ''
      });
    }
  };

  return (
    <Layout>
      <div data-testid="tickets-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Tickets</h2>
            <p className="text-slate-600 mt-1">Manage ticket types for your events</p>
          </div>
          <div className="flex items-center space-x-4">
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
            <Dialog open={open} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button data-testid="create-ticket-button">
                  <Plus size={20} className="mr-2" />
                  Add Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTicket ? 'Edit Ticket' : 'Create New Ticket'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Ticket Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Early Bird, VIP, General Admission"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="ticket-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what's included with this ticket..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      data-testid="ticket-description-input"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="99.99"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        data-testid="ticket-price-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity (leave empty for unlimited)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="100"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        data-testid="ticket-quantity-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_sale">Sale Start Date</Label>
                      <Input
                        id="start_sale"
                        type="date"
                        value={formData.start_sale}
                        onChange={(e) => setFormData({ ...formData, start_sale: e.target.value })}
                        data-testid="ticket-start-sale-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_sale">Sale End Date</Label>
                      <Input
                        id="end_sale"
                        type="date"
                        value={formData.end_sale}
                        onChange={(e) => setFormData({ ...formData, end_sale: e.target.value })}
                        data-testid="ticket-end-sale-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" data-testid="submit-ticket-button">
                    {editingTicket ? 'Update Ticket' : 'Create Ticket'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Ticket className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets yet</h3>
            <p className="text-slate-600 mb-6">Create your first ticket type for this event</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                data-testid={`ticket-card-${ticket.ticket_id}`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{ticket.name}</h3>
                    {ticket.description && (
                      <p className="text-sm text-slate-600">{ticket.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(ticket)}
                      data-testid={`edit-ticket-${ticket.ticket_id}`}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(ticket.ticket_id)}
                      data-testid={`delete-ticket-${ticket.ticket_id}`}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Price</span>
                    <div className="flex items-center text-lg font-bold text-slate-900">
                      <DollarSign size={18} />
                      {ticket.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sold</span>
                    <div className="flex items-center text-sm font-semibold text-emerald-600">
                      <Users size={16} className="mr-1" />
                      {ticket.sold} {ticket.quantity ? `/ ${ticket.quantity}` : ''}
                    </div>
                  </div>
                  
                  {ticket.available !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Available</span>
                      <span className="text-sm font-semibold text-slate-900">{ticket.available}</span>
                    </div>
                  )}
                  
                  {!ticket.quantity && (
                    <div className="text-xs text-slate-500 text-center pt-2">
                      Unlimited availability
                    </div>
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
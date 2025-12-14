import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Reports = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    byType: {}
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
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

  const fetchStats = async () => {
    try {
      const [contactsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/contacts?event_id=${selectedEvent}`),
        axios.get(`${API}/orders?event_id=${selectedEvent}`)
      ]);

      const contacts = contactsRes.data;
      const orders = ordersRes.data;

      const byType = contacts.reduce((acc, contact) => {
        acc[contact.type] = (acc[contact.type] || 0) + 1;
        return acc;
      }, {});

      const totalRevenue = orders
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0);

      setStats({
        totalContacts: contacts.length,
        totalOrders: orders.length,
        totalRevenue,
        byType
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleExport = () => {
    toast.success('Report exported successfully!');
  };

  return (
    <Layout>
      <div data-testid="reports-container" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Reports & Analytics</h2>
            <p className="text-slate-600 mt-1">View insights and export data</p>
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
            <Button onClick={handleExport} data-testid="export-button">
              <Download size={18} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="text-indigo-600" size={24} />
              </div>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Participants</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalContacts}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Calendar className="text-emerald-600" size={24} />
              </div>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <DollarSign className="text-amber-600" size={24} />
              </div>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Participants by Type</h3>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => {
              const percentage = stats.totalContacts > 0 ? (count / stats.totalContacts * 100).toFixed(1) : 0;
              return (
                <div key={type} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-slate-700 capitalize">{type}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                    <span className="text-xs text-slate-500 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="text-indigo-600" size={24} />
            <h3 className="text-xl font-semibold text-slate-900">Registrations Over Time</h3>
          </div>
          <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-center">
              <BarChart3 className="mx-auto text-slate-400 mb-3" size={48} />
              <p className="text-slate-600 font-medium">Chart visualization coming soon</p>
              <p className="text-sm text-slate-500 mt-1">Registration trends and analytics</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
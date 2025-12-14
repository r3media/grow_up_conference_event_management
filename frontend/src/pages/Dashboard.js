import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Calendar, Users, CreditCard, IdCard, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    events: 0,
    contacts: 0,
    orders: 0,
    badges: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [eventsRes, contactsRes, ordersRes, badgesRes] = await Promise.all([
        axios.get(`${API}/events`),
        axios.get(`${API}/contacts`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/badge-templates`)
      ]);

      setStats({
        events: eventsRes.data.length,
        contacts: contactsRes.data.length,
        orders: ordersRes.data.length,
        badges: badgesRes.data.length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Events', value: stats.events, icon: Calendar, color: 'bg-indigo-500', link: '/events' },
    { name: 'Total Contacts', value: stats.contacts, icon: Users, color: 'bg-emerald-500', link: '/contacts' },
    { name: 'Total Orders', value: stats.orders, icon: CreditCard, color: 'bg-amber-500', link: '/orders' },
    { name: 'Badge Templates', value: stats.badges, icon: IdCard, color: 'bg-purple-500', link: '/badge-designer' },
  ];

  return (
    <Layout>
      <div data-testid="dashboard-container" className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600 mt-1">Overview of your event management platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                data-testid={`stat-card-${stat.name.toLowerCase().replace(' ', '-')}`}
                onClick={() => navigate(stat.link)}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <TrendingUp className="text-emerald-500" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              data-testid="quick-action-create-event"
              onClick={() => navigate('/events')}
              className="h-auto py-4"
            >
              <Calendar className="mr-2" size={20} />
              Create New Event
            </Button>
            <Button
              data-testid="quick-action-add-contact"
              onClick={() => navigate('/contacts')}
              variant="secondary"
              className="h-auto py-4"
            >
              <Users className="mr-2" size={20} />
              Add Contact
            </Button>
            <Button
              data-testid="quick-action-design-badge"
              onClick={() => navigate('/badge-designer')}
              variant="secondary"
              className="h-auto py-4"
            >
              <IdCard className="mr-2" size={20} />
              Design Badge
            </Button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Welcome to EventPass</h3>
          <p className="text-indigo-100 mb-6">
            Your all-in-one platform for managing conferences and expos. Start by creating your first event or designing custom badges.
          </p>
          <Button
            data-testid="get-started-button"
            onClick={() => navigate('/badge-designer')}
            variant="secondary"
          >
            Get Started with Badge Designer
          </Button>
        </div>
      </div>
    </Layout>
  );
};
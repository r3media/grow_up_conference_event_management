import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCircle, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_contacts: 0,
    total_companies: 0,
    active_events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      testId: 'stat-total-users'
    },
    {
      title: 'Total Contacts',
      value: stats.total_contacts,
      icon: UserCircle,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      testId: 'stat-total-contacts'
    },
    {
      title: 'Total Companies',
      value: stats.total_companies,
      icon: Building2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      testId: 'stat-total-companies'
    },
    {
      title: 'Active Events',
      value: stats.active_events,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      testId: 'stat-active-events'
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your conference overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border border-border hover:border-primary/50 transition-colors duration-300"
              data-testid={stat.testId}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Welcome Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Manage Your Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Add team members and assign roles to control access to different sections.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Add Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    Build your contact database with speakers, attendees, and partners.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create Events</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up your conferences and manage all aspects from one place.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/contacts'}
                className="w-full px-4 py-3 text-left rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-medium"
                data-testid="quick-action-add-contact"
              >
                + Add New Contact
              </button>
              <button
                onClick={() => window.location.href = '/companies'}
                className="w-full px-4 py-3 text-left rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors text-sm font-medium"
                data-testid="quick-action-add-company"
              >
                + Add New Company
              </button>
              <button
                onClick={() => window.location.href = '/users'}
                className="w-full px-4 py-3 text-left rounded-md bg-accent/10 hover:bg-accent/20 transition-colors text-sm font-medium"
                data-testid="quick-action-add-user"
              >
                + Add New User
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

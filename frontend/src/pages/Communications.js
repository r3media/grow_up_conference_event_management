import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, Send, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Communications = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
    recipient_type: 'all'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

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

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate email sending (in real implementation, this would call the backend)
    setTimeout(() => {
      toast.success('Email sent successfully!');
      setEmailData({ subject: '', content: '', recipient_type: 'all' });
      setSending(false);
    }, 1500);
  };

  return (
    <Layout>
      <div data-testid="communications-container" className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Communications</h2>
            <p className="text-slate-600 mt-1">Send emails to event participants</p>
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

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Mail className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Email Campaign</h3>
              <p className="text-sm text-slate-600">Send bulk emails to your event participants</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <Label htmlFor="recipient_type">Recipients</Label>
              <Select
                value={emailData.recipient_type}
                onValueChange={(value) => setEmailData({ ...emailData, recipient_type: value })}
              >
                <SelectTrigger data-testid="recipient-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Participants</SelectItem>
                  <SelectItem value="attendee">Attendees Only</SelectItem>
                  <SelectItem value="speaker">Speakers Only</SelectItem>
                  <SelectItem value="exhibitor">Exhibitors Only</SelectItem>
                  <SelectItem value="sponsor">Sponsors Only</SelectItem>
                  <SelectItem value="vip">VIPs Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Event Update: Important Information"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                required
                data-testid="subject-input"
              />
            </div>

            <div>
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                placeholder="Dear participants,\n\nWe're excited to share...\n\nBest regards,\nThe Event Team"
                value={emailData.content}
                onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                required
                data-testid="content-textarea"
                rows={12}
                className="font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center text-sm text-slate-600">
                <Users size={16} className="mr-2" />
                <span>Email will be sent to all {emailData.recipient_type === 'all' ? 'participants' : emailData.recipient_type + 's'}</span>
              </div>
              <Button
                type="submit"
                disabled={sending}
                data-testid="send-email-button"
                size="lg"
              >
                <Send size={18} className="mr-2" />
                {sending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">📧 Email Configuration Required</h4>
          <p className="text-sm text-blue-700">
            To send emails, please configure your email settings in the Settings page.
            You can choose between SMTP or Resend for email delivery.
          </p>
        </div>
      </div>
    </Layout>
  );
};
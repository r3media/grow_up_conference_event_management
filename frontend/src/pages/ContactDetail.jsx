import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineEdit } from '@/components/InlineEdit';
import { ArrowLeft, Mail, Phone, Building2, Tag, Briefcase, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchContact();
    fetchCompanies();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await axios.get(`${API}/contacts/${id}`, getAuthHeaders());
      setContact(response.data);
    } catch (error) {
      toast.error('Contact not found');
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`, getAuthHeaders());
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to load companies');
    }
  };

  const updateContact = async (updates) => {
    try {
      await axios.put(`${API}/contacts/${id}`, updates, getAuthHeaders());
      toast.success('Contact updated');
      fetchContact();
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `${API}/contacts/${id}/photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Photo uploaded');
      fetchContact();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await axios.delete(`${API}/contacts/${id}/photo`, getAuthHeaders());
      toast.success('Photo deleted');
      fetchContact();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="space-y-6" data-testid="contact-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contacts')} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group">
            <Avatar className="w-20 h-20">
              {contact.photo_url ? (
                <AvatarImage src={`${BACKEND_URL}${contact.photo_url}`} alt={contact.name} />
              ) : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                {contact.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Label htmlFor="contact-photo-upload" className="cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </Label>
              <Input
                id="contact-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </div>
            {contact.photo_url && (
              <button
                onClick={handleDeletePhoto}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{contact.name}</h1>
            {contact.position && (
              <p className="text-muted-foreground mt-1">{contact.position}</p>
            )}
            {contact.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <InlineEdit
                  value={contact.name}
                  onSave={(v) => updateContact({ name: v })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={contact.email}
                    onSave={(v) => updateContact({ email: v })}
                    type="email"
                    placeholder="Enter email"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={contact.phone}
                    onSave={(v) => updateContact({ phone: v })}
                    placeholder="Enter phone"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={contact.position}
                    onSave={(v) => updateContact({ position: v })}
                    placeholder="Enter position"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <InlineEdit
                  value={contact.company_id}
                  onSave={(v) => updateContact({ company_id: v })}
                  type="select"
                  options={companies.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select company"
                />
                {contact.company_name && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => navigate(`/companies/${contact.company_id}`)}
                  >
                    View Company
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tags</label>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <InlineEdit
                  value={contact.tags?.join(', ')}
                  onSave={(v) => updateContact({ tags: v.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Enter tags (comma-separated)"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <InlineEdit
                value={contact.notes}
                onSave={(v) => updateContact({ notes: v })}
                placeholder="Add notes..."
                multiline
              />
            </div>
          </CardContent>
        </Card>

        {/* Company & Activity */}
        <div className="space-y-6">
          {/* Company Card */}
          {contact.company_name && (
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => navigate(`/companies/${contact.company_id}`)}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{contact.company_name}</p>
                    <p className="text-xs text-muted-foreground">View company details</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm mt-1">
                  {new Date(contact.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm mt-1">
                  {new Date(contact.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Placeholder for future stats */}
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm text-muted-foreground">Coming soon:</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Orders placed</p>
                  <p>• Panels participated</p>
                  <p>• Lifetime value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

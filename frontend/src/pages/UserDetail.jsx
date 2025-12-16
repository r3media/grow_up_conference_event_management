import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineEdit, InlineEditBlock } from '@/components/InlineEdit';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Tag, Camera, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const roles = ['Super Admin', 'Event Manager', 'Conference Manager', 'Registration Manager', 'Staff'];
const provinces = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeaders());
      const foundUser = response.data.find(u => u.id === id);
      if (foundUser) {
        setUser(foundUser);
      } else {
        toast.error('User not found');
        navigate('/users');
      }
    } catch (error) {
      toast.error('Failed to load user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates) => {
    try {
      await axios.put(`${API}/users/${id}`, updates, getAuthHeaders());
      toast.success('User updated');
      fetchUser();
    } catch (error) {
      toast.error('Failed to update user');
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
        `${API}/users/${id}/photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Photo uploaded');
      fetchUser();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await axios.delete(`${API}/users/${id}/photo`, getAuthHeaders());
      toast.success('Photo deleted');
      fetchUser();
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

  if (!user) return null;

  const getRoleBadgeColor = (role) => {
    const colors = {
      'Super Admin': 'bg-accent text-accent-foreground',
      'Event Manager': 'bg-primary text-primary-foreground',
      'Conference Manager': 'bg-secondary text-secondary-foreground',
      'Registration Manager': 'bg-blue-500 text-white',
      'Staff': 'bg-muted text-muted-foreground',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6" data-testid="user-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group">
            <Avatar className="w-20 h-20">
              {user.photo_url ? (
                <AvatarImage src={`${BACKEND_URL}${user.photo_url}`} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </div>
            {user.photo_url && (
              <button
                onClick={handleDeletePhoto}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.is_active ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <InlineEdit
                  value={user.name}
                  onSave={(v) => updateUser({ name: v })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={user.email}
                    onSave={(v) => updateUser({ email: v })}
                    type="email"
                    placeholder="Enter email"
                  />
                  {user.email && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => navigate(`/email/compose?to=${encodeURIComponent(user.email)}`)}
                          >
                            <Send className="w-3.5 h-3.5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send email</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mobile Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={user.mobile_phone}
                    onSave={(v) => updateUser({ mobile_phone: v })}
                    placeholder="Enter phone"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <InlineEdit
                  value={user.role}
                  onSave={(v) => updateUser({ role: v })}
                  type="select"
                  options={roles.map(r => ({ value: r, label: r }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={user.job_title}
                    onSave={(v) => updateUser({ job_title: v })}
                    placeholder="Enter job title"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <InlineEdit
                  value={user.department}
                  onSave={(v) => updateUser({ department: v })}
                  placeholder="Enter department"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Tags</label>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <InlineEdit
                  value={user.tags?.join(', ')}
                  onSave={(v) => updateUser({ tags: v.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Enter tags (comma-separated)"
                />
              </div>
            </div>

            {/* Address Block */}
            <div className="border-t pt-4">
              <InlineEditBlock
                title="Address"
                fields={[
                  { key: 'street', label: 'Street', value: user.address?.street, placeholder: 'Street address' },
                  { key: 'city', label: 'City', value: user.address?.city, placeholder: 'City' },
                  { key: 'province', label: 'Province', value: user.address?.province, type: 'select', options: provinces.map(p => ({ value: p, label: p })) },
                  { key: 'postal_code', label: 'Postal Code', value: user.address?.postal_code, placeholder: 'A1A 1A1' },
                ]}
                onSave={(values) => updateUser({ address: { ...user.address, ...values, country: 'Canada' } })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-sm mt-1">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-sm mt-1">
                {new Date(user.updated_at).toLocaleDateString('en-US', {
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
                <p>• Orders managed</p>
                <p>• Panels moderated</p>
                <p>• Events participated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineEdit, InlineEditBlock } from '@/components/InlineEdit';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Globe, Building2, MapPin, Mail, Phone, Pencil, Plus, MoreVertical, Trash2, Calendar, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const provinces = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];

// Inline editable exhibit history component
function ExhibitHistoryEditor({ value = [], options = [], onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(value);

  const handleSave = () => {
    onSave(selected);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelected(value);
    setIsEditing(false);
  };

  const toggleItem = (item) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(s => s !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Exhibit History
          </label>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center space-x-2">
              <Checkbox
                id={`exhibit-edit-${opt.id}`}
                checked={selected.includes(opt.category_name)}
                onCheckedChange={() => toggleItem(opt.category_name)}
              />
              <label htmlFor={`exhibit-edit-${opt.id}`} className="text-sm cursor-pointer">
                {opt.category_name}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Exhibit History
        </label>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((item, i) => (
            <span key={i} className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">No exhibit history</p>
      )}
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exhibitHistoryOptions, setExhibitHistoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    fetchCompanyDetails();
    fetchCompanyContacts();
    fetchCategories();
    fetchExhibitHistoryOptions();
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await axios.get(`${API}/companies/${id}`, getAuthHeaders());
      setCompany(response.data);
    } catch (error) {
      toast.error('Failed to load company details');
      navigate('/companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyContacts = async () => {
    try {
      const response = await axios.get(`${API}/companies/${id}/contacts`, getAuthHeaders());
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to load contacts');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/settings/categories?category_type=business_category`, getAuthHeaders());
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchExhibitHistoryOptions = async () => {
    try {
      const response = await axios.get(`${API}/settings/categories?category_type=exhibit_history`, getAuthHeaders());
      setExhibitHistoryOptions(response.data);
    } catch (error) {
      console.error('Failed to load exhibit history options');
    }
  };

  const updateCompany = async (updates) => {
    try {
      await axios.put(`${API}/companies/${id}`, updates, getAuthHeaders());
      toast.success('Company updated');
      fetchCompanyDetails();
    } catch (error) {
      toast.error('Failed to update company');
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      company_id: id,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    };

    try {
      if (selectedContact) {
        await axios.put(`${API}/contacts/${selectedContact.id}`, submitData, getAuthHeaders());
        toast.success('Contact updated successfully');
      } else {
        await axios.post(`${API}/contacts`, submitData, getAuthHeaders());
        toast.success('Contact added successfully');
      }

      setContactDialogOpen(false);
      resetContactForm();
      fetchCompanyDetails();
      fetchCompanyContacts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      await axios.delete(`${API}/contacts/${selectedContact.id}`, getAuthHeaders());
      toast.success('Contact deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedContact(null);
      fetchCompanyDetails();
      fetchCompanyContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const resetContactForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      tags: '',
      notes: '',
    });
    setSelectedContact(null);
  };

  const openEditContactDialog = (contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      tags: contact.tags?.join(', ') || '',
      notes: contact.notes || '',
    });
    setContactDialogOpen(true);
  };

  const openDeleteContactDialog = (contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="company-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/companies')} data-testid="back-button">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{company.name}</h1>
            {company.category && (
              <span className="px-3 py-1 rounded-full text-sm bg-secondary/10 text-secondary font-medium mt-2 inline-block">
                {company.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={company.name}
                    onSave={(v) => updateCompany({ name: v })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website</label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <InlineEdit
                    value={company.website}
                    onSave={(v) => updateCompany({ website: v })}
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <InlineEdit
                value={company.category}
                onSave={(v) => updateCompany({ category: v })}
                type="select"
                options={categories.map(c => ({ value: c.category_name, label: c.category_name }))}
                placeholder="Select category"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <InlineEdit
                value={company.description}
                onSave={(v) => updateCompany({ description: v })}
                placeholder="Add company description..."
                multiline
              />
            </div>

            {/* Exhibit History */}
            <ExhibitHistoryEditor
              value={company.exhibit_history || []}
              options={exhibitHistoryOptions}
              onSave={(values) => updateCompany({ exhibit_history: values })}
            />

            {/* Address Block */}
            <div className="border-t pt-4">
              <InlineEditBlock
                title="Address"
                fields={[
                  { key: 'street', label: 'Street', value: company.address?.street, placeholder: 'Street address' },
                  { key: 'city', label: 'City', value: company.address?.city, placeholder: 'City' },
                  { key: 'province', label: 'Province', value: company.address?.province, type: 'select', options: provinces.map(p => ({ value: p, label: p })) },
                  { key: 'postal_code', label: 'Postal Code', value: company.address?.postal_code, placeholder: 'A1A 1A1' },
                ]}
                onSave={(values) => updateCompany({ address: { ...company.address, ...values, country: 'Canada' } })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Contacts</label>
              <p className="text-3xl font-bold mt-1">{company.contacts_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm mt-1">
                {new Date(company.created_at).toLocaleDateString('en-US', {
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
                <p>• Total orders</p>
                <p>• Lifetime value</p>
                <p>• Events participated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts ({contacts.length})</CardTitle>
            <Dialog
              open={contactDialogOpen}
              onOpenChange={(open) => {
                setContactDialogOpen(open);
                if (!open) resetContactForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="add-contact-to-company-button">
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="company-contact-dialog">
                <DialogHeader>
                  <DialogTitle>
                    {selectedContact ? 'Edit Contact' : 'Add New Contact'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedContact
                      ? 'Update contact information.'
                      : `Add a new contact to ${company?.name}.`}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="company-contact-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        data-testid="company-contact-email-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        data-testid="company-contact-phone-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        data-testid="company-contact-position-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="speaker, vip, sponsor"
                      data-testid="company-contact-tags-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      data-testid="company-contact-notes-input"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setContactDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="company-contact-submit-button">
                      {selectedContact ? 'Update' : 'Add Contact'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found for this company
            </div>
          ) : (
            <Table data-testid="company-contacts-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {contact.photo_url ? (
                            <AvatarImage src={`${BACKEND_URL}${contact.photo_url}`} alt={contact.name} />
                          ) : null}
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                            {contact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                          className="font-medium text-primary hover:underline text-left"
                          data-testid={`company-contact-name-link-${contact.id}`}
                        >
                          {contact.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {contact.email}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm">{contact.position || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.length > 0 ? (
                          contact.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`company-contact-actions-${contact.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditContactDialog(contact)}
                            data-testid={`edit-company-contact-${contact.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteContactDialog(contact)}
                            className="text-destructive"
                            data-testid={`delete-company-contact-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Contact Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-company-contact-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact <strong>{selectedContact?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-destructive text-destructive-foreground"
              data-testid="confirm-delete-company-contact"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreVertical, Pencil, Trash2, Mail, Phone, Building2, Search } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function ContactManagement() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_id: '',
    position: '',
    tags: '',
    notes: '',
  });
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
  });

  useEffect(() => {
    fetchContacts();
    fetchCompanies();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      const response = await axios.get(`${API}/contacts?${params.toString()}`, getAuthHeaders());
      setContacts(response.data);
    } catch (error) {
      toast.error('Failed to load contacts');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_id) {
      toast.error('Please select a company');
      return;
    }

    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    };
    
    try {
      if (selectedContact) {
        await axios.put(`${API}/contacts/${selectedContact.id}`, submitData, getAuthHeaders());
        toast.success('Contact updated successfully');
      } else {
        await axios.post(`${API}/contacts`, submitData, getAuthHeaders());
        toast.success('Contact created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchContacts();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API}/companies`, newCompanyData, getAuthHeaders());
      toast.success('Company created successfully');
      setCompanyDialogOpen(false);
      // Auto-select the newly created company
      setFormData({ ...formData, company_id: response.data.id });
      await fetchCompanies();
      resetNewCompanyForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create company');
    }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    
    try {
      await axios.delete(`${API}/contacts/${selectedContact.id}`, getAuthHeaders());
      toast.success('Contact deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedContact(null);
      fetchContacts();
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_id: '',
      position: '',
      tags: '',
      notes: '',
    });
    setSelectedContact(null);
  };

  const resetNewCompanyForm = () => {
    setNewCompanyData({
      name: '',
      website: '',
      industry: '',
      description: '',
    });
  };

  const openEditDialog = (contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      company_id: contact.company_id || '',
      position: contact.position || '',
      tags: contact.tags?.join(', ') || '',
      notes: contact.notes || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="contact-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your conference contacts and attendees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-contact-button">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="contact-dialog">
            <DialogHeader>
              <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
              <DialogDescription>
                {selectedContact ? 'Update contact details and information.' : 'Add a new contact to your conference database.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="contact-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="contact-email-input"
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
                    data-testid="contact-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    data-testid="contact-position-input"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Company *</Label>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    onClick={() => setCompanyDialogOpen(true)}
                    className="text-primary h-auto p-0"
                  >
                    + Create New Company
                  </Button>
                </div>
                <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={companySearchOpen}
                      className="w-full justify-between"
                      data-testid="contact-company-select"
                    >
                      {formData.company_id
                        ? companies.find((c) => c.id === formData.company_id)?.name
                        : "Select company..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search company..." />
                      <CommandEmpty>No company found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {companies
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setFormData({ ...formData, company_id: company.id });
                              setCompanySearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.company_id === company.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="speaker, vip, sponsor"
                  data-testid="contact-tags-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="contact-notes-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="contact-submit-button">
                  {selectedContact ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Company Creation Dialog */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent data-testid="quick-company-dialog">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Quickly add a new company to your database
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                required
                data-testid="quick-company-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <Input
                  id="company-website"
                  type="url"
                  value={newCompanyData.website}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-industry">Industry</Label>
                <Input
                  id="company-industry"
                  value={newCompanyData.industry}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, industry: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setCompanyDialogOpen(false);
                resetNewCompanyForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Company</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="contact-search-input"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No contacts found</div>
          ) : (
            <Table data-testid="contacts-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} data-testid={`contact-row-${contact.id}`}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {contact.email}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.company_name ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {contact.company_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`contact-actions-${contact.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(contact)} data-testid={`edit-contact-${contact.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(contact)}
                            className="text-destructive"
                            data-testid={`delete-contact-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-contact-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact <strong>{selectedContact?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-contact">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

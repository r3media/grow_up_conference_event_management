import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Pencil, Trash2, Mail, Phone, Building2, Search, ArrowUp, ArrowDown, Camera, X, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnCustomizer, useColumnPreferences } from '@/components/ColumnCustomizer';
import { COUNTRIES, getProvincesForCountry, getProvinceLabel, getPostalCodeLabel, getPostalCodePlaceholder } from '@/lib/addressData';
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Define all available columns
const ALL_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'tags', label: 'Tags', sortable: false },
  { key: 'notes', label: 'Notes', sortable: false },
];

const DEFAULT_COLUMNS = ['name', 'email', 'phone', 'company', 'position'];

export default function ContactManagement() {
  const navigate = useNavigate();
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
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_id: '',
    position: '',
    tags: '',
    notes: '',
    address: {
      street: '',
      city: '',
      province: 'Ontario',
      postal_code: '',
      country: 'Canada'
    }
  });
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
  });

  const { visibleColumns, toggleColumn, resetColumns } = useColumnPreferences(
    'contact_columns',
    DEFAULT_COLUMNS
  );

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
      let contactId;
      if (selectedContact) {
        await axios.put(`${API}/contacts/${selectedContact.id}`, submitData, getAuthHeaders());
        contactId = selectedContact.id;
        toast.success('Contact updated successfully');
      } else {
        const response = await axios.post(`${API}/contacts`, submitData, getAuthHeaders());
        contactId = response.data.id;
        toast.success('Contact created successfully');
      }
      
      if (photoFile && contactId) {
        await uploadPhoto(contactId);
      }
      
      setDialogOpen(false);
      resetForm();
      fetchContacts();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (contactId) => {
    if (!photoFile) return;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      
      await axios.post(
        `${API}/contacts/${contactId}/photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const clearPhotoSelection = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API}/companies`, newCompanyData, getAuthHeaders());
      toast.success('Company created successfully');
      setCompanyDialogOpen(false);
      resetNewCompanyForm();
      await fetchCompanies();
      setFormData({ ...formData, company_id: response.data.id });
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
      address: {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      }
    });
    setSelectedContact(null);
    setPhotoFile(null);
    setPhotoPreview(null);
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
      address: contact.address || {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      }
    });
    setPhotoFile(null);
    setPhotoPreview(contact.photo_url ? `${BACKEND_URL}${contact.photo_url}` : null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getCellValue = (contact, key) => {
    switch (key) {
      case 'company':
        return contact.company_name ? (
          <button
            onClick={() => navigate(`/companies/${contact.company_id}`)}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <Building2 className="w-4 h-4" />
            {contact.company_name}
          </button>
        ) : '-';
      case 'email':
        return contact.email ? (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            {contact.email}
          </div>
        ) : '-';
      case 'phone':
        return contact.phone ? (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {contact.phone}
          </div>
        ) : '-';
      case 'city':
        return contact.address?.city || '-';
      case 'tags':
        return contact.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                {tag}
              </span>
            ))}
            {contact.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{contact.tags.length - 2}</span>
            )}
          </div>
        ) : '-';
      case 'notes':
        return contact.notes ? (
          <span className="truncate max-w-[200px] block text-sm text-muted-foreground">
            {contact.notes}
          </span>
        ) : '-';
      default:
        return contact[key] || '-';
    }
  };

  const SortableHeader = ({ column, children }) => {
    const colDef = ALL_COLUMNS.find(c => c.key === column);
    if (!colDef?.sortable) {
      return <TableHead>{children}</TableHead>;
    }

    return (
      <TableHead>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 font-semibold -ml-3"
          onClick={() => handleSort(column)}
        >
          {children}
          {sortBy === column && (
            sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </TableHead>
    );
  };

  const selectedCompany = companies.find(c => c.id === formData.company_id);

  return (
    <div className="space-y-6" data-testid="contact-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage attendees, speakers, and partners</p>
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
          <DialogContent className="max-w-2xl" data-testid="contact-dialog">
            <DialogHeader>
              <DialogTitle>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
              <DialogDescription>
                {selectedContact ? 'Update contact information and details.' : 'Add a new contact to your database.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} alt="Preview" />
                    ) : (
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={clearPhotoSelection}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="contact-photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <Camera className="w-4 h-4" />
                      <span>{selectedContact?.photo_url || photoFile ? 'Change Photo' : 'Upload Photo'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF or WebP. Max 5MB.
                    </p>
                  </Label>
                  <Input
                    id="contact-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                    data-testid="contact-photo-input"
                  />
                </div>
              </div>

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
                <Label>Company *</Label>
                <div className="flex gap-2">
                  <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={companySearchOpen}
                        className="flex-1 justify-between"
                        data-testid="contact-company-combobox"
                      >
                        {selectedCompany ? selectedCompany.name : "Select a company..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search companies..." data-testid="contact-company-search" />
                        <CommandList>
                          <CommandEmpty>No company found.</CommandEmpty>
                          <CommandGroup>
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => {
                                  setFormData({ ...formData, company_id: company.id });
                                  setCompanySearchOpen(false);
                                }}
                                data-testid={`contact-company-option-${company.id}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.company_id === company.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {company.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" data-testid="create-company-button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="quick-company-dialog">
                      <DialogHeader>
                        <DialogTitle>Quick Add Company</DialogTitle>
                        <DialogDescription>
                          Create a new company to associate with this contact.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCompany} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Company Name *</Label>
                          <Input
                            id="company_name"
                            value={newCompanyData.name}
                            onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                            required
                            data-testid="quick-company-name-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_website">Website</Label>
                          <Input
                            id="company_website"
                            type="url"
                            value={newCompanyData.website}
                            onChange={(e) => setNewCompanyData({ ...newCompanyData, website: e.target.value })}
                            placeholder="https://example.com"
                            data-testid="quick-company-website-input"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setCompanyDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" data-testid="quick-company-submit-button">
                            Create
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, company, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="contact-search-input"
              />
            </div>
            <ColumnCustomizer
              allColumns={ALL_COLUMNS}
              visibleColumns={visibleColumns}
              onToggle={toggleColumn}
              onReset={resetColumns}
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
                  {visibleColumns.includes('name') && (
                    <SortableHeader column="name">Name</SortableHeader>
                  )}
                  {visibleColumns.filter(c => c !== 'name').map((col) => (
                    <SortableHeader key={col} column={col}>
                      {ALL_COLUMNS.find(c => c.key === col)?.label || col}
                    </SortableHeader>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} data-testid={`contact-row-${contact.id}`}>
                    {visibleColumns.includes('name') && (
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
                            data-testid={`contact-name-link-${contact.id}`}
                          >
                            {contact.name}
                          </button>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.filter(c => c !== 'name').map((col) => (
                      <TableCell key={col}>{getCellValue(contact, col)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`contact-actions-${contact.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(contact)} data-testid={`edit-contact-${contact.id}`}>
                            <Pencil className="w-4 h-4" />
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(contact)}
                            className="text-destructive"
                            data-testid={`delete-contact-${contact.id}`}
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

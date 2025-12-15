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
import { Plus, MoreVertical, Pencil, Trash2, Globe, Building2, Search, Eye, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const provinces = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    category: '',
    description: '',
    address: {
      street: '',
      city: '',
      province: 'Ontario',
      postal_code: '',
      country: 'Canada'
    }
  });

  useEffect(() => {
    fetchCompanies();
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/settings/categories?category_type=business_category`, getAuthHeaders());
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/companies?${params.toString()}`, getAuthHeaders());
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyContacts = async (companyId) => {
    try {
      const response = await axios.get(`${API}/companies/${companyId}/contacts`, getAuthHeaders());
      setContacts(response.data);
    } catch (error) {
      toast.error('Failed to load company contacts');
    }
  };

  const openViewDialog = async (company) => {
    setSelectedCompany(company);
    await fetchCompanyContacts(company.id);
    setViewDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCompany) {
        await axios.put(`${API}/companies/${selectedCompany.id}`, formData, getAuthHeaders());
        toast.success('Company updated successfully');
      } else {
        await axios.post(`${API}/companies`, formData, getAuthHeaders());
        toast.success('Company created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    
    try {
      await axios.delete(`${API}/companies/${selectedCompany.id}`, getAuthHeaders());
      toast.success('Company deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      category: '',
      description: '',
      address: {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      }
    });
    setSelectedCompany(null);
  };

  const openEditDialog = (company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      website: company.website || '',
      category: company.category || '',
      description: company.description || '',
      address: company.address || {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      }
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="company-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Companies</h1>
          <p className="text-muted-foreground">Manage exhibitors, sponsors, and partner companies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-company-button">
              <Plus className="w-4 h-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="company-dialog">
            <DialogHeader>
              <DialogTitle>{selectedCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
              <DialogDescription>
                {selectedCompany ? 'Update company information and details.' : 'Add a new company to your database.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="company-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    data-testid="company-website-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology, Healthcare, etc."
                    data-testid="company-industry-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  data-testid="company-description-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="company-submit-button">
                  {selectedCompany ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by company name or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="company-search-input"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Companies ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No companies found</div>
          ) : (
            <Table data-testid="companies-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <button
                          onClick={() => window.location.href = `/companies/${company.id}`}
                          className="font-medium text-primary hover:underline text-left"
                          data-testid={`company-name-link-${company.id}`}
                        >
                          {company.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Visit Site
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.industry ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary font-medium">
                          {company.industry}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {company.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`company-actions-${company.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(company)} data-testid={`view-company-${company.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Contacts
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(company)} data-testid={`edit-company-${company.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(company)}
                            className="text-destructive"
                            data-testid={`delete-company-${company.id}`}
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
        <AlertDialogContent data-testid="delete-company-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company <strong>{selectedCompany?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-company">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Company Contacts Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl" data-testid="view-company-dialog">
          <DialogHeader>
            <DialogTitle>{selectedCompany?.name} - Contacts</DialogTitle>
            <DialogDescription>
              All contacts associated with this company ({contacts.length})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

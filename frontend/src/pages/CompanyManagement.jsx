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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Pencil, Trash2, Building2, Search, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnCustomizer, useColumnPreferences } from '@/components/ColumnCustomizer';
import { COUNTRIES, getProvincesForCountry, getProvinceLabel, getPostalCodeLabel, getPostalCodePlaceholder } from '@/lib/addressData';
import { Checkbox } from '@/components/ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Define all available columns
const ALL_COLUMNS = [
  { key: 'name', label: 'Company Name', sortable: true },
  { key: 'website', label: 'Website', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'exhibit_history', label: 'Exhibit History', sortable: false },
  { key: 'city', label: 'City', sortable: true },
  { key: 'province', label: 'Province', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'street', label: 'Street', sortable: false },
  { key: 'postal_code', label: 'Postal Code', sortable: false },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'contacts_count', label: 'Contacts', sortable: true },
];

const DEFAULT_COLUMNS = ['name', 'website', 'category', 'city', 'province'];

export default function CompanyManagement() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exhibitHistoryOptions, setExhibitHistoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [exhibitHistoryFilter, setExhibitHistoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    category: '',
    description: '',
    exhibit_history: [],
    address: {
      street: '',
      city: '',
      province: 'Ontario',
      postal_code: '',
      country: 'Canada'
    }
  });

  const { visibleColumns, toggleColumn, resetColumns } = useColumnPreferences(
    'company_columns',
    DEFAULT_COLUMNS
  );

  useEffect(() => {
    fetchCompanies();
    fetchCategories();
    fetchExhibitHistoryOptions();
  }, [searchTerm, categoryFilter, exhibitHistoryFilter, sortBy, sortOrder]);

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

  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (exhibitHistoryFilter) params.append('exhibit_history', exhibitHistoryFilter);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      const response = await axios.get(`${API}/companies?${params.toString()}`, getAuthHeaders());
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = { ...formData };
    
    if (!submitData.address.street && !submitData.address.city && !submitData.address.postal_code) {
      submitData.address = null;
    }
    
    try {
      if (selectedCompany) {
        await axios.put(`${API}/companies/${selectedCompany.id}`, submitData, getAuthHeaders());
        toast.success('Company updated successfully');
      } else {
        await axios.post(`${API}/companies`, submitData, getAuthHeaders());
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
      toast.error(error.response?.data?.detail || 'Failed to delete company');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      category: '',
      description: '',
      exhibit_history: [],
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
      exhibit_history: company.exhibit_history || [],
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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getCellValue = (company, key) => {
    switch (key) {
      case 'city':
        return company.address?.city || '-';
      case 'province':
        return company.address?.province || '-';
      case 'country':
        return company.address?.country || '-';
      case 'street':
        return company.address?.street || '-';
      case 'postal_code':
        return company.address?.postal_code || '-';
      case 'website':
        return company.website ? (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm truncate max-w-[200px] block"
          >
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        ) : '-';
      case 'exhibit_history':
        return company.exhibit_history?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {company.exhibit_history.slice(0, 2).map((event, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                {event}
              </span>
            ))}
            {company.exhibit_history.length > 2 && (
              <span className="text-xs text-muted-foreground">+{company.exhibit_history.length - 2}</span>
            )}
          </div>
        ) : '-';
      case 'category':
        return company.category ? (
          <span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary font-medium">
            {company.category}
          </span>
        ) : '-';
      case 'contacts_count':
        return company.contacts_count || 0;
      case 'description':
        return company.description ? (
          <span className="truncate max-w-[200px] block text-sm text-muted-foreground">
            {company.description}
          </span>
        ) : '-';
      default:
        return company[key] || '-';
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
                  <Label htmlFor="category">Business Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="company-category-select">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.category_name}>
                          {cat.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="company-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Exhibit History</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {exhibitHistoryOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exhibit-${opt.id}`}
                        checked={formData.exhibit_history.includes(opt.category_name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, exhibit_history: [...formData.exhibit_history, opt.category_name] });
                          } else {
                            setFormData({ ...formData, exhibit_history: formData.exhibit_history.filter(e => e !== opt.category_name) });
                          }
                        }}
                      />
                      <label htmlFor={`exhibit-${opt.id}`} className="text-sm">{opt.category_name}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Address</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={formData.address.country} 
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        address: { 
                          ...formData.address, 
                          country: value,
                          province: getProvincesForCountry(value)[0] || ''
                        }
                      })}
                    >
                      <SelectTrigger data-testid="company-address-country-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value }})}
                      data-testid="company-address-street-input"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value }})}
                        data-testid="company-address-city-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">{getProvinceLabel(formData.address.country)}</Label>
                      <Select value={formData.address.province} onValueChange={(value) => setFormData({ ...formData, address: { ...formData.address, province: value }})}>
                        <SelectTrigger data-testid="company-address-province-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvincesForCountry(formData.address.country).map((prov) => (
                            <SelectItem key={prov} value={prov}>
                              {prov}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">{getPostalCodeLabel(formData.address.country)}</Label>
                      <Input
                        id="postal_code"
                        value={formData.address.postal_code}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postal_code: e.target.value }})}
                        placeholder={getPostalCodePlaceholder(formData.address.country)}
                        data-testid="company-address-postal-input"
                      />
                    </div>
                  </div>
                </div>
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

      {/* Search, Filters and Column Customizer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="company-search-input"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="company-category-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.category_name}>{cat.category_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={exhibitHistoryFilter} onValueChange={setExhibitHistoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="company-exhibit-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Exhibit History" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exhibits</SelectItem>
                {exhibitHistoryOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.category_name}>{opt.category_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  {visibleColumns.includes('name') && (
                    <SortableHeader column="name">Company</SortableHeader>
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
                {companies.map((company) => (
                  <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                    {visibleColumns.includes('name') && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <button
                            onClick={() => navigate(`/companies/${company.id}`)}
                            className="font-medium text-primary hover:underline text-left"
                            data-testid={`company-name-link-${company.id}`}
                          >
                            {company.name}
                          </button>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.filter(c => c !== 'name').map((col) => (
                      <TableCell key={col}>{getCellValue(company, col)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`company-actions-${company.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(company)} data-testid={`edit-company-${company.id}`}>
                            <Pencil className="w-4 h-4" />
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(company)}
                            className="text-destructive"
                            data-testid={`delete-company-${company.id}`}
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
    </div>
  );
}

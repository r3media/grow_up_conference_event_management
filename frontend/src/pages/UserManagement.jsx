import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreVertical, Pencil, Trash2, Search, Filter, ArrowUp, ArrowDown, Camera, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ColumnCustomizer, useColumnPreferences } from '@/components/ColumnCustomizer';
import { COUNTRIES, getProvincesForCountry, getProvinceLabel, getPostalCodeLabel, getPostalCodePlaceholder } from '@/lib/addressData';
import EmailLink from '@/components/EmailLink';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const roles = ['Super Admin', 'Event Manager', 'Conference Manager', 'Registration Manager', 'Staff'];

// Define all available columns
const ALL_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'job_title', label: 'Job Title', sortable: true },
  { key: 'mobile_phone', label: 'Mobile Phone', sortable: false },
  { key: 'city', label: 'City', sortable: true },
  { key: 'province', label: 'Province', sortable: true },
  { key: 'street', label: 'Street', sortable: false },
  { key: 'postal_code', label: 'Postal Code', sortable: false },
  { key: 'tags', label: 'Tags', sortable: false },
  { key: 'is_active', label: 'Status', sortable: true },
];

const DEFAULT_COLUMNS = ['name', 'email', 'role', 'department', 'is_active'];

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    mobile_phone: '',
    job_title: '',
    department: '',
    tags: '',
    address: {
      street: '',
      city: '',
      province: 'Ontario',
      postal_code: '',
      country: 'Canada'
    },
    password: '',
    is_active: true,
  });

  const { visibleColumns, toggleColumn, resetColumns } = useColumnPreferences(
    'user_columns',
    DEFAULT_COLUMNS
  );

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [searchTerm, sortBy, sortOrder, roleFilter, departmentFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      if (roleFilter) params.append('role', roleFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      
      const response = await axios.get(`${API}/users?${params.toString()}`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeaders());
      const depts = [...new Set(response.data.map(u => u.department).filter(Boolean))];
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    };

    if (!submitData.address.street && !submitData.address.city && !submitData.address.postal_code) {
      submitData.address = null;
    }
    
    try {
      let userId;
      if (selectedUser) {
        const updateData = { ...submitData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`${API}/users/${selectedUser.id}`, updateData, getAuthHeaders());
        userId = selectedUser.id;
        toast.success('User updated successfully');
      } else {
        const response = await axios.post(`${API}/users`, submitData, getAuthHeaders());
        userId = response.data.id;
        toast.success('User created successfully');
      }
      
      if (photoFile && userId) {
        await uploadPhoto(userId);
      }
      
      setDialogOpen(false);
      resetForm();
      fetchUsers();
      fetchDepartments();
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

  const uploadPhoto = async (userId) => {
    if (!photoFile) return;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      
      await axios.post(
        `${API}/users/${userId}/photo`,
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

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`${API}/users/${selectedUser.id}`, getAuthHeaders());
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Staff',
      mobile_phone: '',
      job_title: '',
      department: '',
      tags: '',
      address: {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      },
      password: '',
      is_active: true,
    });
    setSelectedUser(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      mobile_phone: user.mobile_phone || '',
      job_title: user.job_title || '',
      department: user.department || '',
      tags: user.tags?.join(', ') || '',
      address: user.address || {
        street: '',
        city: '',
        province: 'Ontario',
        postal_code: '',
        country: 'Canada'
      },
      password: '',
      is_active: user.is_active,
    });
    setPhotoFile(null);
    setPhotoPreview(user.photo_url ? `${BACKEND_URL}${user.photo_url}` : null);
    setDialogOpen(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
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

  const getCellValue = (user, key) => {
    switch (key) {
      case 'email':
        return <EmailLink email={user.email} />;
      case 'city':
        return user.address?.city || '-';
      case 'province':
        return user.address?.province || '-';
      case 'street':
        return user.address?.street || '-';
      case 'postal_code':
        return user.address?.postal_code || '-';
      case 'role':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        );
      case 'is_active':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.is_active ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        );
      case 'tags':
        return user.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {user.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                {tag}
              </span>
            ))}
            {user.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{user.tags.length - 2}</span>
            )}
          </div>
        ) : '-';
      default:
        return user[key] || '-';
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
    <div className="space-y-6" data-testid="user-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage staff accounts and permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-user-button">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="user-dialog">
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Update user information and access level.' : 'Create a new staff member account.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} alt="Preview" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
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
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <Camera className="w-4 h-4" />
                      <span>{selectedUser?.photo_url || photoFile ? 'Change Photo' : 'Upload Photo'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF or WebP. Max 5MB.
                    </p>
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                    data-testid="user-photo-input"
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
                    data-testid="user-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="user-email-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{selectedUser ? 'New Password' : 'Password *'}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!selectedUser}
                      placeholder={selectedUser ? 'Leave blank to keep current' : ''}
                      className="pr-10"
                      data-testid="user-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="password-visibility-toggle"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} data-testid="user-role-select">
                    <SelectTrigger data-testid="user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile_phone">Mobile Phone</Label>
                  <Input
                    id="mobile_phone"
                    value={formData.mobile_phone}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    data-testid="user-mobile-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    data-testid="user-job-title-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    data-testid="user-department-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="admin, manager"
                    data-testid="user-tags-input"
                  />
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
                      <SelectTrigger data-testid="user-address-country-select">
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
                      data-testid="user-address-street-input"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value }})}
                        data-testid="user-address-city-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">{getProvinceLabel(formData.address.country)}</Label>
                      <Select value={formData.address.province} onValueChange={(value) => setFormData({ ...formData, address: { ...formData.address, province: value }})}>
                        <SelectTrigger data-testid="user-address-province-select">
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
                        data-testid="user-address-postal-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    data-testid="user-active-switch"
                  />
                  <Label htmlFor="is_active">Active account</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="user-submit-button">
                    {selectedUser ? 'Update' : 'Create'}
                  </Button>
                </div>
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
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="user-search-input"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="user-role-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
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
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <Table data-testid="users-table">
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
                {users.map((user) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    {visibleColumns.includes('name') && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {user.photo_url ? (
                              <AvatarImage src={`${BACKEND_URL}${user.photo_url}`} alt={user.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <button
                              onClick={() => navigate(`/users/${user.id}`)}
                              className="font-medium text-primary hover:underline text-left"
                              data-testid={`user-name-link-${user.id}`}
                            >
                              {user.name}
                            </button>
                            {user.mobile_phone && (
                              <div className="text-xs text-muted-foreground">{user.mobile_phone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.filter(c => c !== 'name').map((col) => (
                      <TableCell key={col}>{getCellValue(user, col)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/users/${user.id}`)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openDeleteDialog(user)}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-user-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{selectedUser?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-user">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

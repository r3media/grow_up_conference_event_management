import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, GripVertical, ArrowLeft, Pencil, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

function SortableRow({ category, onEdit, onDelete, onSave, onCancel, editingId, editValue, setEditValue }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === category.id;

  return (
    <TableRow ref={setNodeRef} style={style} data-testid={`category-row-${category.id}`}>
      <TableCell className="w-12">
        <button {...attributes} {...listeners} className="cursor-move p-2 hover:bg-muted rounded">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
        ) : (
          <button
            onClick={() => onEdit(category)}
            className="font-medium text-primary hover:underline text-left"
            data-testid={`category-name-link-${category.id}`}
          >
            {category.category_name}
          </button>
        )}
      </TableCell>
      <TableCell className="text-center text-muted-foreground">{category.display_order}</TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onSave}
              className="h-8 w-8 text-secondary"
              data-testid="save-category"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 text-destructive"
              data-testid="cancel-edit-category"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(category)}
              className="h-8 w-8"
              data-testid={`edit-category-${category.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(category)}
              className="h-8 w-8 text-destructive hover:text-destructive"
              data-testid={`delete-category-${category.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [sortBy, setSortBy] = useState('category_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Determine category type from URL
  const categoryType = window.location.pathname.includes('exhibit_history') ? 'exhibit_history' : 'business_category';
  const pageTitle = categoryType === 'exhibit_history' ? 'Exhibit History' : 'Business Categories';
  const pageDescription = categoryType === 'exhibit_history' 
    ? 'Manage exhibit/event history options for companies'
    : 'Manage business categories for company classification';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, [sortBy, sortOrder, categoryType]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API}/settings/categories?category_type=${categoryType}`,
        getAuthHeaders()
      );
      let sorted = [...response.data];
      sorted.sort((a, b) => {
        if (sortBy === 'category_name') {
          return sortOrder === 'asc' 
            ? a.category_name.localeCompare(b.category_name)
            : b.category_name.localeCompare(a.category_name);
        } else {
          return sortOrder === 'asc'
            ? a.display_order - b.display_order
            : b.display_order - a.display_order;
        }
      });
      setCategories(sorted);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // Update display_order for all affected categories
      try {
        await Promise.all(
          newCategories.map((cat, index) =>
            axios.put(
              `${API}/settings/categories/${cat.id}`,
              { display_order: index },
              getAuthHeaders()
            )
          )
        );
        toast.success('Order updated');
      } catch (error) {
        toast.error('Failed to update order');
        fetchCategories();
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API}/settings/categories`,
        {
          category_type: categoryType,
          category_name: newCategoryName,
          display_order: categories.length,
          is_active: true,
        },
        getAuthHeaders()
      );
      toast.success(`${categoryType === 'exhibit_history' ? 'Exhibit' : 'Category'} created successfully`);
      setDialogOpen(false);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditValue(category.category_name);
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `${API}/settings/categories/${editingId}`,
        { category_name: editValue },
        getAuthHeaders()
      );
      toast.success('Category updated successfully');
      setEditingId(null);
      setEditValue('');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await axios.delete(
        `${API}/settings/categories/${selectedCategory.id}`,
        getAuthHeaders()
      );
      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const openDeleteDialog = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            data-testid="back-to-settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2">Business Categories</h1>
            <p className="text-muted-foreground">Manage business categories for company classification</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-category-button">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="category-dialog">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new business category for companies.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  data-testid="category-name-input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="category-submit-button">
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No categories found</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table data-testid="categories-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold -ml-3"
                        onClick={() => {
                          setSortBy('category_name');
                          setSortOrder(sortBy === 'category_name' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Category Name
                        {sortBy === 'category_name' && (
                          sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => {
                          setSortBy('display_order');
                          setSortOrder(sortBy === 'display_order' && sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Display Order
                        {sortBy === 'display_order' && (
                          sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={categories.map((cat) => cat.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((category) => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onDelete={openDeleteDialog}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        editingId={editingId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-category-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category{' '}
              <strong>{selectedCategory?.category_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              data-testid="confirm-delete-category"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

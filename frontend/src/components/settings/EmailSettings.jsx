import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, FileText, Signature, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function EmailSettings() {
  const [templates, setTemplates] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    is_active: true
  });
  
  // Signature dialog state
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [signatureForm, setSignatureForm] = useState({
    name: '',
    content: '',
    is_default: false
  });
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'template' or 'signature'
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, signaturesRes] = await Promise.all([
        axios.get(`${API}/email/templates`, getAuthHeaders()),
        axios.get(`${API}/email/signatures`, getAuthHeaders())
      ]);
      setTemplates(templatesRes.data);
      setSignatures(signaturesRes.data);
    } catch (error) {
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  // Template handlers
  const openTemplateDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        body: template.body,
        is_active: template.is_active
      });
    } else {
      setSelectedTemplate(null);
      setTemplateForm({ name: '', subject: '', body: '', is_active: true });
    }
    setTemplateDialogOpen(true);
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTemplate) {
        await axios.put(`${API}/email/templates/${selectedTemplate.id}`, templateForm, getAuthHeaders());
        toast.success('Template updated');
      } else {
        await axios.post(`${API}/email/templates`, templateForm, getAuthHeaders());
        toast.success('Template created');
      }
      setTemplateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save template');
    }
  };

  // Signature handlers
  const openSignatureDialog = (signature = null) => {
    if (signature) {
      setSelectedSignature(signature);
      setSignatureForm({
        name: signature.name,
        content: signature.content,
        is_default: signature.is_default
      });
    } else {
      setSelectedSignature(null);
      setSignatureForm({ name: '', content: '', is_default: false });
    }
    setSignatureDialogOpen(true);
  };

  const handleSignatureSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSignature) {
        await axios.put(`${API}/email/signatures/${selectedSignature.id}`, signatureForm, getAuthHeaders());
        toast.success('Signature updated');
      } else {
        await axios.post(`${API}/email/signatures`, signatureForm, getAuthHeaders());
        toast.success('Signature created');
      }
      setSignatureDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save signature');
    }
  };

  // Delete handlers
  const openDeleteDialog = (type, item) => {
    setDeleteType(type);
    setDeleteItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'template') {
        await axios.delete(`${API}/email/templates/${deleteItem.id}`, getAuthHeaders());
        toast.success('Template deleted');
      } else {
        await axios.delete(`${API}/email/signatures/${deleteItem.id}`, getAuthHeaders());
        toast.success('Signature deleted');
      }
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="signatures" className="gap-2">
            <Signature className="w-4 h-4" />
            Signatures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Create reusable email templates for common communications</CardDescription>
              </div>
              <Button onClick={() => openTemplateDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates yet. Create your first template.
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {!template.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Subject: {template.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog('template', template)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Signatures</CardTitle>
                <CardDescription>Your personal email signatures (visible only to you)</CardDescription>
              </div>
              <Button onClick={() => openSignatureDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Signature
              </Button>
            </CardHeader>
            <CardContent>
              {signatures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No signatures yet. Create your first signature.
                </div>
              ) : (
                <div className="space-y-3">
                  {signatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{signature.name}</h4>
                          {signature.is_default && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-3">
                          {signature.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSignatureDialog(signature)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog('signature', signature)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              Create a reusable email template with pre-filled subject and body.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Welcome Email, Event Invitation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line *</Label>
              <Input
                id="template-subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Email subject"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-body">Body *</Label>
              <Textarea
                id="template-body"
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Email body content..."
                rows={8}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="template-active"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
              />
              <Label htmlFor="template-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSignature ? 'Edit Signature' : 'New Signature'}</DialogTitle>
            <DialogDescription>
              Create a personal email signature that will be appended to your emails.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignatureSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature-name">Signature Name *</Label>
              <Input
                id="signature-name"
                value={signatureForm.name}
                onChange={(e) => setSignatureForm({ ...signatureForm, name: e.target.value })}
                placeholder="e.g., Professional, Casual"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature-content">Signature Content *</Label>
              <Textarea
                id="signature-content"
                value={signatureForm.content}
                onChange={(e) => setSignatureForm({ ...signatureForm, content: e.target.value })}
                placeholder="Best regards,
John Doe
Event Manager
Phone: (555) 123-4567"
                rows={6}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="signature-default"
                checked={signatureForm.is_default}
                onCheckedChange={(checked) => setSignatureForm({ ...signatureForm, is_default: checked })}
              />
              <Label htmlFor="signature-default">Set as default signature</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setSignatureDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedSignature ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteType} "{deleteItem?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

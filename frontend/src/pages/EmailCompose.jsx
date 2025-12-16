import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Paperclip, X, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function EmailCompose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    to: searchParams.get('to') || '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    priority: 'normal',
    templateId: '',
    signatureId: ''
  });

  useEffect(() => {
    fetchTemplates();
    fetchSignatures();
  }, []);

  useEffect(() => {
    // Auto-apply default signature
    const defaultSig = signatures.find(s => s.is_default);
    if (defaultSig && !formData.signatureId) {
      setFormData(prev => ({ ...prev, signatureId: defaultSig.id }));
    }
  }, [signatures]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/email/templates`, getAuthHeaders());
      setTemplates(response.data.filter(t => t.is_active));
    } catch (error) {
      console.error('Failed to load templates');
    }
  };

  const fetchSignatures = async () => {
    try {
      const response = await axios.get(`${API}/email/signatures`, getAuthHeaders());
      setSignatures(response.data);
    } catch (error) {
      console.error('Failed to load signatures');
    }
  };

  const handleTemplateChange = (templateId) => {
    setFormData(prev => ({ ...prev, templateId }));
    if (templateId && templateId !== 'none') {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          subject: template.subject,
          body: template.body
        }));
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API}/emails/attachments`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setAttachments(prev => [...prev, response.data]);
      }
      toast.success('Attachment(s) uploaded');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getSelectedSignatureContent = () => {
    if (!formData.signatureId || formData.signatureId === 'none') return '';
    const sig = signatures.find(s => s.id === formData.signatureId);
    return sig ? sig.content : '';
  };

  const handleSubmit = async (e, send = false) => {
    e.preventDefault();
    
    if (!formData.to.trim()) {
      toast.error('Please enter at least one recipient');
      return;
    }

    setLoading(true);
    if (send) setSending(true);

    try {
      // Parse email addresses
      const toAddresses = formData.to.split(/[,;]/).map(e => e.trim()).filter(Boolean);
      const ccAddresses = formData.cc ? formData.cc.split(/[,;]/).map(e => e.trim()).filter(Boolean) : [];
      const bccAddresses = formData.bcc ? formData.bcc.split(/[,;]/).map(e => e.trim()).filter(Boolean) : [];

      // Append signature to body
      let fullBody = formData.body;
      const sigContent = getSelectedSignatureContent();
      if (sigContent) {
        fullBody += '\n\n' + sigContent;
      }

      const emailData = {
        to_addresses: toAddresses,
        cc_addresses: ccAddresses,
        bcc_addresses: bccAddresses,
        subject: formData.subject,
        body: fullBody,
        priority: formData.priority,
        template_id: formData.templateId && formData.templateId !== 'none' ? formData.templateId : null,
        signature_id: formData.signatureId && formData.signatureId !== 'none' ? formData.signatureId : null,
        attachments: attachments.map(a => a.file_url)
      };

      const response = await axios.post(`${API}/emails`, emailData, getAuthHeaders());
      
      if (send) {
        await axios.post(`${API}/emails/${response.data.id}/send`, {}, getAuthHeaders());
        toast.success('Email sent successfully');
      } else {
        toast.success('Email saved as draft');
      }
      
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save email');
    } finally {
      setLoading(false);
      setSending(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'low': return 'text-gray-400';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="space-y-6" data-testid="email-compose">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Compose Email</h1>
          <p className="text-muted-foreground">Create and send emails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="to"
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      placeholder="recipient@example.com (separate multiple with commas)"
                      className="pl-10"
                      data-testid="email-to-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cc">CC</Label>
                    <Input
                      id="cc"
                      value={formData.cc}
                      onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                      placeholder="cc@example.com"
                      data-testid="email-cc-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bcc">BCC</Label>
                    <Input
                      id="bcc"
                      value={formData.bcc}
                      onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                      placeholder="bcc@example.com"
                      data-testid="email-bcc-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject"
                    data-testid="email-subject-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Write your message..."
                    rows={12}
                    className="resize-none"
                    data-testid="email-body-input"
                  />
                </div>

                {/* Signature Preview */}
                {formData.signatureId && formData.signatureId !== 'none' && (
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <p className="text-xs text-muted-foreground mb-1">Signature Preview:</p>
                    <div className="text-sm whitespace-pre-wrap">{getSelectedSignatureContent()}</div>
                  </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                          <Paperclip className="w-3 h-3" />
                          <span className="max-w-[150px] truncate">{file.filename}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(file.file_size)})</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="attachment-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{uploading ? 'Uploading...' : 'Attach'}</span>
                      </div>
                      <Input
                        id="attachment-upload"
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                        data-testid="email-attachment-input"
                      />
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="outline" disabled={loading}>
                      Save Draft
                    </Button>
                    <Button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={loading || sending}
                      className="gap-2"
                      data-testid="email-send-button"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="email-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="text-gray-400">Low Priority</span>
                    </SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">
                      <span className="text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        High Priority
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select 
                  value={formData.templateId || 'none'} 
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger data-testid="email-template-select">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <Select 
                  value={formData.signatureId || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, signatureId: value })}
                >
                  <SelectTrigger data-testid="email-signature-select">
                    <SelectValue placeholder="Select a signature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No signature</SelectItem>
                    {signatures.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.is_default && '(default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Email sending is currently in preview mode. Connect your Microsoft 365 account in Settings to enable actual email delivery.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

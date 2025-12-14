import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { useRef } from 'react';
import { Plus, Type, QrCode, Image as ImageIcon, Save, Download, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BADGE_WIDTH = 4; // inches
const BADGE_HEIGHT = 6; // inches
const SCALE = 96; // pixels per inch (DPI)

export const BadgeDesigner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [templateName, setTemplateName] = useState('Default Badge');
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [previewContact, setPreviewContact] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchContacts(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0].event_id);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/badge-templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchContacts = async (eventId) => {
    try {
      const response = await axios.get(`${API}/contacts?event_id=${eventId}`);
      setContacts(response.data);
      if (response.data.length > 0) {
        setPreviewContact(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const addElement = (type) => {
    // Stagger elements so they don't overlap
    const offset = elements.length * 20;
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'Sample Text' : type === 'field' ? 'name' : type === 'qrcode' ? 'QR Code' : '',
      x: 50 + offset,
      y: 50 + offset,
      width: type === 'qrcode' ? 100 : 200,
      height: type === 'qrcode' ? 100 : 40,
      fontSize: type === 'qrcode' ? 12 : 16,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      align: 'left'
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast.success(`${type} element added`);
  };

  const addFieldElement = (fieldName, displayName) => {
    // Stagger elements so they don't overlap
    const offset = elements.length * 20;
    const newElement = {
      id: `element-${Date.now()}`,
      type: 'field',
      content: fieldName,
      x: 50 + offset,
      y: 50 + offset,
      width: 200,
      height: 40,
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      align: 'left'
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast.success(`${displayName} field added`);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
    toast.success('Element deleted');
  };

  const handleMouseDown = (id, e) => {
    if (e.button !== 0) return; // Only left click
    
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startElementX = element.x;
    const startElementY = element.y;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      updateElement(id, {
        x: Math.max(0, Math.min(BADGE_WIDTH * SCALE - element.width, startElementX + deltaX)),
        y: Math.max(0, Math.min(BADGE_HEIGHT * SCALE - element.height, startElementY + deltaY))
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };

  const saveTemplate = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    try {
      await axios.post(`${API}/badge-templates`, {
        event_id: selectedEvent,
        name: templateName,
        width: BADGE_WIDTH,
        height: BADGE_HEIGHT,
        elements: elements.map(el => ({
          id: el.id,
          type: el.type,
          content: el.content,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle || 'normal',
          color: el.color,
          align: el.align
        })),
        is_default: false
      });
      toast.success('Template saved successfully!');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const loadTemplate = async (templateId) => {
    try {
      const response = await axios.get(`${API}/badge-templates/${templateId}`);
      const template = response.data;
      setTemplateName(template.name);
      setSelectedEvent(template.event_id);
      setElements(template.elements);
      toast.success('Template loaded');
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const renderElementContent = (element) => {
    if (element.type === 'text') {
      return element.content;
    } else if (element.type === 'field') {
      if (!previewContact) {
        return `{${element.content}}`;
      }
      
      // Handle special field mappings
      if (element.content === 'first_name') {
        const fullName = previewContact.name || '';
        return fullName.split(' ')[0] || '{first_name}';
      } else if (element.content === 'last_name') {
        const fullName = previewContact.name || '';
        const parts = fullName.split(' ');
        return parts.length > 1 ? parts.slice(1).join(' ') : '{last_name}';
      }
      
      return previewContact[element.content] || `{${element.content}}`;
    } else if (element.type === 'qrcode') {
      return previewContact?.qr_code ? (
        <img src={previewContact.qr_code} alt="QR Code" className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">QR</div>
      );
    }
    return element.content;
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Event Selection Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Badge Designer</h2>
            <p className="text-slate-600 mt-1">Design custom badges for your event</p>
          </div>
          <div className="w-80">
            <Label className="text-xs mb-1 block">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger data-testid="event-select-header">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(event => (
                  <SelectItem key={event.event_id} value={event.event_id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div data-testid="badge-designer-container" className="h-[calc(100vh-280px)] flex gap-6">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-white rounded-xl border border-slate-200 p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Badge Details</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  data-testid="template-name-input"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger data-testid="event-select" className="mt-1">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.event_id} value={event.event_id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Add Elements</h3>
            <div className="space-y-2">
              <Button
                onClick={() => addElement('text')}
                data-testid="add-text-button"
                variant="secondary"
                className="w-full justify-start text-sm"
              >
                <Type size={16} className="mr-2" />
                Custom Text
              </Button>
              <Button
                onClick={() => addElement('qrcode')}
                data-testid="add-qrcode-button"
                variant="secondary"
                className="w-full justify-start text-sm"
              >
                <QrCode size={16} className="mr-2" />
                QR Code
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider text-slate-600">Popular Fields</h3>
            <div className="space-y-1">
              <button
                onClick={() => addFieldElement('first_name', 'First Name')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                First Name
              </button>
              <button
                onClick={() => addFieldElement('last_name', 'Last Name')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Last Name
              </button>
              <button
                onClick={() => addFieldElement('company', 'Company Name')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-indigo-50 bg-indigo-50 text-indigo-700 font-medium transition-colors"
              >
                Company Name
              </button>
              <button
                onClick={() => addFieldElement('title', 'Job Title')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Job Title
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider text-slate-600">Other Fields</h3>
            <div className="space-y-1">
              <button
                onClick={() => addFieldElement('name', 'Full Name')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Full Name
              </button>
              <button
                onClick={() => addFieldElement('type', 'Type')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Participant Type
              </button>
              <button
                onClick={() => addFieldElement('booth_number', 'Booth #')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Booth Number
              </button>
              <button
                onClick={() => addFieldElement('email', 'Email')}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Email
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={saveTemplate}
                data-testid="save-template-button"
                className="w-full justify-start"
              >
                <Save size={16} className="mr-2" />
                Save Template
              </Button>
            </div>
          </div>

          {templates.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Load Template</h3>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger data-testid="load-template-select">
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.template_id} value={template.template_id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {contacts.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Preview Contact</h3>
              <Select value={previewContact?.contact_id} onValueChange={(id) => setPreviewContact(contacts.find(c => c.contact_id === id))}>
                <SelectTrigger data-testid="preview-contact-select">
                  <SelectValue placeholder="Choose contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.contact_id} value={contact.contact_id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-slate-100 rounded-xl p-12 flex items-center justify-center overflow-auto">
          <div
            data-testid="badge-canvas"
            className="bg-white shadow-2xl border border-slate-200 relative"
            style={{
              width: `${BADGE_WIDTH * SCALE}px`,
              height: `${BADGE_HEIGHT * SCALE}px`
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                data-testid={`badge-element-${element.id}`}
                onClick={() => setSelectedElement(element.id)}
                onMouseDown={(e) => handleMouseDown(element.id, e)}
                className={`absolute cursor-move border transition-all ${
                  selectedElement === element.id 
                    ? 'ring-2 ring-primary border-primary bg-blue-50/50' 
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/30'
                }`}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                  fontSize: `${element.fontSize}px`,
                  fontFamily: element.fontFamily,
                  fontWeight: element.fontWeight,
                  fontStyle: element.fontStyle || 'normal',
                  color: element.color,
                  textAlign: element.align
                }}
              >
                {element.type === 'qrcode' ? (
                  renderElementContent(element)
                ) : (
                  <div className="w-full h-full flex items-center px-2">
                    {renderElementContent(element)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white rounded-xl border border-slate-200 p-6 space-y-6 overflow-y-auto">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Properties</h3>
                <Button
                  onClick={() => deleteElement(selected.id)}
                  data-testid="delete-element-button"
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-4">
                {selected.type === 'text' && (
                  <div>
                    <Label className="text-xs">Text Content</Label>
                    <Input
                      value={selected.content}
                      onChange={(e) => updateElement(selected.id, { content: e.target.value })}
                      data-testid="element-content-input"
                      className="mt-1"
                    />
                  </div>
                )}

                {selected.type === 'field' && (
                  <div>
                    <Label className="text-xs">Field Name</Label>
                    <Select
                      value={selected.content}
                      onValueChange={(value) => updateElement(selected.id, { content: value })}
                    >
                      <SelectTrigger data-testid="field-name-select" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_name">First Name</SelectItem>
                        <SelectItem value="last_name">Last Name</SelectItem>
                        <SelectItem value="name">Full Name</SelectItem>
                        <SelectItem value="company">Company Name</SelectItem>
                        <SelectItem value="title">Job Title</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="booth_number">Booth Number</SelectItem>
                        <SelectItem value="ticket_type">Ticket Type</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selected.type !== 'qrcode' && (
                  <>
                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <Input
                        type="number"
                        value={selected.fontSize}
                        onChange={(e) => updateElement(selected.id, { fontSize: parseInt(e.target.value) })}
                        data-testid="font-size-input"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Font Family</Label>
                      <Select
                        value={selected.fontFamily}
                        onValueChange={(value) => updateElement(selected.id, { fontFamily: value })}
                      >
                        <SelectTrigger data-testid="font-family-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times-Roman">Times Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Font Weight</Label>
                      <Select
                        value={selected.fontWeight}
                        onValueChange={(value) => updateElement(selected.id, { fontWeight: value })}
                      >
                        <SelectTrigger data-testid="font-weight-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Font Style</Label>
                      <Select
                        value={selected.fontStyle || 'normal'}
                        onValueChange={(value) => updateElement(selected.id, { fontStyle: value })}
                      >
                        <SelectTrigger data-testid="font-style-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="italic">Italic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Text Alignment</Label>
                      <Select
                        value={selected.align || 'left'}
                        onValueChange={(value) => updateElement(selected.id, { align: value })}
                      >
                        <SelectTrigger data-testid="text-align-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                        data-testid="color-input"
                        className="mt-1 h-10"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={selected.width}
                    onChange={(e) => updateElement(selected.id, { width: parseInt(e.target.value) })}
                    data-testid="width-input"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={selected.height}
                    onChange={(e) => updateElement(selected.id, { height: parseInt(e.target.value) })}
                    data-testid="height-input"
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-12">
              <p>Select an element to edit its properties</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};
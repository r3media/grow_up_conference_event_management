import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = '',
  className = '',
  multiline = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {type === 'select' ? (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : multiline ? (
          <Textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px]"
            placeholder={placeholder}
          />
        ) : (
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8"
            placeholder={placeholder}
          />
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-secondary" onClick={handleSave}>
          <Check className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={handleCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      <span className={!value ? 'text-muted-foreground' : ''}>
        {value || placeholder || '-'}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function InlineEditBlock({
  title,
  fields,
  onSave,
  className = '',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = f.value || '';
    });
    setEditValues(initial);
  }, [fields]);

  const handleSave = () => {
    onSave(editValues);
    setIsEditing(false);
  };

  const handleCancel = () => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = f.value || '';
    });
    setEditValues(initial);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">{title}</label>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-secondary" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs text-muted-foreground">{field.label}</label>
              {field.type === 'select' ? (
                <Select
                  value={editValues[field.key]}
                  onValueChange={(v) => setEditValues({ ...editValues, [field.key]: v })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={editValues[field.key]}
                  onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                  className="h-8"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasValues = fields.some((f) => f.value);

  return (
    <div className={`group ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{title}</label>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
      {hasValues ? (
        <div className="mt-1 text-sm">
          {fields.map((f) => f.value).filter(Boolean).join(', ')}
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">Not set</div>
      )}
    </div>
  );
}

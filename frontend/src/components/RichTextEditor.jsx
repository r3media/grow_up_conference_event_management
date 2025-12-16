import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Custom toolbar options
const TOOLBAR_OPTIONS = [
  [{ 'header': [1, 2, 3, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'align': [] }],
  ['link', 'image'],
  ['clean']
];

// Simplified toolbar for signatures
const SIGNATURE_TOOLBAR_OPTIONS = [
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large'] }],
  ['bold', 'italic', 'underline'],
  [{ 'color': [] }],
  ['link', 'image'],
  ['clean']
];

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Write something...',
  minHeight = '200px',
  variant = 'full' // 'full' or 'compact'
}) {
  const modules = useMemo(() => ({
    toolbar: variant === 'compact' ? SIGNATURE_TOOLBAR_OPTIONS : TOOLBAR_OPTIONS,
    clipboard: {
      matchVisual: false
    }
  }), [variant]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image'
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-toolbar {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
          border-radius: 0.5rem 0.5rem 0 0;
        }
        .rich-text-editor .ql-container {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
          border-radius: 0 0 0.5rem 0.5rem;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker-options {
          background: hsl(var(--popover));
          border-color: hsl(var(--border));
        }
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow .ql-active {
          color: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-snow .ql-active .ql-stroke {
          stroke: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-snow .ql-active .ql-fill {
          fill: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: hsl(var(--primary));
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow a {
          color: hsl(var(--primary));
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function EmailLink({ email, showIcon = true, className = '' }) {
  const navigate = useNavigate();

  if (!email) return <span className="text-muted-foreground">-</span>;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/email/compose?to=${encodeURIComponent(email)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-sm text-primary hover:underline ${className}`}
    >
      {showIcon && <Mail className="w-4 h-4 text-muted-foreground" />}
      {email}
    </button>
  );
}

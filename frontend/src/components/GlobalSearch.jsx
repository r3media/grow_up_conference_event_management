import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Building2, User, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search as user types
  useEffect(() => {
    if (query.length < 2) {
      setCompanies([]);
      setContacts([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [companiesRes, contactsRes] = await Promise.all([
        axios.get(`${API}/companies?search=${encodeURIComponent(query)}`, getAuthHeaders()),
        axios.get(`${API}/contacts?search=${encodeURIComponent(query)}`, getAuthHeaders()),
      ]);
      
      setCompanies(companiesRes.data.slice(0, 5));
      setContacts(contactsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type, id) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/${type}/${id}`);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const hasResults = companies.length > 0 || contacts.length > 0;
  const showDropdown = isOpen && query.length >= 2;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search companies, contacts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8 bg-muted/50 border-0 focus-visible:ring-1"
          data-testid="global-search-input"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {/* Contacts Section */}
              {contacts.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Contacts ({contacts.length})
                  </div>
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelect('contacts', contact.id)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      data-testid={`search-result-contact-${contact.id}`}
                    >
                      <Avatar className="w-8 h-8">
                        {contact.photo_url ? (
                          <AvatarImage src={`${BACKEND_URL}${contact.photo_url}`} alt={contact.name} />
                        ) : null}
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.email || contact.company_name || 'No email'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Companies Section */}
              {companies.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Companies ({companies.length})
                  </div>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleSelect('companies', company.id)}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      data-testid={`search-result-company-${company.id}`}
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.category || company.address?.city || 'Company'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

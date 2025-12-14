import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { Settings as SettingsIcon, CreditCard, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    stripe_key: '',
    email_type: 'smtp',
    email_config: {
      smtp_host: '',
      smtp_port: '587',
      smtp_username: '',
      smtp_password: '',
      resend_api_key: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings({
        stripe_key: response.data.stripe_key || '',
        email_type: response.data.email_type || 'smtp',
        email_config: response.data.email_config || {
          smtp_host: '',
          smtp_port: '587',
          smtp_username: '',
          smtp_password: '',
          resend_api_key: ''
        }
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="settings-container" className="max-w-3xl space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-600 mt-1">Configure your tenant settings</p>
        </div>

        {/* Stripe Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <CreditCard className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Stripe Configuration</h3>
              <p className="text-sm text-slate-600">Configure payment processing for this tenant</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="stripe_key">Stripe Secret Key</Label>
              <Input
                id="stripe_key"
                type="password"
                placeholder="sk_test_..."
                value={settings.stripe_key}
                onChange={(e) => setSettings({ ...settings, stripe_key: e.target.value })}
                data-testid="stripe-key-input"
                className="font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Your Stripe secret key will be encrypted and stored securely
              </p>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <Mail className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Email Configuration</h3>
              <p className="text-sm text-slate-600">Configure email sending for this tenant</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email_type">Email Provider</Label>
              <Select
                value={settings.email_type}
                onValueChange={(value) => setSettings({ ...settings, email_type: value })}
              >
                <SelectTrigger data-testid="email-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP Server</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.email_type === 'smtp' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      placeholder="smtp.example.com"
                      value={settings.email_config.smtp_host}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email_config: { ...settings.email_config, smtp_host: e.target.value }
                        })
                      }
                      data-testid="smtp-host-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      placeholder="587"
                      value={settings.email_config.smtp_port}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          email_config: { ...settings.email_config, smtp_port: e.target.value }
                        })
                      }
                      data-testid="smtp-port-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp_username">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    placeholder="user@example.com"
                    value={settings.email_config.smtp_username}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email_config: { ...settings.email_config, smtp_username: e.target.value }
                      })
                    }
                    data-testid="smtp-username-input"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="••••••••"
                    value={settings.email_config.smtp_password}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email_config: { ...settings.email_config, smtp_password: e.target.value }
                      })
                    }
                    data-testid="smtp-password-input"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="resend_api_key">Resend API Key</Label>
                <Input
                  id="resend_api_key"
                  type="password"
                  placeholder="re_..."
                  value={settings.email_config.resend_api_key}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_config: { ...settings.email_config, resend_api_key: e.target.value }
                    })
                  }
                  data-testid="resend-api-key-input"
                  className="font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get your API key from{' '}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    resend.com/api-keys
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            data-testid="save-settings-button"
            size="lg"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};
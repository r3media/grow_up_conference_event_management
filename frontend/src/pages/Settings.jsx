import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Calendar, Package, ChevronRight, Tag } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const navigate = useNavigate();

  const SettingLink = ({ icon: Icon, title, description, onClick }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your system configurations and categories</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="company" className="gap-2" data-testid="tab-company-settings">
                <Building2 className="w-4 h-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-2" data-testid="tab-user-settings">
                <Users className="w-4 h-4" />
                User
              </TabsTrigger>
              <TabsTrigger value="event" className="gap-2" data-testid="tab-event-settings">
                <Calendar className="w-4 h-4" />
                Event
              </TabsTrigger>
              <TabsTrigger value="exhibitor" className="gap-2" data-testid="tab-exhibitor-settings">
                <Package className="w-4 h-4" />
                Exhibitor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-6">
              <div className="space-y-4">
                <SettingLink
                  icon={Tag}
                  title="Business Categories"
                  description="Manage business categories for company classification"
                  onClick={() => navigate('/settings/categories/business')}
                />
                <SettingLink
                  icon={Calendar}
                  title="Exhibit History"
                  description="Manage exhibit/event history options for companies"
                  onClick={() => navigate('/settings/categories/exhibit_history')}
                />
              </div>
            </TabsContent>

            <TabsContent value="user" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>User settings coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="event" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Event settings coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="exhibitor" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Exhibitor settings coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

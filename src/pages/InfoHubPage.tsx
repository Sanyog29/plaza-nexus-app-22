
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Phone, MapPin, Info, Search, Users } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Sample building information data
const floorPlans = [
  { id: 'floor-1', name: 'Ground Floor', description: 'Main entrance, reception, cafeteria', file: 'ground-floor.pdf', updated: '2025-01-15' },
  { id: 'floor-2', name: 'First Floor', description: 'Conference rooms, co-working spaces', file: 'first-floor.pdf', updated: '2025-01-15' },
  { id: 'floor-3', name: 'Second Floor', description: 'Office spaces, executive suites', file: 'second-floor.pdf', updated: '2025-01-15' },
];

const emergencyContacts = [
  { id: 'contact-1', name: 'Building Manager', phone: '+91 98765 43210', department: 'Administration', isEmergency: false },
  { id: 'contact-2', name: 'Security Desk', phone: '+91 98765 12345', department: 'Security', isEmergency: true },
  { id: 'contact-3', name: 'Maintenance', phone: '+91 98765 67890', department: 'Facilities', isEmergency: false },
  { id: 'contact-4', name: 'Fire Emergency', phone: '+91 101', department: 'Emergency', isEmergency: true },
  { id: 'contact-5', name: 'Medical Emergency', phone: '+91 102', department: 'Emergency', isEmergency: true },
];

const buildingGuidelines = [
  { id: 'guide-1', title: 'Visitor Policy', description: 'Guidelines for registering and hosting visitors', file: 'visitor-policy.pdf', updated: '2025-02-10' },
  { id: 'guide-2', title: 'Parking Rules', description: 'Parking slot allocation and guidelines', file: 'parking-rules.pdf', updated: '2025-01-22' },
  { id: 'guide-3', title: 'After Hours Access', description: 'Procedure for accessing the building after hours', file: 'after-hours.pdf', updated: '2025-03-05' },
];

const InfoHubPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowPreview(true);
  };

  // Filter items based on search query
  const filteredFloorPlans = floorPlans.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredContacts = emergencyContacts.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredGuidelines = buildingGuidelines.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock download function
  const handleDownload = (file: string) => {
    console.log(`Downloading ${file}`);
    // In a real app, this would trigger a file download
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Building Info Hub</h2>
        <p className="text-sm text-gray-400 mt-1">Access building information and resources</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <Input 
          placeholder="Search floors, contacts, guidelines..." 
          value={searchQuery}
          onChange={handleSearch}
          className="pl-10 bg-card/50 backdrop-blur"
        />
      </div>

      <Tabs defaultValue="floor-plans" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="floor-plans" className="data-[state=active]:bg-plaza-blue">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Floor Plans</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-plaza-blue">
            <Phone className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="data-[state=active]:bg-plaza-blue">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Guidelines</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plans" className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md pr-4">
            {filteredFloorPlans.length > 0 ? (
              filteredFloorPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="mb-4 bg-card/50 backdrop-blur hover:bg-card/60 transition-colors cursor-pointer"
                  onClick={() => handleItemClick(plan)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Updated: {plan.updated}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(plan.file);
                      }}
                    >
                      <Download size={18} className="text-plaza-blue" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-400 mt-8">No floor plans found matching your search</p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md pr-4">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <Card 
                  key={contact.id} 
                  className={`mb-4 ${contact.isEmergency ? 'border-red-500 border-l-4' : 'border-l-4 border-plaza-blue'} bg-card/50 backdrop-blur`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{contact.name}</h3>
                      {contact.isEmergency && (
                        <Badge variant="destructive">Emergency</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{contact.department}</p>
                    <a 
                      href={`tel:${contact.phone}`} 
                      className="flex items-center text-plaza-blue mt-2 text-sm"
                    >
                      <Phone size={14} className="mr-1" />
                      {contact.phone}
                    </a>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-400 mt-8">No contacts found matching your search</p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <ScrollArea className="h-[400px] rounded-md pr-4">
            {filteredGuidelines.length > 0 ? (
              filteredGuidelines.map((guide) => (
                <Card 
                  key={guide.id} 
                  className="mb-4 bg-card/50 backdrop-blur hover:bg-card/60 transition-colors cursor-pointer"
                  onClick={() => handleItemClick(guide)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{guide.title}</h3>
                      <p className="text-sm text-gray-400">{guide.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Updated: {guide.updated}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(guide.file);
                      }}
                    >
                      <Download size={18} className="text-plaza-blue" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-400 mt-8">No guidelines found matching your search</p>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-card text-white sm:max-w-[600px] sm:h-[70vh]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">
                {selectedItem?.name || selectedItem?.title}
              </h2>
              <p className="text-sm text-gray-400">
                {selectedItem?.description}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedItem?.file)}
            >
              <Download size={14} className="mr-2" />
              Download
            </Button>
          </div>
          
          <div className="bg-card/70 rounded-md h-[calc(100%-4rem)] flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-400 mb-2">Preview not available</p>
              <p className="text-xs text-gray-500">Download the file to view it</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InfoHubPage;

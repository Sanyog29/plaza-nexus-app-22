
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Map, User, HardDrive, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Sample floor plans and emergency maps
const floorPlans = [
  { id: 'floor-1', name: 'Ground Floor', type: 'floor-plan', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-03-15' },
  { id: 'floor-2', name: '1st Floor', type: 'floor-plan', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-03-15' },
  { id: 'floor-3', name: '2nd Floor', type: 'floor-plan', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-03-15' },
  { id: 'floor-4', name: '3rd Floor', type: 'floor-plan', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-03-15' },
];

const emergencyMaps = [
  { id: 'emerg-1', name: 'Fire Evacuation Route - Ground Floor', type: 'evacuation-map', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-02-10' },
  { id: 'emerg-2', name: 'Fire Evacuation Route - 1st Floor', type: 'evacuation-map', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-02-10' },
  { id: 'emerg-3', name: 'Emergency Assembly Points', type: 'evacuation-map', fileUrl: '#', image: '/placeholder.svg', updatedAt: '2025-02-10' },
];

// Sample contact information
const contacts = [
  { id: 'contact-1', name: 'John Smith', role: 'Building Manager', email: 'john.smith@ssplaza.com', phone: '+91-9876543210' },
  { id: 'contact-2', name: 'Priya Patel', role: 'Security Manager', email: 'priya.patel@ssplaza.com', phone: '+91-9876543211' },
  { id: 'contact-3', name: 'Ahmed Khan', role: 'Maintenance Head', email: 'ahmed.khan@ssplaza.com', phone: '+91-9876543212' },
  { id: 'contact-4', name: 'Sarah Johnson', role: 'Admin Manager', email: 'sarah.johnson@ssplaza.com', phone: '+91-9876543213' },
];

// Sample resources
const resources = [
  { id: 'resource-1', name: 'Building User Manual', type: 'PDF', fileUrl: '#', size: '2.4 MB', updatedAt: '2025-01-15' },
  { id: 'resource-2', name: 'Visitor Policy', type: 'PDF', fileUrl: '#', size: '1.2 MB', updatedAt: '2025-03-05' },
  { id: 'resource-3', name: 'Emergency Procedures', type: 'PDF', fileUrl: '#', size: '3.5 MB', updatedAt: '2025-02-20' },
  { id: 'resource-4', name: 'Maintenance Request Form', type: 'PDF', fileUrl: '#', size: '0.8 MB', updatedAt: '2025-03-10' },
];

// Sample guidelines
const guidelines = [
  { id: 'guide-1', title: 'Office Hours', content: 'Building operational hours are from 8:00 AM to 8:00 PM on weekdays, and 10:00 AM to 6:00 PM on weekends.' },
  { id: 'guide-2', title: 'Visitor Registration', content: 'All visitors must register at the security desk in the main lobby. Visitors are required to show valid ID and must be accompanied by their host at all times.' },
  { id: 'guide-3', title: 'Parking Policy', content: 'Parking is available on a first-come, first-served basis for tenants with valid parking permits. Visitor parking requires prior approval through the security office.' },
  { id: 'guide-4', title: 'Maintenance Requests', content: 'Maintenance requests should be submitted through the SS Plaza mobile app or by contacting the maintenance department directly at maintenance@ssplaza.com.' },
];

const InfoHubPage = () => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<any>(null);
  
  const handleDownload = (item: any) => {
    // In a real app, this would trigger an actual download
    console.log(`Downloading ${item.name}`);
    // Mock download simulation
    alert(`Downloading ${item.name}`);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Information Hub</h2>
        <p className="text-sm text-gray-400 mt-1">Access building information and resources</p>
      </div>

      <Tabs defaultValue="floor-plans" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 bg-card/50">
          <TabsTrigger value="floor-plans" className="data-[state=active]:bg-plaza-blue">
            <Building className="h-4 w-4 mr-2" />
            Floor Plans
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-plaza-blue">
            <User className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-plaza-blue">
            <HardDrive className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="data-[state=active]:bg-plaza-blue">
            <Map className="h-4 w-4 mr-2" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plans">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Floor Plans & Emergency Maps</CardTitle>
              <CardDescription>Building layouts and evacuation routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Floor Plans</h3>
                  {floorPlans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-card/80 cursor-pointer"
                      onClick={() => setSelectedFloorPlan(plan)}
                    >
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-plaza-blue mr-3" />
                        <div>
                          <p className="font-medium text-white">{plan.name}</p>
                          <p className="text-xs text-gray-400">Updated: {plan.updatedAt}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(plan);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Emergency Maps</h3>
                  {emergencyMaps.map((map) => (
                    <div 
                      key={map.id} 
                      className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-card/80 cursor-pointer"
                      onClick={() => setSelectedFloorPlan(map)}
                    >
                      <div className="flex items-center">
                        <Map className="h-5 w-5 text-red-500 mr-3" />
                        <div>
                          <p className="font-medium text-white">{map.name}</p>
                          <p className="text-xs text-gray-400">Updated: {map.updatedAt}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(map);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedFloorPlan && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white mb-3">{selectedFloorPlan.name}</h3>
                  <div className="border border-border rounded-md overflow-hidden">
                    <img 
                      src={selectedFloorPlan.image} 
                      alt={selectedFloorPlan.name} 
                      className="w-full h-auto max-h-[400px] object-contain bg-black/20"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => handleDownload(selectedFloorPlan)}
                    >
                      <Download className="h-4 w-4" />
                      Download Full Resolution
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Admin Contact Directory</CardTitle>
              <CardDescription>Key personnel contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4 border border-border rounded-md">
                    <div className="flex items-start">
                      <div className="bg-card/60 p-2 rounded-full mr-3">
                        <User className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{contact.name}</h4>
                        <p className="text-sm text-gray-400">{contact.role}</p>
                        <div className="space-y-1 mt-2 text-sm">
                          <p className="text-gray-400">Email: <a href={`mailto:${contact.email}`} className="text-plaza-blue">{contact.email}</a></p>
                          <p className="text-gray-400">Phone: <a href={`tel:${contact.phone}`} className="text-plaza-blue">{contact.phone}</a></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Downloadable Resources</CardTitle>
              <CardDescription>Access important building documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border border-border rounded-md">
                    <div className="flex items-center">
                      <div className="bg-card/60 p-2 rounded-full mr-3">
                        <HardDrive className="h-5 w-5 text-plaza-blue" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{resource.name}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                          <span>{resource.type}</span>
                          <span>•</span>
                          <span>{resource.size}</span>
                          <span>•</span>
                          <span>Updated: {resource.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Building Guidelines</CardTitle>
              <CardDescription>Policies and procedures for tenants and visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {guidelines.map((guide) => (
                  <div key={guide.id} className="space-y-2">
                    <h3 className="font-semibold text-white">{guide.title}</h3>
                    <p className="text-gray-400">{guide.content}</p>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfoHubPage;


import React, { useState } from 'react';
import RecentBookings from '@/components/services/RecentBookings';
import ServicesTabs from '@/components/services/ServicesTabs';
import ServiceBookingModal from '@/components/services/ServiceBookingModal';

const ServicesPage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Service Marketplace</h2>
        <p className="text-sm text-gray-400 mt-1">Book services available in SS Plaza</p>
      </div>

      <RecentBookings />
      
      <ServicesTabs onSelectService={handleSelectService} />

      <ServiceBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesPage;

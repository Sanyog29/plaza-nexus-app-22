
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RequestFormHeader = () => {
  return (
    <div className="flex items-center mb-6">
      <Link to="/requests" className="mr-4">
        <ArrowLeft size={24} className="text-white" />
      </Link>
      <h2 className="text-2xl font-bold text-white">New Request</h2>
    </div>
  );
};

export default RequestFormHeader;

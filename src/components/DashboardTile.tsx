
import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardTileProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  to: string;
  bgColor: string;
  count?: number;
  status?: {
    text: string;
    color: string;
  };
}

const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  description,
  icon,
  to,
  bgColor,
  count,
  status,
}) => {
  return (
    <Link to={to} className="block">
      <div className={`${bgColor} rounded-lg p-5 relative overflow-hidden card-shadow hover:brightness-105 transition-all duration-200`}>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
              {icon}
            </div>
            {count !== undefined && (
              <span className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full">
                {count}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-white/90 text-sm">{description}</p>
          )}
          
          {status && (
            <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>
    </Link>
  );
};

export default DashboardTile;

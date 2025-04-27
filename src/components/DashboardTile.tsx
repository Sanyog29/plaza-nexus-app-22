
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
    <Link to={to} className="block group">
      <div className={`${bgColor} rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              {icon}
            </div>
            {count !== undefined && (
              <span className="bg-white/90 text-black text-xs font-semibold px-3 py-1.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-white/90 text-sm mb-4">{description}</p>
          )}
          
          {status && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default DashboardTile;

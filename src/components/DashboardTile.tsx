
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
  // Determine text color based on background
  const isLightBg = bgColor.includes('amber') || bgColor.includes('gray-100');
  const textColor = isLightBg ? 'text-gray-900' : 'text-white';
  const descriptionColor = isLightBg ? 'text-gray-700' : 'text-white/90';
  const iconBgColor = 'bg-orange-200';
  const countBgColor = isLightBg ? 'bg-gray-800 text-white' : 'bg-white/90 text-gray-900';

  return (
    <Link to={to} className="block group">
      <div className={`${bgColor} rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-full`}>
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`${iconBgColor} p-3 rounded-lg backdrop-blur-sm`}>
              {icon}
            </div>
            {count !== undefined && (
              <span className={`${countBgColor} text-xs font-semibold px-3 py-1.5 rounded-full`}>
                {count}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
          {description && (
            <p className={`${descriptionColor} text-sm mb-4`}>{description}</p>
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

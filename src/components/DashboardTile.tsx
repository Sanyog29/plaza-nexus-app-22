
import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardTileProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  to: string;
  bgColor: string;
  count?: number;
}

const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  description,
  icon,
  to,
  bgColor,
  count,
}) => {
  return (
    <Link to={to}>
      <div className={`${bgColor} rounded-lg p-4 relative overflow-hidden card-shadow hover:brightness-110 transition-all`}>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              {icon}
            </div>
            {count !== undefined && (
              <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                {count}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold mt-3">{title}</h3>
          {description && (
            <p className="text-white/80 text-sm mt-1">{description}</p>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>
    </Link>
  );
};

export default DashboardTile;

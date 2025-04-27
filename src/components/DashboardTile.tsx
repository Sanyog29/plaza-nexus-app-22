
import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardTileProps {
  title: string;
  icon: React.ReactNode;
  to: string;
  bgColor?: string;
  count?: number;
}

const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  icon,
  to,
  bgColor = 'bg-card',
  count,
}) => {
  return (
    <Link to={to} className="block">
      <div className={`${bgColor} rounded-lg p-4 h-32 relative overflow-hidden card-shadow transition-transform hover:translate-y-[-2px]`}>
        <div className="absolute top-3 right-3 opacity-70">{icon}</div>
        <div className="mt-10">
          <h3 className="font-montserrat text-lg font-medium text-white">{title}</h3>
          {count !== undefined && (
            <span className="inline-block mt-2 px-2 py-1 bg-black bg-opacity-30 rounded text-sm">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default DashboardTile;

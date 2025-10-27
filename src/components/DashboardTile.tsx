
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
      <div className={`${bgColor} rounded-xl p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl h-full will-change-transform`}>
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Gradient border glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/20 dark:bg-white/10 p-3 rounded-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 dark:group-hover:bg-white/20 group-hover:shadow-lg">
              <div className="transition-transform duration-300 group-hover:rotate-12">
                {icon}
              </div>
            </div>
            {count !== undefined && (
              <span className="bg-background/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-background group-hover:shadow-lg stat-card-animated">
                {count}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-semibold mb-1 text-primary-foreground transition-all duration-300 group-hover:translate-x-1">{title}</h3>
          {description && (
            <p className="text-primary-foreground/80 text-sm mb-4 transition-all duration-300 group-hover:text-primary-foreground">{description}</p>
          )}
          
          {status && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${status.color} transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}>
              {status.text}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default DashboardTile;

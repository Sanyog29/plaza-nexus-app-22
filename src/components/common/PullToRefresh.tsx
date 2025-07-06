import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80; // Minimum pull distance to trigger refresh

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || disabled) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, threshold * 1.2));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, disabled]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRefresh = pullDistance > 20;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Pull to refresh indicator */}
      {shouldShowRefresh && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-200 ease-out"
          style={{
            height: Math.min(pullDistance, threshold),
            transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-primary">
            <RefreshCw
              className={`h-5 w-5 transition-transform duration-200 ${
                isRefreshing
                  ? 'animate-spin'
                  : pullDistance >= threshold
                  ? 'rotate-180'
                  : ''
              }`}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing
                ? 'Refreshing...'
                : pullDistance >= threshold
                ? 'Release to refresh'
                : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${shouldShowRefresh ? Math.min(pullDistance, threshold) : 0}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
};
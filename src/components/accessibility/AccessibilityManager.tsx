import React, { useEffect, useState } from 'react';

interface AccessibilityManagerProps {
  children: React.ReactNode;
}

export const AccessibilityManager: React.FC<AccessibilityManagerProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    // Check for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    setReducedMotion(prefersReducedMotion);
    setHighContrast(prefersHighContrast);

    // Load saved preferences
    const savedFontSize = localStorage.getItem('accessibility-font-size') || 'normal';
    const savedHighContrast = localStorage.getItem('accessibility-high-contrast') === 'true';
    const savedReducedMotion = localStorage.getItem('accessibility-reduced-motion') === 'true';

    setFontSize(savedFontSize);
    setHighContrast(savedHighContrast);
    setReducedMotion(savedReducedMotion);

    // Apply settings
    updateAccessibilitySettings(savedFontSize, savedHighContrast, savedReducedMotion);
  }, []);

  const updateAccessibilitySettings = (fontSizeValue: string, highContrastValue: boolean, reducedMotionValue: boolean) => {
    const root = document.documentElement;
    
    // Font size adjustments
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${fontSizeValue}`);
    
    // High contrast
    if (highContrastValue) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (reducedMotionValue) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  useEffect(() => {
    updateAccessibilitySettings(fontSize, highContrast, reducedMotion);
    
    // Save preferences
    localStorage.setItem('accessibility-font-size', fontSize);
    localStorage.setItem('accessibility-high-contrast', highContrast.toString());
    localStorage.setItem('accessibility-reduced-motion', reducedMotion.toString());
  }, [fontSize, highContrast, reducedMotion]);

  // Skip to main content functionality
  const handleSkipToMain = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      (mainContent as HTMLElement).scrollIntoView();
    }
  };

  // Focus management for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modals/dropdowns
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.closest('[role="dialog"]') || activeElement.closest('[role="menu"]'))) {
          const closeButton = activeElement.closest('[role="dialog"], [role="menu"]')?.querySelector('[aria-label*="close"], [data-close], .close-button') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }

      // Tab trapping in modals
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (activeModal) {
          const focusableElements = activeModal.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements.length > 0) {
            const first = focusableElements[0] as HTMLElement;
            const last = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Announce dynamic content changes to screen readers
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Expose accessibility functions to the app
  useEffect(() => {
    (window as any).accessibility = {
      announce: announceToScreenReader,
      setFontSize,
      setHighContrast,
      setReducedMotion,
      fontSize,
      highContrast,
      reducedMotion
    };
  }, [fontSize, highContrast, reducedMotion]);

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={(e) => {
          e.preventDefault();
          handleSkipToMain();
        }}
      >
        Skip to main content
      </a>
      
      {/* Accessibility floating menu */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 space-y-3 min-w-[200px] opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <h3 className="font-semibold text-sm">Accessibility</h3>
          
          <div className="space-y-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="mr-2"
              />
              High Contrast
            </label>
            
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="mr-2"
              />
              Reduce Motion
            </label>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Font Size</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full text-sm border border-border rounded px-2 py-1"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {children}
    </>
  );
};
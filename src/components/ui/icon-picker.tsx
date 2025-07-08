import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Sparkles, 
  Shield, 
  Truck, 
  Home, 
  Building, 
  Settings, 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Heart, 
  Star, 
  MapPin, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Folder, 
  Archive, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Bell, 
  BellOff, 
  Zap, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  Cpu, 
  HardDrive, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Printer, 
  Camera, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Rewind, 
  FastForward,
  Coffee, 
  Utensils, 
  Car, 
  Bike, 
  Bus, 
  Train, 
  Plane, 
  Ship, 
  Anchor, 
  Navigation, 
  Compass, 
  Globe, 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Wind, 
  Thermometer, 
  Activity, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ShoppingCart, 
  Package, 
  Gift, 
  Award, 
  Target, 
  Flag, 
  Bookmark, 
  Tag, 
  Hash, 
  AtSign, 
  Percent, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  MoreVertical, 
  Menu, 
  X, 
  Check, 
  AlertCircle, 
  XCircle, 
  HelpCircle, 
  Lightbulb, 
  Key, 
  QrCode, 
  Scan, 
  Link, 
  ExternalLink, 
  Copy, 
  Share, 
  MessageSquare, 
  MessageCircle, 
  Send, 
  Inbox, 
  Archive as ArchiveIcon, 
  RefreshCw, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  CornerUpLeft, 
  CornerUpRight, 
  Move, 
  Grid, 
  List, 
  Layers, 
  Layout, 
  Sidebar, 
  PanelLeft, 
  PanelRight, 
  PanelTop, 
  PanelBottom,
  Sliders
} from 'lucide-react';

const iconCategories = {
  Maintenance: [
    { name: 'Wrench', icon: Wrench },
    { name: 'Settings', icon: Settings },
    { name: 'Cpu', icon: Cpu },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Monitor', icon: Monitor },
    { name: 'Printer', icon: Printer },
    { name: 'Battery', icon: Battery },
    { name: 'BatteryLow', icon: BatteryLow },
    { name: 'Zap', icon: Zap },
    { name: 'Activity', icon: Activity },
    { name: 'RefreshCw', icon: RefreshCw },
    { name: 'Sliders', icon: Sliders }
  ],
  Security: [
    { name: 'Shield', icon: Shield },
    { name: 'Lock', icon: Lock },
    { name: 'Unlock', icon: Unlock },
    { name: 'Eye', icon: Eye },
    { name: 'EyeOff', icon: EyeOff },
    { name: 'Camera', icon: Camera },
    { name: 'QrCode', icon: QrCode },
    { name: 'Scan', icon: Scan },
    { name: 'Key', icon: Key },
    { name: 'AlertTriangle', icon: AlertTriangle }
  ],
  Cleaning: [
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Home', icon: Home },
    { name: 'Building', icon: Building },
    { name: 'Archive', icon: ArchiveIcon },
    { name: 'Package', icon: Package }
  ],
  Transport: [
    { name: 'Truck', icon: Truck },
    { name: 'Car', icon: Car },
    { name: 'Bike', icon: Bike },
    { name: 'Bus', icon: Bus },
    { name: 'Train', icon: Train },
    { name: 'Plane', icon: Plane },
    { name: 'Ship', icon: Ship },
    { name: 'Navigation', icon: Navigation },
    { name: 'MapPin', icon: MapPin },
    { name: 'Compass', icon: Compass }
  ],
  Communication: [
    { name: 'Phone', icon: Phone },
    { name: 'Mail', icon: Mail },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'MessageCircle', icon: MessageCircle },
    { name: 'Send', icon: Send },
    { name: 'Inbox', icon: Inbox },
    { name: 'Bell', icon: Bell },
    { name: 'BellOff', icon: BellOff }
  ],
  General: [
    { name: 'Users', icon: Users },
    { name: 'Calendar', icon: Calendar },
    { name: 'Clock', icon: Clock },
    { name: 'CheckCircle', icon: CheckCircle },
    { name: 'Info', icon: Info },
    { name: 'Heart', icon: Heart },
    { name: 'Star', icon: Star },
    { name: 'Globe', icon: Globe },
    { name: 'Lightbulb', icon: Lightbulb },
    { name: 'Target', icon: Target },
    { name: 'Flag', icon: Flag },
    { name: 'Award', icon: Award }
  ],
  Food: [
    { name: 'Coffee', icon: Coffee },
    { name: 'Utensils', icon: Utensils }
  ]
};

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const getAllIcons = () => {
    return Object.values(iconCategories).flat();
  };

  const getFilteredIcons = () => {
    let icons = selectedCategory === 'All' 
      ? getAllIcons() 
      : iconCategories[selectedCategory as keyof typeof iconCategories] || [];

    if (searchTerm) {
      icons = icons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return icons;
  };

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === 'All' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('All')}
            >
              All
            </Badge>
            {Object.keys(iconCategories).map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Icons Grid */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-8 gap-2 p-2">
              {getFilteredIcons().map((iconItem) => {
                const IconComponent = iconItem.icon;
                const isSelected = selectedIcon === iconItem.name;
                
                return (
                  <Button
                    key={iconItem.name}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="h-12 w-12 p-0 flex flex-col items-center justify-center"
                    onClick={() => handleIconSelect(iconItem.name)}
                    title={iconItem.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          {getFilteredIcons().length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No icons found matching your search.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
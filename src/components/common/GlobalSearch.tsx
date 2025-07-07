import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, FileText, Users, Wrench, Calendar, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface SearchResult {
  id: string;
  title: string;
  type: 'request' | 'user' | 'asset' | 'booking' | 'visitor';
  description: string;
  url: string;
  metadata?: any;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({ className, placeholder = "Search across all modules..." }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const searchFilters = [
    { value: 'request', label: 'Requests', icon: Wrench },
    { value: 'user', label: 'Users', icon: Users },
    { value: 'asset', label: 'Assets', icon: Building },
    { value: 'booking', label: 'Bookings', icon: Calendar },
    { value: 'visitor', label: 'Visitors', icon: FileText }
  ];

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search maintenance requests
      if (!selectedFilters.length || selectedFilters.includes('request')) {
        const { data: requests } = await supabase
          .from('maintenance_requests')
          .select('id, title, description, status, location')
          .or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%, location.ilike.%${searchQuery}%`)
          .limit(5);

        requests?.forEach(request => {
          searchResults.push({
            id: request.id,
            title: request.title,
            type: 'request',
            description: `${request.location} • ${request.status}`,
            url: `/requests/${request.id}`,
            metadata: { status: request.status }
          });
        });
      }

      // Search users (admin only)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profile?.role === 'admin' && (!selectedFilters.length || selectedFilters.includes('user'))) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, department')
          .or(`first_name.ilike.%${searchQuery}%, last_name.ilike.%${searchQuery}%, department.ilike.%${searchQuery}%`)
          .limit(5);

        users?.forEach(user => {
          searchResults.push({
            id: user.id,
            title: `${user.first_name} ${user.last_name}`,
            type: 'user',
            description: `${user.role} • ${user.department || 'No department'}`,
            url: `/admin/users`,
            metadata: { role: user.role }
          });
        });
      }

      // Search assets
      if (!selectedFilters.length || selectedFilters.includes('asset')) {
        const { data: assets } = await supabase
          .from('assets')
          .select('id, asset_name, location, status, asset_type')
          .or(`asset_name.ilike.%${searchQuery}%, location.ilike.%${searchQuery}%, asset_type.ilike.%${searchQuery}%`)
          .limit(5);

        assets?.forEach(asset => {
          searchResults.push({
            id: asset.id,
            title: asset.asset_name,
            type: 'asset',
            description: `${asset.location} • ${asset.status}`,
            url: `/staff/operations`,
            metadata: { status: asset.status }
          });
        });
      }

      // Search room bookings
      if (!selectedFilters.length || selectedFilters.includes('booking')) {
        const { data: bookings } = await supabase
          .from('room_bookings')
          .select('id, title, start_time, status, rooms(name)')
          .or(`title.ilike.%${searchQuery}%`)
          .limit(5);

        bookings?.forEach(booking => {
          searchResults.push({
            id: booking.id,
            title: booking.title,
            type: 'booking',
            description: `${booking.rooms?.name} • ${new Date(booking.start_time).toLocaleDateString()}`,
            url: `/bookings`,
            metadata: { status: booking.status }
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilters, user?.id]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const toggleFilter = (filterValue: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'request': return Wrench;
      case 'user': return Users;
      case 'asset': return Building;
      case 'booking': return Calendar;
      case 'visitor': return FileText;
      default: return FileText;
    }
  };

  const getStatusColor = (type: string, status?: string) => {
    if (type === 'request') {
      switch (status) {
        case 'completed': return 'bg-green-500/20 text-green-400';
        case 'in_progress': return 'bg-blue-500/20 text-blue-400';
        case 'pending': return 'bg-yellow-500/20 text-yellow-400';
        default: return 'bg-gray-500/20 text-gray-400';
      }
    }
    return 'bg-primary/20 text-primary';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-background/50 border-border/50"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur border-border/50 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {searchFilters.map(filter => {
                  const IconComponent = filter.icon;
                  const isSelected = selectedFilters.includes(filter.value);
                  return (
                    <Button
                      key={filter.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(filter.value)}
                      className="h-6 px-2 text-xs"
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {filter.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map(result => {
                    const IconComponent = getResultIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-2 text-left hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-1 rounded">
                            <IconComponent className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {result.title}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {result.description}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(result.type, result.metadata?.status)}`}
                          >
                            {result.type}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
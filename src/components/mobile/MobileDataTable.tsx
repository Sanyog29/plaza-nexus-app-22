import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MobileDataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface MobileDataTableProps {
  data: any[];
  columns: MobileDataTableColumn[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function MobileDataTable({
  data,
  columns,
  searchPlaceholder = "Search...",
  onRowClick,
  onEdit,
  onDelete,
  onView,
  emptyMessage = "No data available",
  loading = false
}: MobileDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort data
  const filteredData = data.filter(row =>
    columns.some(column =>
      String(row[column.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      })
    : filteredData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderCellValue = (column: MobileDataTableColumn, row: any) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    
    // Default rendering for common types
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }
    
    if (value instanceof Date) {
      return new Date(value).toLocaleDateString();
    }
    
    return String(value || '');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Cards */}
      <div className="space-y-3">
        {sortedData.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          sortedData.map((row, index) => (
            <Card
              key={index}
              className={cn(
                "transition-all",
                onRowClick && "cursor-pointer hover:shadow-md"
              )}
              onClick={() => onRowClick?.(row)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Primary column (usually first) as title */}
                    <h3 className="font-medium text-sm">
                      {renderCellValue(columns[0], row)}
                    </h3>
                    {/* Secondary column as subtitle */}
                    {columns.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {renderCellValue(columns[1], row)}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions Menu */}
                  {(onEdit || onDelete || onView) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(row)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(row)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(row)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              {/* Additional Data */}
              {columns.length > 2 && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-2">
                    {columns.slice(2).map((column) => (
                      <div key={column.key} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {column.label}:
                        </span>
                        <span className="text-xs font-medium">
                          {renderCellValue(column, row)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Sort Options */}
      {columns.filter(col => col.sortable).length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground flex-shrink-0 py-1">
                Sort by:
              </span>
              {columns
                .filter(col => col.sortable)
                .map((column) => (
                  <Button
                    key={column.key}
                    variant={sortColumn === column.key ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 h-7 text-xs"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    {sortColumn === column.key && (
                      sortDirection === 'asc' ? 
                        <SortAsc className="h-3 w-3 ml-1" /> : 
                        <SortDesc className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
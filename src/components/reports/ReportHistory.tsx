import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { History, Download, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReportHistoryItem {
  id: string;
  report_type: string;
  generated_at: string;
  generated_by: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  status: string;
  error_message: string | null;
  export_format: string;
}

export const ReportHistory: React.FC = () => {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching report history:', error);
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleDownload = (fileUrl: string | null) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Report History
            </CardTitle>
            <CardDescription>View and download previously generated reports</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reports generated yet</p>
            <p className="text-xs mt-1">Reports will appear here once generated</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(item.generated_at), 'PPP p')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {item.export_format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatFileSize(item.file_size_bytes)}
                    </TableCell>
                    <TableCell>
                      {item.status === 'success' ? (
                        <Badge variant="default" className="bg-green-500">Success</Badge>
                      ) : item.status === 'failed' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="secondary">Processing</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === 'success' && item.file_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item.file_url)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : item.status === 'failed' ? (
                        <Button variant="ghost" size="sm" title={item.error_message || 'Unknown error'}>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Processing...</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
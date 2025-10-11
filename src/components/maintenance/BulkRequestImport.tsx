import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileSpreadsheet, Download, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, parse } from 'date-fns';

interface ExcelRow {
  'Sl.No.'?: string;
  'Date': string;
  'Floor': string;
  'Wing': string;
  'Process': string;
  'Location': string;
  'Issue Description': string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ParsedRequest {
  row_number: number;
  title: string;
  description: string;
  location: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  building_floor_id?: string;
  building_area_id?: string;
  process_id?: string;
  category_id?: string;
  created_at?: string;
}

export function BulkRequestImport({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRequest[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    const [floorsRes, processesRes, categoriesRes] = await Promise.all([
      supabase.from('building_floors').select('id, name').eq('is_active', true),
      supabase.from('maintenance_processes').select('id, name').eq('is_active', true),
      supabase.from('maintenance_categories').select('id, name')
    ]);

    if (floorsRes.data) setFloors(floorsRes.data);
    if (processesRes.data) setProcesses(processesRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const parseDate = (dateStr: string): string | null => {
    try {
      // Parse DD.MM.YY format
      const parsed = parse(dateStr.trim(), 'dd.MM.yy', new Date());
      return format(parsed, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } catch (error) {
      return null;
    }
  };

  const mapFloor = (floorName: string): string | undefined => {
    const normalized = floorName.toLowerCase().trim();
    const floor = floors.find(f => f.name.toLowerCase() === normalized);
    return floor?.id;
  };

  const mapProcess = (processName: string): string | undefined => {
    if (processName.toLowerCase().trim() === 'na') return undefined;
    const normalized = processName.toLowerCase().trim();
    const process = processes.find(p => p.name.toLowerCase() === normalized);
    return process?.id;
  };

  const inferCategory = (description: string): string | undefined => {
    const keywords: Record<string, string[]> = {
      'electrical': ['wiring', 'wire', 'electrical', 'switch', 'board', 'power'],
      'hvac': ['ac', 'temperature', 'cooling', 'heating', 'ventilation'],
      'plumbing': ['water', 'tap', 'leak', 'drainage', 'washroom', 'toilet'],
      'cleaning': ['cleaning', 'trash', 'garbage', 'dirty'],
      'safety': ['fire', 'extinguisher', 'emergency', 'safety'],
    };

    const desc = description.toLowerCase();
    for (const [categoryName, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(kw => desc.includes(kw))) {
        const category = categories.find(c => c.name.toLowerCase().includes(categoryName));
        return category?.id;
      }
    }
    return undefined;
  };

  const inferPriority = (description: string): 'urgent' | 'high' | 'medium' | 'low' => {
    const desc = description.toLowerCase();
    const urgentKeywords = ['urgent', 'immediate', 'emergency', 'danger', 'critical'];
    const highKeywords = ['broken', 'not working', 'damaged', 'failed'];

    if (urgentKeywords.some(kw => desc.includes(kw))) return 'urgent';
    if (highKeywords.some(kw => desc.includes(kw))) return 'high';
    return 'medium';
  };

  const parseExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      const errors: ValidationError[] = [];
      const parsed: ParsedRequest[] = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (accounting for header)

        // Validate required fields
        if (!row.Date) {
          errors.push({ row: rowNum, field: 'Date', message: 'Date is required' });
        }
        if (!row.Floor) {
          errors.push({ row: rowNum, field: 'Floor', message: 'Floor is required' });
        }
        if (!row['Issue Description']) {
          errors.push({ row: rowNum, field: 'Issue Description', message: 'Issue Description is required' });
        }

        // Parse date
        const parsedDate = row.Date ? parseDate(row.Date) : null;
        if (row.Date && !parsedDate) {
          errors.push({ 
            row: rowNum, 
            field: 'Date', 
            message: 'Invalid date format. Use DD.MM.YY',
            value: row.Date 
          });
        }

        // Map floor
        const floorId = row.Floor ? mapFloor(row.Floor) : undefined;
        if (row.Floor && !floorId) {
          errors.push({ 
            row: rowNum, 
            field: 'Floor', 
            message: `Floor "${row.Floor}" not found in system`,
            value: row.Floor 
          });
        }

        // Map process
        const processId = row.Process ? mapProcess(row.Process) : undefined;
        if (row.Process && row.Process.toLowerCase() !== 'na' && !processId) {
          errors.push({ 
            row: rowNum, 
            field: 'Process', 
            message: `Process "${row.Process}" not found in system`,
            value: row.Process 
          });
        }

        // Build location from wing and location
        const location = row.Wing?.toLowerCase() === 'whole floor' 
          ? row.Location 
          : `${row.Wing} - ${row.Location}`;

        // Infer category and priority
        const categoryId = row['Issue Description'] ? inferCategory(row['Issue Description']) : undefined;
        const priority = row['Issue Description'] ? inferPriority(row['Issue Description']) : 'medium';

        // Generate title (first 60 chars of description)
        const title = row['Issue Description'] 
          ? row['Issue Description'].substring(0, 60) + (row['Issue Description'].length > 60 ? '...' : '')
          : '';

        // Only add to parsed data if no critical errors for this row
        const rowErrors = errors.filter(e => e.row === rowNum);
        if (rowErrors.length === 0) {
          parsed.push({
            row_number: rowNum,
            title,
            description: row['Issue Description'] || '',
            location: location || '',
            priority,
            building_floor_id: floorId,
            process_id: processId,
            category_id: categoryId,
            created_at: parsedDate || undefined,
          });
        }
      });

      setValidationErrors(errors);
      setParsedData(parsed);
      setStep('preview');

      if (errors.length > 0) {
        toast({
          title: 'Validation Warnings',
          description: `Found ${errors.length} validation issues. Review before importing.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'File Parsed Successfully',
          description: `${parsed.length} requests ready to import.`,
        });
      }
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse Excel file. Please check the format.',
        variant: 'destructive',
      });
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      parseExcelFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const generateTemplate = () => {
    const templateData = [
      {
        'Sl.No.': '1',
        'Date': '10.10.25',
        'Floor': 'Ground Floor',
        'Wing': 'Right wing',
        'Process': 'Meesho',
        'Location': 'Gents rest room',
        'Issue Description': 'Electrical Switch box top'
      },
      {
        'Sl.No.': '2',
        'Date': '10.10.25',
        'Floor': 'Cafeteria',
        'Wing': 'Whole floor',
        'Process': 'NA',
        'Location': 'Eating area',
        'Issue Description': 'No fire extinguisher'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Requests');
    XLSX.writeFile(wb, 'maintenance_requests_template.xlsx');

    toast({
      title: 'Template Downloaded',
      description: 'Check your downloads folder for the template file.',
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid requests to import.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setStep('processing');
    setProgress(0);

    try {
      // Create upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('maintenance_request_bulk_uploads')
        .insert({
          filename: file?.name || 'unknown',
          total_records: parsedData.length,
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Process in batches of 50
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < parsedData.length; i += batchSize) {
        batches.push(parsedData.slice(i, i + batchSize));
      }

      let allResults: any = { success_count: 0, error_count: 0, success_results: [], error_results: [] };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const { data, error } = await supabase.rpc('admin_bulk_create_maintenance_requests', {
          requests_data: batch,
          upload_id: uploadRecord.id
        });

        if (error) throw error;

        // Aggregate results (safely handle Json type)
        const resultData = data as any;
        allResults.success_count += resultData?.success_count || 0;
        allResults.error_count += resultData?.error_count || 0;
        allResults.success_results = [...allResults.success_results, ...(resultData?.success_results || [])];
        allResults.error_results = [...allResults.error_results, ...(resultData?.error_results || [])];

        setProgress(((i + 1) / batches.length) * 100);
      }

      setResults(allResults);
      setStep('complete');

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${allResults.success_count} requests. ${allResults.error_count} failed.`,
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import requests.',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setProcessing(false);
    }
  };

  const downloadErrors = () => {
    if (validationErrors.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(validationErrors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'import_errors.xlsx');
  };

  const downloadResults = () => {
    if (!results) return;

    const ws = XLSX.utils.json_to_sheet([
      ...results.success_results,
      ...results.error_results
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Results');
    XLSX.writeFile(wb, 'import_results.xlsx');
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setResults(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['upload', 'preview', 'processing', 'complete'].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <Badge variant={step === s ? 'default' : 'outline'} className="capitalize">
                {s}
              </Badge>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Bulk Import Maintenance Requests
            </CardTitle>
            <CardDescription>
              Upload an Excel file to import multiple maintenance requests at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop the file here' : 'Drop Excel file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse (max 10MB)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports .xlsx, .xls, .csv
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Validation</CardTitle>
            <CardDescription>
              Review parsed data before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  File: {file?.name} ({(file!.size / 1024).toFixed(2)} KB)
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {parsedData.length} Valid
                  </Badge>
                  {validationErrors.length > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {validationErrors.length} Errors
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {validationErrors.length > 0 && (
                  <Button onClick={downloadErrors} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Errors
                  </Button>
                )}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Validation Errors</p>
                    <div className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                      {validationErrors.slice(0, 10).map((err, i) => (
                        <div key={i}>
                          Row {err.row}: {err.field} - {err.message}
                          {err.value && <span className="text-xs"> ({err.value})</span>}
                        </div>
                      ))}
                      {validationErrors.length > 10 && (
                        <p className="text-xs italic">...and {validationErrors.length - 10} more</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reset} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={parsedData.length === 0 || processing}
                className="flex-1"
              >
                Import {parsedData.length} Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Import...</CardTitle>
            <CardDescription>
              Please wait while we create the maintenance requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-center text-muted-foreground">
              {progress.toFixed(0)}% Complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{results.success_count}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-destructive">{results.error_count}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadResults} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
              <Button onClick={reset} className="flex-1">
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
import { usePropertyContext } from '@/contexts/PropertyContext';

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
  main_category_id?: string;
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
  const [mainCategories, setMainCategories] = useState<any[]>([]);

  const { currentProperty } = usePropertyContext();

  React.useEffect(() => {
    loadReferenceData();
  }, [currentProperty?.id]);

  const loadReferenceData = async () => {
    // Build processes query with property filter
    let processesQuery = supabase
      .from('maintenance_processes')
      .select('id, name')
      .eq('is_active', true);
    
    if (currentProperty?.id) {
      processesQuery = processesQuery.eq('property_id', currentProperty.id);
    }

    const [floorsRes, processesRes, categoriesRes] = await Promise.all([
      supabase.from('building_floors').select('id, name').eq('is_active', true),
      processesQuery,
      supabase.from('main_categories').select('id, name')
    ]);

    if (floorsRes.data) setFloors(floorsRes.data);
    if (processesRes.data) setProcesses(processesRes.data);
    if (categoriesRes.data) setMainCategories(categoriesRes.data);
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
    // Aggressive normalization
    const normalized = floorName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    console.log('🏢 Mapping floor:', { original: floorName, normalized, availableFloors: floors.map(f => f.name) });
    
    // Synonym mapping for common variations
    const synonyms: Record<string, string> = {
      'ground': 'ground floor',
      'gf': 'ground floor',
      'g floor': 'ground floor',
      'ground fl': 'ground floor',
      'basement': 'basement',
      'b': 'basement',
      'b floor': 'basement',
      'cafeteria': 'cafeteria',
      'cafe': 'cafeteria',
      'canteen': 'cafeteria',
      '1': '1st floor',
      '1st': '1st floor',
      'first': '1st floor',
      'first floor': '1st floor',
      '2': '2nd floor',
      '2nd': '2nd floor',
      'second': '2nd floor',
      'second floor': '2nd floor',
      '3': '3rd floor',
      '3rd': '3rd floor',
      'third': '3rd floor',
      'third floor': '3rd floor',
      '4': '4th floor',
      '4th': '4th floor',
      'fourth': '4th floor',
      'fourth floor': '4th floor',
      '5': '5th floor',
      '5th': '5th floor',
      'fifth': '5th floor',
      'fifth floor': '5th floor',
      '6': '6th floor',
      '6th': '6th floor',
      'sixth': '6th floor',
      'sixth floor': '6th floor',
      '7': '7th floor',
      '7th': '7th floor',
      'seventh': '7th floor',
      'seventh floor': '7th floor',
      '8': '8th floor',
      '8th': '8th floor',
      'eighth': '8th floor',
      'eighth floor': '8th floor',
      '9': '9th floor',
      '9th': '9th floor',
      'ninth': '9th floor',
      'ninth floor': '9th floor',
      '10': '10th floor',
      '10th': '10th floor',
      'tenth': '10th floor',
      'tenth floor': '10th floor',
    };
    
    // Check synonyms first
    const mappedName = synonyms[normalized] || normalized;
    
    // Try exact match with normalized name
    let floor = floors.find(f => 
      f.name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') === mappedName
    );
    
    // Try partial match if exact match fails
    if (!floor) {
      floor = floors.find(f => 
        f.name.toLowerCase().includes(mappedName) || mappedName.includes(f.name.toLowerCase())
      );
    }
    
    if (floor) {
      console.log('✅ Floor matched:', floor.name);
    } else {
      console.warn('❌ Floor not found:', floorName, 'Available:', floors.map(f => f.name).join(', '));
    }
    
    return floor?.id;
  };

  const mapProcess = (processName: string): string | undefined => {
    if (processName.toLowerCase().trim() === 'na') return undefined;
    
    // Aggressive normalization
    const normalized = processName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    console.log('🔍 Mapping process:', { original: processName, normalized, availableProcesses: processes.map(p => p.name) });
    
    // Synonym mapping for common variations
    const synonyms: Record<string, string> = {
      'mee sho': 'meesho',
      'meesho cabin': 'meesho',
      'meesho office': 'meesho',
      'hub': 'hub room',
      'hub rm': 'hub room',
      'hubroom': 'hub room',
      'hubrm': 'hub room',
      'amex': 'amex',
      'american express': 'amex',
      'axis': 'axis bank',
      'cafe': 'cafeteria',
      'cafeteria area': 'cafeteria',
      'canteen': 'cafeteria',
      'idfc': 'idfc',
      'idfc bank': 'idfc',
    };
    
    // Check synonyms first
    const mappedName = synonyms[normalized] || normalized;
    
    // Try exact match first
    let process = processes.find(p => 
      p.name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') === mappedName
    );
    
    // Try partial match if exact match fails
    if (!process) {
      process = processes.find(p => 
        p.name.toLowerCase().includes(mappedName) || mappedName.includes(p.name.toLowerCase())
      );
    }
    
    if (process) {
      console.log('✅ Process matched:', process.name);
    } else {
      console.warn('❌ Process not found:', processName, 'Available:', processes.map(p => p.name).join(', '));
    }
    
    return process?.id;
  };

  // Normalize a raw Excel row's headers (trim, lowercase) and provide alias lookup
  const buildNormalizedRow = (row: Record<string, any>) => {
    const map = new Map<string, any>();
    Object.entries(row).forEach(([k, v]) => {
      const key = String(k).trim().toLowerCase();
      map.set(key, v);
    });

    const aliases: Record<string, string[]> = {
      date: ['date', 'date (dd.mm.yy)', 'reported date'],
      floor: ['floor', 'level'],
      wing: ['wing', 'zone', 'area wing'],
      process: ['process', 'client', 'tenant', 'department'],
      location: ['location', 'exact location', 'place', 'site'],
      'issue description': ['issue description', 'issue', 'description', 'problem']
    };

    const get = (logical: keyof typeof aliases): string | undefined => {
      for (const key of aliases[logical]) {
        if (map.has(key)) {
          const val = map.get(key);
          if (val === null || val === undefined) return undefined;
          return String(val).trim();
        }
      }
      return undefined;
    };

    return { get };
  };

  const inferCategory = (description: string): string | undefined => {
    const keywords: Record<string, string[]> = {
      'Electrical & Lighting': ['wiring', 'wire', 'electrical', 'switch', 'board', 'power', 'light'],
      'HVAC & Air Quality': ['ac', 'temperature', 'cooling', 'heating', 'ventilation', 'hvac'],
      'Plumbing & Washrooms': ['water', 'tap', 'leak', 'drainage', 'washroom', 'toilet', 'plumbing'],
      'Housekeeping & Cleaning': ['cleaning', 'trash', 'garbage', 'dirty'],
      'Health & Safety': ['fire', 'extinguisher', 'emergency', 'safety'],
      'Security & Access Control': ['access', 'security', 'door', 'lock'],
    };

    const desc = description.toLowerCase();
    for (const [categoryName, keywordList] of Object.entries(keywords)) {
      if (keywordList.some(kw => desc.includes(kw))) {
        const category = mainCategories.find(c => 
          c.name === categoryName || c.name.toLowerCase().includes(categoryName.toLowerCase())
        );
        if (category) return category.id;
      }
    }
    
    // Default to 'Other / General' if no match
    const otherCategory = mainCategories.find(c => c.name === 'Other / General');
    return otherCategory?.id;
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
      // Keep blanks so alias lookup doesn't produce undefined due to empty cells
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const errors: ValidationError[] = [];
      const parsed: ParsedRequest[] = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (accounting for header)

        const r = buildNormalizedRow(row);
        const dateRaw = r.get('date');
        const floorRaw = r.get('floor');
        const wingRaw = r.get('wing');
        const processRaw = r.get('process');
        const locationRaw = r.get('location');
        const issueRaw = r.get('issue description');

        // Validate required fields
        if (!dateRaw) {
          errors.push({ row: rowNum, field: 'Date', message: 'Date is required' });
        }
        if (!floorRaw) {
          errors.push({ row: rowNum, field: 'Floor', message: 'Floor is required' });
        }
        if (!issueRaw) {
          errors.push({ row: rowNum, field: 'Issue Description', message: 'Issue Description is required' });
        }

        // Parse date
        const parsedDate = dateRaw ? parseDate(String(dateRaw)) : null;
        if (dateRaw && !parsedDate) {
          errors.push({ 
            row: rowNum, 
            field: 'Date', 
            message: 'Invalid date format. Use DD.MM.YY',
            value: String(dateRaw)
          });
        }

        // Map floor
        const floorId = floorRaw ? mapFloor(String(floorRaw)) : undefined;
        if (floorRaw && !floorId) {
          const availableFloors = floors.map(f => f.name).join(', ');
          errors.push({ 
            row: rowNum, 
            field: 'Floor', 
            message: `Floor "${floorRaw}" not found. Available floors: ${availableFloors}`,
            value: String(floorRaw)
          });
        }

        // Map process
        const processId = processRaw ? mapProcess(String(processRaw)) : undefined;
        if (processRaw && String(processRaw).toLowerCase() !== 'na' && !processId) {
          const availableProcesses = processes.map(p => p.name).join(', ');
          errors.push({ 
            row: rowNum, 
            field: 'Process', 
            message: `Process "${processRaw}" not found. Available processes: ${availableProcesses}`,
            value: String(processRaw)
          });
        }

        // Build location from wing and location with fallback
        const locationParts = [wingRaw, locationRaw].filter((v) => !!v && String(v).trim().length > 0) as string[];
        let location = (String(wingRaw || '').toLowerCase() === 'whole floor')
          ? (locationRaw || 'Not Specified')
          : locationParts.join(' - ');
        
        console.log(`📍 Location Debug - Row ${rowNum}:`, {
          Wing: wingRaw ?? { _type: 'undefined', value: 'undefined' },
          Location: locationRaw ?? { _type: 'undefined', value: 'undefined' },
          Combined: location,
          Floor: floorRaw ?? { _type: 'undefined', value: 'undefined' }
        });

        // Infer category and priority
        const categoryId = issueRaw ? inferCategory(String(issueRaw)) : undefined;
        const priority = issueRaw ? inferPriority(String(issueRaw)) : 'medium';

        // Generate title (first 60 chars of description)
        const title = issueRaw 
          ? String(issueRaw).substring(0, 60) + (String(issueRaw).length > 60 ? '...' : '')
          : '';

        // Only add to parsed data if no critical errors for this row
        const rowErrors = errors.filter(e => e.row === rowNum);
        if (rowErrors.length === 0) {
          parsed.push({
            row_number: rowNum,
            title,
            description: String(issueRaw || ''),
            location: String(location || ''),
            priority,
            building_floor_id: floorId,
            process_id: processId,
            main_category_id: categoryId,
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
      const hasFileRows = file !== null;
      toast({
        title: 'No Valid Requests',
        description: hasFileRows 
          ? 'All rows have validation errors. Please fix the errors and try again.'
          : 'No valid requests to import.',
        variant: 'destructive',
      });
      return;
    }

    console.log(`🚀 Starting import of ${parsedData.length} requests...`);

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
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} requests)`);
        
        const { data, error } = await supabase.rpc('admin_bulk_create_maintenance_requests', {
          requests_data: batch,
          upload_id: uploadRecord.id
        });

        if (error) {
          console.error('❌ Batch RPC error:', error);
          throw error;
        }
        
        // Check if RPC function returned success: false
        if (data && !(data as any).success) {
          console.error('❌ Batch failed:', data);
          throw new Error((data as any).error || 'Batch import failed with no insertions');
        }
        
        console.log(`✅ Batch ${i + 1} completed:`, data);

        // Aggregate results (map SQL function response to UI expectations)
        const resultData = data as any;
        const inserted = resultData?.inserted_count ?? 0;
        const failed = resultData?.failed_count ?? (Array.isArray(resultData?.error_details) ? resultData.error_details.length : 0);
        const errors = Array.isArray(resultData?.error_details) ? resultData.error_details : [];
        
        allResults.success_count += inserted;
        allResults.error_count += failed;
        allResults.error_results = [...allResults.error_results, ...errors];

        setProgress(((i + 1) / batches.length) * 100);
      }

      setResults(allResults);
      setStep('complete');

      // Check if zero records were inserted
      if (allResults.success_count === 0) {
        const errorMessage = allResults.error_results.length > 0
          ? `All ${parsedData.length} requests failed. First error: ${allResults.error_results[0]?.error || 'Unknown error'}`
          : `No requests were imported. Please check your data.`;
        
        toast({
          title: 'Import Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${allResults.success_count} requests. ${allResults.error_count} failed.`,
        });
      }
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
            <span key={s} className="contents">
              {i > 0 && <div className="h-px w-8 bg-border" />}
              <Badge variant={step === s ? 'default' : 'outline'} className="capitalize">
                {s}
              </Badge>
            </span>
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
                disabled={parsedData.length === 0 || processing || validationErrors.length > 0}
                className="flex-1"
              >
                {validationErrors.length > 0 
                  ? `Fix ${validationErrors.length} Errors to Import` 
                  : `Import ${parsedData.length} Requests`
                }
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
              <Button onClick={reset} variant="outline" className="flex-1">
                Import Another File
              </Button>
              <Button onClick={onComplete} className="flex-1">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

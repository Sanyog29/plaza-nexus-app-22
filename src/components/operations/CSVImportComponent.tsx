import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDropzone } from 'react-dropzone';
import { useUtilityManagement } from '@/hooks/useUtilityManagement';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X,
  Eye
} from 'lucide-react';
import Papa from 'papaparse';

interface CSVRow {
  meter_id: string;
  reading_date: string;
  reading_value: string;
  cost_per_unit?: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export const CSVImportComponent: React.FC = () => {
  const { meters, createReading } = useUtilityManagement();
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [importSource, setImportSource] = useState<'manual' | 'google_sheets'>('manual');

  const validateCSVData = (data: CSVRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const meterIds = new Set(meters.map(m => m.id));

    data.forEach((row, index) => {
      if (!row.meter_id?.trim()) {
        errors.push({ row: index + 1, field: 'meter_id', message: 'Meter ID is required' });
      } else if (!meterIds.has(row.meter_id)) {
        errors.push({ row: index + 1, field: 'meter_id', message: 'Invalid meter ID' });
      }

      if (!row.reading_date?.trim()) {
        errors.push({ row: index + 1, field: 'reading_date', message: 'Reading date is required' });
      } else if (isNaN(Date.parse(row.reading_date))) {
        errors.push({ row: index + 1, field: 'reading_date', message: 'Invalid date format' });
      }

      if (!row.reading_value?.trim()) {
        errors.push({ row: index + 1, field: 'reading_value', message: 'Reading value is required' });
      } else if (isNaN(parseFloat(row.reading_value))) {
        errors.push({ row: index + 1, field: 'reading_value', message: 'Reading value must be a number' });
      }

      if (row.cost_per_unit && isNaN(parseFloat(row.cost_per_unit))) {
        errors.push({ row: index + 1, field: 'cost_per_unit', message: 'Cost per unit must be a number' });
      }
    });

    return errors;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);
        
        const errors = validateCSVData(data);
        setValidationErrors(errors);
        setShowPreview(true);
        setIsProcessing(false);
        setUploadProgress(100);

        if (errors.length === 0) {
          toast({
            title: "CSV Valid",
            description: `${data.length} rows ready for import`,
          });
        } else {
          toast({
            title: "Validation Errors",
            description: `${errors.length} errors found. Please review.`,
            variant: "destructive"
          });
        }
      },
      error: (error) => {
        setIsProcessing(false);
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  }, [meters]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setUploadProgress((i / csvData.length) * 100);

      try {
        await createReading({
          meter_id: row.meter_id,
          reading_date: row.reading_date,
          reading_value: parseFloat(row.reading_value),
          cost_per_unit: row.cost_per_unit ? parseFloat(row.cost_per_unit) : undefined,
          reading_method: importSource === 'google_sheets' ? 'imported_sheets' : 'imported_csv',
          notes: row.notes || `Imported from CSV on ${new Date().toLocaleDateString()}`
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to import row ${i + 1}:`, error);
      }
    }

    setIsProcessing(false);
    setUploadProgress(100);

    toast({
      title: "Import Complete",
      description: `${successCount} rows imported successfully. ${errorCount} errors.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });

    if (errorCount === 0) {
      setCsvData([]);
      setShowPreview(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = `meter_id,reading_date,reading_value,cost_per_unit,notes
${meters.slice(0, 3).map(m => `${m.id},2024-01-15,100.50,2.5,Sample reading`).join('\n')}`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utility_readings_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Data Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Import Source Selection */}
          <div className="space-y-3">
            <Label>Import Source</Label>
            <div className="flex gap-4">
              <Button
                variant={importSource === 'manual' ? 'default' : 'outline'}
                onClick={() => setImportSource('manual')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Manual CSV
              </Button>
              <Button
                variant={importSource === 'google_sheets' ? 'default' : 'outline'}
                onClick={() => setImportSource('google_sheets')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Google Sheets Export
              </Button>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Need a template?</p>
              <p className="text-sm text-muted-foreground">Download a CSV template with sample data</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop the CSV file here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                <p className="text-muted-foreground">or click to select a file</p>
                <p className="text-sm text-muted-foreground mt-2">Supports .csv files up to 10MB</p>
              </div>
            )}
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Processing...</Label>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{validationErrors.length} validation errors found:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm">
                        Row {error.row}, {error.field}: {error.message}
                      </p>
                    ))}
                    {validationErrors.length > 5 && (
                      <p className="text-sm font-medium">...and {validationErrors.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {showPreview && csvData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Data Preview ({csvData.length} rows)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Meter ID</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Value</th>
                        <th className="text-left p-2">Cost/Unit</th>
                        <th className="text-left p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 font-mono text-xs">{row.meter_id}</td>
                          <td className="p-2">{row.reading_date}</td>
                          <td className="p-2">{row.reading_value}</td>
                          <td className="p-2">{row.cost_per_unit || '-'}</td>
                          <td className="p-2">{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      ...and {csvData.length - 10} more rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {showPreview && (
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={validationErrors.length > 0 || isProcessing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Import {csvData.length} Records
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCsvData([]);
                  setShowPreview(false);
                  setValidationErrors([]);
                  setUploadProgress(0);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
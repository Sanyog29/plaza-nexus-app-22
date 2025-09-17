import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Edit
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useMenuImport } from '@/hooks/useMenuImport';
import MenuExcelTemplate from './MenuExcelTemplate';

interface MenuExcelImportProps {
  vendorId: string;
  onImportComplete?: () => void;
}

const MenuExcelImport: React.FC<MenuExcelImportProps> = ({ 
  vendorId, 
  onImportComplete 
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const {
    isProcessing,
    uploadProgress,
    validationErrors,
    parsedData,
    parseExcelFile,
    processImport,
    setValidationErrors
  } = useMenuImport(vendorId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        parseExcelFile(file);
        setCurrentStep('preview');
      }
    }
  });

  const handleImport = async () => {
    setCurrentStep('processing');
    const success = await processImport();
    if (success) {
      setCurrentStep('complete');
      onImportComplete?.();
    } else {
      setCurrentStep('preview');
    }
  };

  const resetImport = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setValidationErrors([]);
  };

  const downloadErrorReport = () => {
    const errorText = validationErrors.map(error => 
      `Row ${error.row}, Field ${error.field}: ${error.message} (Value: ${error.value || 'empty'})`
    ).join('\n');
    
    const blob = new Blob([errorText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Template Download Section */}
      <MenuExcelTemplate vendorId={vendorId} />
      
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Menu File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-lg">Drop the Excel file here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop your Excel file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports .xlsx, .xls, and .csv files up to 5MB
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="font-medium">{selectedFile.name}</span>
                <Badge variant="outline">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {!isProcessing && (
        <>
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Found {validationErrors.length} validation errors that must be fixed before importing.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2"
                  onClick={downloadErrorReport}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Error Report
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {validationErrors.length === 0 && parsedData && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                File validation passed! Ready to import {parsedData.categories.length} categories and {parsedData.menuItems.length} menu items.
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {parsedData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Categories ({parsedData.categories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.categories.slice(0, 10).map((cat, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium">{cat.name}</span>
                        <Badge variant="outline">{cat.display_order}</Badge>
                      </div>
                    ))}
                    {parsedData.categories.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{parsedData.categories.length - 10} more categories
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Menu Items ({parsedData.menuItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.menuItems.slice(0, 10).map((item, index) => (
                      <div key={index} className="p-2 bg-muted rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium block">{item.name}</span>
                            <span className="text-sm text-muted-foreground">{item.category_name}</span>
                          </div>
                          <Badge variant="outline">₹{item.price}</Badge>
                        </div>
                      </div>
                    ))}
                    {parsedData.menuItems.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{parsedData.menuItems.length - 10} more items
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Validation Errors List */}
          {validationErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Errors ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <div key={index} className="p-3 border border-destructive/20 rounded bg-destructive/5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <span className="font-medium text-destructive">Row {error.row}, {error.field}:</span>
                          <p className="text-sm">{error.message}</p>
                          {error.value && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Current value: "{error.value}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {validationErrors.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{validationErrors.length - 20} more errors (download full report)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={resetImport}>
              Start Over
            </Button>
            <Button 
              onClick={handleImport}
              disabled={validationErrors.length > 0 || !parsedData}
            >
              Import Menu Data
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h3 className="text-lg font-semibold">Importing Menu Data</h3>
          <p className="text-muted-foreground">
            Please wait while we process your menu items and create the database entries...
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-green-600">Import Completed!</h3>
          <p className="text-muted-foreground">
            Your menu data has been successfully imported and is now available in your menu management system.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={resetImport}>
              Import Another File
            </Button>
            <Button onClick={() => onImportComplete?.()}>
              View Menu Items
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[
          { key: 'upload', label: 'Upload', icon: Upload },
          { key: 'preview', label: 'Preview', icon: Edit },
          { key: 'processing', label: 'Processing', icon: FileSpreadsheet },
          { key: 'complete', label: 'Complete', icon: CheckCircle }
        ].map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted = ['upload', 'preview', 'processing', 'complete'].indexOf(currentStep) > index;
          const IconComponent = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isActive ? 'bg-primary text-primary-foreground' :
                isCompleted ? 'bg-green-600 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <span className={`ml-2 text-sm ${
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {index < 3 && (
                <div className={`w-8 h-0.5 ml-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default MenuExcelImport;
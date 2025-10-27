import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { useInvitationRoles } from "@/hooks/useInvitationRoles";

interface BulkUserUploadProps {
  onSuccess?: () => void;
}

interface UserRecord {
  emp_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile_number?: string;
  role: string;
  department?: string;
  specialization?: string;
  property_code?: string;
  password?: string;
}

export function BulkUserUpload({ onSuccess }: BulkUserUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { requiresDepartment, getRoleDefaults } = useInvitationRoles();

  const downloadTemplate = () => {
    const template = [
      {
        emp_id: "EMP001",
        first_name: "John",
        last_name: "Doe", 
        email: "john.doe@company.com",
        mobile_number: "+1234567890",
        role: "Multi Skilled Technician",
        department: "Operations",
        specialization: "Multi Skilled Technician",
        property_code: "PROP001",
        password: "TempPassword123"
      },
      {
        emp_id: "EMP002",
        first_name: "Jane",
        last_name: "Smith",
        email: "",
        mobile_number: "+0987654321", 
        role: "Tenant Manager",
        department: "",
        specialization: "",
        property_code: "PROP001",
        password: ""
      },
      {
        emp_id: "EMP003",
        first_name: "Alice",
        last_name: "Johnson",
        email: "alice.johnson@company.com",
        mobile_number: "",
        role: "Front desk and Facility Executive",
        department: "Administration",
        specialization: "Facility Management",
        property_code: "PROP002",
        password: "SecurePass456"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "bulk_users_template.xlsx");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as UserRecord[];

      if (jsonData.length === 0) {
        toast({
          title: "Empty File",
          description: "The uploaded file contains no data",
          variant: "destructive",
        });
        return;
      }

      // Validate data
      const validatedData = jsonData.map((row, index) => {
        const errors: string[] = [];
        
        if (!row.first_name) errors.push("First name is required");
        if (!row.last_name) errors.push("Last name is required");
        if (!row.role) errors.push("Role is required");
        if (!row.email && !row.mobile_number) {
          errors.push("Either email or mobile number is required");
        }
        
        // Check if department is required for this role
        if (requiresDepartment(row.role) && !row.department) {
          errors.push("Department is required for this role");
        }

        return {
          ...row,
          row_number: index + 2, // +2 because of header row and 0-based index
          errors
        };
      });

      // Check for validation errors
      const hasErrors = validatedData.some(row => row.errors && row.errors.length > 0);
      if (hasErrors) {
        toast({
          title: "Validation Errors",
          description: "Some rows have validation errors. Please check your data.",
          variant: "destructive",
        });
        setUploadResults({
          success_count: 0,
          error_count: validatedData.length,
          error_results: validatedData.filter(row => row.errors && row.errors.length > 0).map(row => ({
            emp_id: row.emp_id,
            row_number: row.row_number,
            error: row.errors?.join(", ")
          })),
          success_results: []
        });
        return;
      }

      // Generate passwords for empty password fields and apply role defaults
      const processedData = jsonData.map(row => {
        const roleDefaults = getRoleDefaults(row.role);
        return {
          ...row,
          password: row.password || generatePassword(),
          // Auto-populate department and specialization if not provided
          department: row.department || (requiresDepartment(row.role) ? roleDefaults.department : '') || '',
          specialization: row.specialization || roleDefaults.specialization || ''
        };
      });

      // Call the bulk create function
      const { data, error } = await supabase.rpc('admin_bulk_create_users', {
        users_data: processedData
      });

      if (error) throw error;

      setUploadResults(data as any);
      
      const results = data as any;
      if (results.success_count > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully created ${results.success_count} user(s). ${results.error_count > 0 ? `${results.error_count} failed.` : ''}`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Upload Failed",
          description: "No users were created. Please check the errors below.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to process the uploaded file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generatePassword = (): string => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const downloadResults = () => {
    if (!uploadResults) return;

    const results = [
      ...uploadResults.success_results.map((user: any) => ({
        ...user,
        status: "SUCCESS"
      })),
      ...uploadResults.error_results.map((user: any) => ({
        ...user,
        status: "ERROR"
      }))
    ];

    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "bulk_upload_results.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk User Upload
        </CardTitle>
        <CardDescription>
          Upload multiple users at once using an Excel file. Download the template to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Download Template</h4>
            <p className="text-sm text-muted-foreground">
              Get the Excel template with sample data and required format
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label htmlFor="excel-upload">Upload Excel File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="excel-upload"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="shrink-0"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Processing..." : "Upload File"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Supported formats: .xlsx, .xls. Maximum 500 users per upload. Include property_code column to assign users to properties.
          </p>
        </div>

        {/* Upload Results */}
        {uploadResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Upload Results</h4>
              <Button variant="outline" size="sm" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Success</p>
                  <p className="text-sm text-green-600">{uploadResults.success_count} users</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Failed</p>
                  <p className="text-sm text-red-600">{uploadResults.error_count} users</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Total</p>
                  <p className="text-sm text-blue-600">
                    {uploadResults.success_count + uploadResults.error_count} users
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {uploadResults.error_count > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-red-800">Error Details:</h5>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResults.error_results.map((error: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      <strong>Row {error.row_number || 'N/A'}:</strong> {error.error}
                      {error.emp_id && <span className="ml-2">({error.emp_id})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
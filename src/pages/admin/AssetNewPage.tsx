import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AssetNewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/assets')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Asset</h1>
            <p className="text-muted-foreground mt-2">
              Register a new asset in the system
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Information
            </CardTitle>
            <CardDescription>
              Enter the details for the new asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="assetName">Asset Name</Label>
              <Input id="assetName" placeholder="Enter asset name" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Building/Room" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input id="floor" placeholder="Floor number" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" placeholder="Manufacturer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input id="modelNumber" placeholder="Model number" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional information about the asset" />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button className="flex-1">
                Add Asset
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/assets')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
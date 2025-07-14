import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Clock, User, FileText } from "lucide-react";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Global Search</h1>
          <p className="text-muted-foreground mt-2">
            Search across all system data and records
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search users, requests, assets, or any system data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button>Search</Button>
              </div>

              {!searchQuery ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium">Users</h3>
                        <p className="text-sm text-muted-foreground">Search staff and tenants</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium">Requests</h3>
                        <p className="text-sm text-muted-foreground">Find maintenance requests</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium">Recent</h3>
                        <p className="text-sm text-muted-foreground">Recently accessed items</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Search results will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
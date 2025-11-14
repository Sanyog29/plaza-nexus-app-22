import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PermissionRow } from './PermissionRow';
import * as Icons from 'lucide-react';
import type { PermissionAction, PermissionDefinition, PermissionCategory } from '@/hooks/usePropertyPermissions';

interface PermissionCategoryAccordionProps {
  category: PermissionCategory;
  permissions: PermissionDefinition[];
  roleTemplates: any[];
  userOverrides: any[];
  userRole: string;
  pendingChanges: Map<PermissionAction, boolean>;
  onPermissionChange: (action: PermissionAction, granted: boolean) => void;
  disabled?: boolean;
}

export const PermissionCategoryAccordion = ({
  category,
  permissions,
  roleTemplates,
  userOverrides,
  userRole,
  pendingChanges,
  onPermissionChange,
  disabled = false
}: PermissionCategoryAccordionProps) => {
  const IconComponent = (Icons as any)[category.icon] || Icons.HelpCircle;

  const getGrantedCount = () => {
    return permissions.filter(perm => {
      const override = userOverrides.find(o => o.permission_action === perm.action);
      if (override) return override.is_granted;
      
      const template = roleTemplates.find(t => t.role === userRole && t.permission_action === perm.action);
      return template?.is_granted_by_default || false;
    }).length;
  };

  const grantedCount = getGrantedCount();
  const totalCount = permissions.length;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={category.id} className="border rounded-lg mb-4">
        <AccordionTrigger className="px-6 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <IconComponent className="h-5 w-5 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto mr-2">
              {grantedCount}/{totalCount}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead className="text-center w-24">Default</TableHead>
                <TableHead className="text-center w-24">Override</TableHead>
                <TableHead className="w-48">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map(permission => {
                const override = userOverrides.find(o => o.permission_action === permission.action);
                const template = roleTemplates.find(
                  t => t.role === userRole && t.permission_action === permission.action
                );

                const pendingValue = pendingChanges.has(permission.action) 
                  ? pendingChanges.get(permission.action)! 
                  : null;

                return (
                  <PermissionRow
                    key={permission.action}
                    action={permission.action}
                    name={permission.name}
                    description={permission.description}
                    minimumTier={permission.minimum_tier}
                    isDangerous={permission.is_dangerous}
                    defaultGranted={template?.is_granted_by_default || false}
                    overrideGranted={override ? override.is_granted : null}
                    pendingValue={pendingValue}
                    onOverrideChange={onPermissionChange}
                    disabled={disabled}
                  />
                );
              })}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

import { useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function CampaignPlaceholder() {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || 'Feature';
  
  const title = path.charAt(0).toUpperCase() + path.slice(1);

  return (
    <div className="flex items-center justify-center h-[calc(100vh-250px)]">
      <Card className="w-full max-w-md text-center border-dashed border-2 shadow-none">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-xl font-bold">{title.charAt(0)}</span>
          </div>
          <CardTitle className="text-xl">Campaign {title}</CardTitle>
          <CardDescription>
            This tab is specific to the current campaign context. 
            All data shown here should be aggressively filtered by campaignId.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            UI placeholder for Phase 5 restructuring.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

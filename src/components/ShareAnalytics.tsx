import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Eye, 
  MapPin, 
  Clock, 
  Shield, 
  TrendingUp,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';

interface ShareAnalyticsProps {
  shareId: string;
}

interface ShareStats {
  id: string;
  views: number;
  max_views: number;
  expires_at: string;
  created_at: string;
  usage_analytics: {
    total_views?: number;
    unique_viewers?: number;
    geographic_data?: Array<{
      country: string;
      count: number;
    }>;
    device_data?: Array<{
      type: string;
      count: number;
    }>;
  };
}

interface ShareView {
  id: string;
  share_id: string;
  viewer_ip_hash: string;
  viewer_user_agent: string;
  location_data: {
    country?: string;
    city?: string;
  };
  viewed_at: string;
}

export function ShareAnalytics({ shareId }: ShareAnalyticsProps) {
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [views, setViews] = useState<ShareView[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation('wallet');

  const fetchAnalytics = async () => {
    if (!user || !shareId) return;

    try {
      // Fetch share stats
      const { data: shareData, error: shareError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', shareId)
        .eq('user_id', user.id)
        .single();

      if (shareError) {
        console.error('Error fetching share stats:', shareError);
        return;
      }

      setStats(shareData as ShareStats);

      // Fetch detailed view analytics
      const { data: viewsData, error: viewsError } = await supabase
        .from('share_analytics')
        .select('*')
        .eq('share_id', shareId)
        .order('viewed_at', { ascending: false });

      if (viewsError) {
        console.error('Error fetching view analytics:', viewsError);
        return;
      }

      setViews((viewsData || []) as ShareView[]);
    } catch (error) {
      console.error('Error in fetchAnalytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  const getCountryFlag = (country: string) => {
    const flagMap: Record<string, string> = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'GB': '🇬🇧',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'JP': '🇯🇵',
      'BR': '🇧🇷',
      'CN': '🇨🇳'
    };
    return flagMap[country] || '🌍';
  };

  const deviceStats = views.reduce((acc, view) => {
    const deviceType = getDeviceType(view.viewer_user_agent);
    acc[deviceType] = (acc[deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryStats = views.reduce((acc, view) => {
    const country = view.location_data?.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    fetchAnalytics();
  }, [shareId, user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground">
            Analytics data is not available for this share
          </p>
        </CardContent>
      </Card>
    );
  }

  const isExpired = new Date(stats.expires_at) < new Date();
  const viewsRemaining = stats.max_views - stats.views;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Views</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.views}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Views Left</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {viewsRemaining > 0 ? viewsRemaining : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Countries</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {Object.keys(countryStats).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-danger" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <div className="mt-2">
              <Badge variant={isExpired ? "destructive" : "default"}>
                {isExpired ? "Expired" : "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      {Object.keys(deviceStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(deviceStats).map(([device, count]) => {
                const percentage = Math.round((count / stats.views) * 100);
                const Icon = device === 'Mobile' ? Smartphone : Monitor;
                
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{count} views</span>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geographic Distribution */}
      {Object.keys(countryStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(countryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([country, count]) => {
                  const percentage = Math.round((count / stats.views) * 100);
                  
                  return (
                    <div key={country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(country)}</span>
                        <span className="text-sm font-medium">
                          {country === 'Unknown' ? 'Unknown Location' : country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{count} views</span>
                        <Badge variant="secondary">{percentage}%</Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Views */}
      {views.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {views.slice(0, 10).map((view) => (
                <div key={view.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCountryFlag(view.location_data?.country || 'Unknown')}</span>
                    <div>
                      <div className="text-sm font-medium">
                        {view.location_data?.city || 'Unknown City'}, {view.location_data?.country || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getDeviceType(view.viewer_user_agent)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(view.viewed_at).toLocaleDateString()} at{' '}
                    {new Date(view.viewed_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
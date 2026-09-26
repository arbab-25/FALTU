/** /app index — renders the right dashboard for the signed-in role. */
import { useAuth } from '@/context/AuthContext';
import CustomerDashboard from '@/pages/customer/Dashboard';
import CollectorDashboard from '@/pages/collector/Dashboard';
import RecyclerOverview from '@/pages/recycler/Overview';
import AdminAnalytics from '@/pages/admin/Analytics';

export default function AppIndex() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'collector': return <CollectorDashboard />;
    case 'recycler': return <RecyclerOverview />;
    case 'admin': return <AdminAnalytics />;
    default: return <CustomerDashboard />;
  }
}

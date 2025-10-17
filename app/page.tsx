import SnappFoodSearch from '@/components/SnappFoodSearch';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <SnappFoodSearch />
    </ProtectedRoute>
  );
}

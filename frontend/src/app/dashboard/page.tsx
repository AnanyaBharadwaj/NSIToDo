import ProtectedRoute from "../../components/ProtectedRoute";

function DashboardContent() {
  return <div>Welcome to your Dashboard!</div>;
}

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

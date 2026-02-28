import Dashboard from "@/pages/Dashboard";
import RoleGuard from "@/components/auth/RoleGuard";

export default function LearnerDashboard() {
  return (
    <RoleGuard allowedRole="learner">
      <Dashboard />
    </RoleGuard>
  );
}

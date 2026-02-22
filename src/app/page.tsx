import AssignmentDashboard from "@/components/assignment-dashboard";
import { getAssignments, getGroups } from "@/lib/db-helpers";

export default async function Home() {
  const [assignments, groups] = await Promise.all([
    getAssignments(),
    getGroups(),
  ]);
  return (
    <AssignmentDashboard
      initialAssignments={assignments}
      initialGroups={groups}
    />
  );
}


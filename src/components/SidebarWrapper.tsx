import { currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/actions/user.action";
import SidebarClient from "./Sidebar";

async function SidebarWrapper() {
  const authUser = await currentUser();
  if (!authUser) return <SidebarClient />;
  
  const user = await getUserByClerkId(authUser.id);
  if (!user) return <SidebarClient />;

  return <SidebarClient user={user} />;
}

export default SidebarWrapper; 
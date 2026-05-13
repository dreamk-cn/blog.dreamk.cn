import { listUsers } from "@/services/user-service";
import AdminUserListClient from "./user-list-client";

async function getInitialUserListData() {
  try {
    return {
      initialUsers: await listUsers({}),
      initialError: null,
    };
  } catch {
    return {
      initialUsers: [],
      initialError: "获取用户失败",
    };
  }
}

export default async function AdminUserListPage() {
  const data = await getInitialUserListData();
  return <AdminUserListClient {...data} />;
}

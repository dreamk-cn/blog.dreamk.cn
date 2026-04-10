"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, SelectItem, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { SearchIcon } from "@/components/icons";
import type { User } from "@prisma/client";
import { request } from "@/libs/request";

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async (kw = "", status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await request.get<User[]>("/users", { keyword: kw, status });
      if (res.code === 200) {
        setUsers(res.data || []);
      } else {
        setError(res.message || "获取用户失败");
      }
    } catch (err) {
      console.error("获取用户失败", err);
      setError("获取用户失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 搜索输入防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(keyword.trim(), statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, statusFilter]);

  const handleBanToggle = async (u: User, to: "BAN" | "VALID") => {
    try {
      setUpdatingId(u.id);
      const res = await request.put<User>(
        "/users",
        { id: u.id, status: to },
        { showSuccessMessage: true }
      );
      if (res.code === 200) {
        // 刷新列表并保持当前筛选
        fetchUsers(keyword, statusFilter);
      }
    } catch (err) {
      console.error("更新用户状态失败", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const tableItems = useMemo(() => users, [users]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索姓名或邮箱"
            startContent={<SearchIcon className="text-base text-default-400" />}
            className="max-w-sm"
          />
          <Select
            className="w-40"
            label="状态筛选"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
          >
            <SelectItem key="">全部</SelectItem>
            <SelectItem key="VALID">正常</SelectItem>
            <SelectItem key="BAN">封禁</SelectItem>
            <SelectItem key="DELETED">已删除</SelectItem>
          </Select>
        </div>
      </div>

      <Table aria-label="用户列表">
        <TableHeader>
          <TableColumn>姓名</TableColumn>
          <TableColumn>邮箱</TableColumn>
          <TableColumn>角色</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>创建时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody emptyContent={loading ? "加载中..." : (error || "暂无数据")} items={tableItems}>
          {tableItems.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name || "-"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.status}</TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {u.status !== "BAN" ? (
                    <Button
                      size="sm"
                      color="danger"
                      isDisabled={updatingId === u.id}
                      onPress={() => handleBanToggle(u, "BAN")}
                    >
                      {updatingId === u.id ? "封禁中..." : "封禁"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      color="primary"
                      variant="ghost"
                      isDisabled={updatingId === u.id}
                      onPress={() => handleBanToggle(u, "VALID")}
                    >
                      {updatingId === u.id ? "解禁中..." : "解禁"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full flex items-center px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors text-left"
    >
      Sign out
    </button>
  );
}

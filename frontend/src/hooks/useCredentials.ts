import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import api from "@/utils/axios";
import { Credential } from "@/types/credentials";

export const useCredentials = () => {
  const { message } = App.useApp();
  const router = useRouter();
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return router.replace("/login");
    
    try {
      const res = await api.get("/api/credentials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("authToken");
        return router.replace("/login?error=session_expired");
      }
      message.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    try {
      await api.delete(`/api/credentials/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setItems((prev) => prev.filter((x) => x._id !== id));
      message.success("Deleted");
    } catch {
      message.error("Delete failed");
    }
  };

  const addCredential = (credential: Credential) => {
    setItems((prev) => [credential, ...prev]);
  };

  const updateCredential = (credential: Credential) => {
    setItems((prev) => prev.map((x) => (x._id === credential._id ? credential : x)));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    fetchItems,
    handleDelete,
    addCredential,
    updateCredential,
  };
};

import { useState, useEffect } from "react";
import api from "@/utils/axios";
import { SkillsData } from "@/types/credentials";

export const useSkills = () => {
  const [skillsData, setSkillsData] = useState<SkillsData>({
    categories: {},
    allSkills: [],
    filterCategories: [],
  });
  const [loadingSkills, setLoadingSkills] = useState(false);

  const fetchSkills = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    setLoadingSkills(true);
    try {
      const res = await api.get("/api/skills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSkillsData(res.data);
    } catch (e: any) {
      console.error("Failed to load skills data:", e);
      // Don't show error message as this is not critical
    } finally {
      setLoadingSkills(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  return {
    skillsData,
    loadingSkills,
    fetchSkills,
  };
};

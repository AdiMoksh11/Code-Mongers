"use client";

import dynamic from "next/dynamic";

const SkillGapIndiaMap = dynamic(() => import("./SkillGapIndiaMapClient"), {
  ssr: false, 
});

export default SkillGapIndiaMap;

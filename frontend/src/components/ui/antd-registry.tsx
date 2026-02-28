"use client";

import React from "react";
import { StyleProvider, createCache, extractStyle } from "@ant-design/cssinjs";

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createCache());
  return <StyleProvider cache={cache} hashPriority="high">{children}</StyleProvider>;
}

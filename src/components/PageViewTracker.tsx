import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId() {
  let sid = sessionStorage.getItem("pv_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("pv_sid", sid);
  }
  return sid;
}

export default function PageViewTracker() {
  const { pathname } = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    // Skip admin routes and duplicate tracking
    if (pathname.startsWith("/admin") || pathname === lastPath.current) return;
    lastPath.current = pathname;

    supabase.from("page_views").insert({
      path: pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    }).then(); // fire-and-forget
  }, [pathname]);

  return null;
}

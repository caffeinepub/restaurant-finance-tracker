import { Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { useCallerProfile } from "../hooks/useQueries";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { ProfileSetupModal } from "./ProfileSetupModal";

export function AppLayout() {
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const [profileSaved, setProfileSaved] = useState(false);

  const needsProfile = !profileLoading && profile === null && !profileSaved;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 ml-[260px] overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <ProfileSetupModal
        open={needsProfile}
        onDone={() => setProfileSaved(true)}
      />
    </div>
  );
}

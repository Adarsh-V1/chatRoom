import type { Metadata } from "next";
import { ProfileClientOnly } from "./ProfileClientOnly";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return <ProfileClientOnly />;
}

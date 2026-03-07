import type { Metadata } from "next";
import { SettingsClientOnly } from "./SettingsClientOnly";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsClientOnly />;
}

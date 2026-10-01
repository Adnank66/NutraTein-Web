import InteractiveProductCardDemo from "@/components/ui/demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Card Demo | NUTRATEIN",
  description: "Interactive demo of the 3D Perspective Card component."
};

export default function DropdownDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <InteractiveProductCardDemo />
    </div>
  );
}

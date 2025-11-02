"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export/rekap");

      // cek status dulu
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let msg = `Status ${res.status}`;
        if (contentType.includes("application/json")) {
          const json = await res.json();
          msg = json.error || JSON.stringify(json);
        } else {
          msg = await res.text();
        }
        alert("Gagal mengekspor: " + msg);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-kas-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengekspor data (client error)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Mengekspor..." : "Export Excel"}
    </Button>
  );
}
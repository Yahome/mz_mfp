import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import RecordForm from "@/pages/RecordForm";
import VisitList from "@/pages/VisitList";

export default function AppEntry() {
  const [params] = useSearchParams();
  const patientNo = params.get("patient_no") || undefined;
  const [sectionStats, setSectionStats] = useState<Record<string, any> | null>(null);

  return (
    <AppLayout patientNo={patientNo} showFormNav={!!patientNo} sectionStats={sectionStats || undefined}>
      {patientNo ? <RecordForm patientNo={patientNo} onStatsChange={setSectionStats} /> : <VisitList />}
    </AppLayout>
  );
}

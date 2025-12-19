import { useSearchParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import RecordForm from "@/pages/RecordForm";
import VisitList from "@/pages/VisitList";

export default function AppEntry() {
  const [params] = useSearchParams();
  const patientNo = params.get("patient_no") || undefined;

  return (
    <AppLayout patientNo={patientNo} showFormNav={!!patientNo}>
      {patientNo ? <RecordForm patientNo={patientNo} /> : <VisitList />}
    </AppLayout>
  );
}


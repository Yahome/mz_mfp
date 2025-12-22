import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import RecordForm from "@/pages/RecordForm";
import VisitList from "@/pages/VisitList";

type ValidationError = {
  field: string;
  message: string;
  section?: string;
};

export default function AppEntry() {
  const [params] = useSearchParams();
  const patientNo = params.get("patient_no") || undefined;
  const [sectionStats, setSectionStats] = useState<Record<string, any> | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleErrorClick = (error: ValidationError) => {
    // TODO: Implement navigation to error field
    console.log("Error clicked:", error);
  };

  return (
    <AppLayout
      patientNo={patientNo}
      showFormNav={!!patientNo}
      sectionStats={sectionStats || undefined}
      validationErrors={validationErrors}
      onErrorClick={handleErrorClick}
    >
      {patientNo ? (
        <RecordForm
          patientNo={patientNo}
          onStatsChange={setSectionStats}
          onValidationErrorsChange={setValidationErrors}
        />
      ) : (
        <VisitList />
      )}
    </AppLayout>
  );
}

import request from '@/utils/request';

export interface BaseInfo {
    XM: string;
    XB: string; // "1"
    JZSJ: string;
    [key: string]: any;
}

export interface FeeSummary {
    [key: string]: any;
}

export interface PrefillData {
    base_info: BaseInfo;
    fee_summary: FeeSummary;
    diagnoses: any[];
    [key: string]: any;
}

export const getPrefillDataApi = (patientNo: string) => {
    return request.get<any, PrefillData>('/mz_mfp/prefill', {
        params: { patient_no: patientNo }
    });
};

export const saveDraftApi = (data: any) => {
    return request.post('/mz_mfp/records/draft', data);
};

export const submitRecordApi = (data: any) => {
    return request.post('/mz_mfp/records/submit', data);
};

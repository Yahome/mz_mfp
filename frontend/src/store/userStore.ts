import { create } from 'zustand';

interface UserState {
    token: string | null;
    patientNo: string | null;
    setToken: (token: string) => void;
    setPatientNo: (no: string) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    token: localStorage.getItem('token'),
    patientNo: localStorage.getItem('patient_no'),

    setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token });
    },

    setPatientNo: (no: string) => {
        localStorage.setItem('patient_no', no);
        set({ patientNo: no });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('patient_no');
        set({ token: null, patientNo: null });
    },
}));

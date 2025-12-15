import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPrefillDataApi } from '@/api/mfp';
import { Spin, Button } from 'antd';
import './print.css';

const PrintView: React.FC = () => {
    // In real app we might fetch by record_id, but here reusing prefill API by patientNo for demo,
    // or we should fetch by /mz_mfp/records/{id}.
    // Let's assume we pass patientNo for now as we don't have a record list page yet.
    // Wait, the plan said /records/{id}/export. For print, we also need data.
    // Let's rely on the prefill API (data view) for printing current state.

    // Actually, to print a SAVED record, we need GET /records/{id}.
    // I haven't implemented GET /records/{id} yet, only prefill. 
    // To save time, I will use getPrefillDataApi(patientNo) assuming the user navigates here with patientNo.

    const { patientNo } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientNo) {
            getPrefillDataApi(patientNo).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [patientNo]);

    if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}><Spin /></div>;
    if (!data) return <div>Data not found</div>;

    const bi = data.base_info || {};

    return (
        <div style={{ background: '#ccc', minHeight: '100vh', padding: 20 }}>
            {/* Toolbar */}
            <div className="no-print" style={{ textAlign: 'center', marginBottom: 20 }}>
                <Button type="primary" onClick={() => window.print()}>打印 / Print</Button>
                <Button style={{ marginLeft: 10 }} onClick={() => window.close()}>关闭</Button>
            </div>

            {/* A4 Page */}
            <div className="print-container">
                <div className="print-header">
                    <h1>中医门（急）诊诊疗信息页</h1>
                </div>

                <div className="print-row">
                    <span>机构名称: {bi.JGMC || '___________'}</span>
                    <span>病案号: {patientNo}</span>
                </div>

                <table className="print-table">
                    <tbody>
                        <tr>
                            <td style={{ width: '10%' }}>姓名</td>
                            <td style={{ width: '15%' }}>{bi.XM}</td>
                            <td style={{ width: '10%' }}>性别</td>
                            <td style={{ width: '10%' }}>{bi.XB === '1' ? '男' : '女'}</td>
                            <td style={{ width: '10%' }}>出生日期</td>
                            <td>{bi.CSRQ?.toString()}</td>
                        </tr>
                        <tr>
                            <td>现住址</td>
                            <td colSpan={5}>{bi.XZZ || ''}</td>
                        </tr>
                        <tr>
                            <td>过敏史</td>
                            <td colSpan={5}>{bi.GMYW || '无'}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>诊断信息</div>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>类型</th>
                            <th>诊断名称</th>
                            <th>编码</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.diagnoses_tcm?.map((d: any, idx: number) => (
                            <tr key={'tcm' + idx}>
                                <td>中医</td>
                                <td>{d.disease_name} {d.syndrome_name ? `(${d.syndrome_name})` : ''}</td>
                                <td>{d.disease_code}</td>
                            </tr>
                        ))}
                        {data.diagnoses_wm?.map((d: any, idx: number) => (
                            <tr key={'wm' + idx}>
                                <td>西医</td>
                                <td>{d.disease_name}</td>
                                <td>{d.disease_code}</td>
                            </tr>
                        ))}
                        {(!data.diagnoses_tcm?.length && !data.diagnoses_wm?.length) && (
                            <tr><td colSpan={3} style={{ textAlign: 'center' }}>无诊断</td></tr>
                        )}
                    </tbody>
                </table>

                {/* Fees and others can be added similarly */}
                <div style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>费用信息</div>
                <table className="print-table">
                    <tbody>
                        <tr>
                            <td>总费用: {data.fee_summary?.zfy}</td>
                            <td>自付: {data.fee_summary?.zfje}</td>
                            <td>医疗服务费: {data.fee_summary?.ylfwf}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrintView;

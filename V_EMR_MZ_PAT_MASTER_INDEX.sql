select 
'益阳市第一中医医院' JGMC, --医疗机构名称
'736798027' ZZJGDM, --组织机构代码
'益阳市第一中医医院' USERNAME, --对应的系统登录用户名
b.blh JZKH, --就诊卡号或病案号
c.BRXM XM, --姓名
case when c.XB is null or c.XB = '' then '0'
else c.XB end XB, --性别

case when (c.hyzk is null or c.hyzk = '') then '9'
else c.hyzk end HY, --性别
 

CAST(c.CSRQ AS DATE) csrq, --出生日期

CASE WHEN c.gj is null or c.gj = '' then 'CHN'
ELSE (select ThreeLetters from JC_COUNTRYC country where c.gj = country.code ) end gj, --国籍

CASE WHEN C.gj is null or c.gj = '' THEN '1'
WHEN c.gj = '156' and (c.mz is null or c.mz = '') then '1'
when c.gj != '156' then '99'
else (select code2 from JC_NATIONCO nationco where nationco.code = c.mz) end mz, --民族

case when (c.sfzh is not null and c.sfzh != '') then '1'
when (c.sfzh is null and c.sfzh = '') and (d.qtzjlx is not null and d.qtzjlx != '')  
then (select code2 from jc_qtzjlx zjlx where zjlx.name = d.qtzjlx)
else '-' end ZJLB, --证件类别：有身份证号则身份证，没身份证则其他证件类别，都无则-

case when (c.sfzh is not null and c.sfzh != '') then c.sfzh
when (c.sfzh is null and c.sfzh = '') and (d.qtzjhm is not null and d.qtzjhm != '')  
then d.qtzjhm
else '-' end ZJHM, --证件号码：有身份证则身份证，没身份证则其他证件号码，都无则-

case when (c.jtdz is not null and c.jtdz != '') then c.jtdz
when (c.csdz is not null and c.csdz != '') then c.csdz
when (c.GZDWDZ is not null and c.GZDWDZ != '') then c.GZDWDZ
else '-' end XZZ, --现住址：排序1.家庭住址 2.出生地址 3.工作单位地址

case when (c.brlxfs is not null and c.brlxfs != '') then c.brlxfs
when (d.lxrdh is not null and d.lxrdh != '') then d.lxrdh
when (c.GZDWDH is not null and c.GZDWDH != '') then c.GZDWDH
else '-' end LXDH, --联系电话：排序1.病人电话 2.联系人电话 3.工作单位电话

b.GHSJ GHSJ, --挂号时间
b.JZSJ BDSJ, --报道时间
b.JZSJ JZSJ, --就诊时间

e.name jzks, --接诊科室
e.dept_hqms_code jzksdm, --标准编码
a.JSKSDM jzksdmhis, --HIS科室代码

f.name JZYS,
g.YS_TYPEID jzyszc,
f.EMPLOYEE_ID jzysdm

 FROM vi_MZYS_JZJL a
    LEFT JOIN VI_MZ_GHXX b ON a.ghxxid = b.ghxxid
    left join yy_brxx c on b.BRXXID = c.BRXXID
    left join yy_brxx_bc d on d.BRXXID = c.brxxid
    left join JC_DEPT_PROPERTY e on e.dept_id = a.jsksdm
    left join JC_EMPLOYEE_PROPERTY f on f.EMPLOYEE_ID = a.jsysdm
    left join JC_ROLE_DOCTOR g on g.employee_id = f.EMPLOYEE_ID
    
    where a.jssj >= '2025-01-01'
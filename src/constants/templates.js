/* src/constants/templates.js */

export const APP_VERSION = 'v22.1';

export const DEFAULT_INCIDENT_BODY = `รายงานเหตุการณ์ไม่ปกติ
วันที่ {current_date}

- รายละเอียดเหตุการณ์:
{narrative}

- การดำเนินการ:
{action_taken}

=============
งานบริหารหลุมจอด (Apron Control)
สบข.ฝปข.ทภก.
Tel. 076-351-581
=============`;

export const DEFAULT_VIOLATOR_BODY = `รายงานผู้กระทำความผิด
วันที่ {current_date}

เมื่อเวลา {incident_time} น. เจ้าหน้าที่งานกะควบคุมจราจรภาคพื้น ได้ตรวจพบ {violator_name} หมายเลขบัตร {id_card} สังกัด {company} ตำแหน่ง {position}

ได้ ขับรถ {vehicle_type} หมายเลข {vehicle_no} ภายในเขตลานจอดอากาศยานบริเวณ {location} โดย ขับรถ 

สบข.ฝปข.ทภก. พิจารณาแล้ว การกระทำดังกล่าวไม่ปฏิบัติตามหลักเกณฑ์ของ ทภก. ทั้งนี้ สบข.ฝปข.ทภก. ได้ทำการยึดบัตร {violator_name} เป็นเวลา {seizure_days} วัน ตั้งแต่วันที่ {seizure_start} - {seizure_end} และแจ้งให้เข้ารับการทบทวนการอบรมการขับขี่ยานพาหนะในเขตลานจอดฯ ในวันพุธที่ {retraining_date}

=============
งานควบคุมจราจรภาคพื้น (Follow Me)
สบข.ฝปข.ทภก.
Tel. 076-351-085
=============`;

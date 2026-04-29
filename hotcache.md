# hotcache — Incident Reporter
> อัปเดตล่าสุด: 2026-04-24 | อ่านก่อนทำงานทุกครั้ง หยุดที่นี่ถ้าคำตอบอยู่ในนี้

---

## What This Project Is
- **Stack:** React 19 + Vite 6 + Supabase (PostgreSQL + Auth)
- **Role:** Web app สำหรับออกรายงานเหตุการณ์ในลาน (apron incident report)
- **Deploy:** GitHub Pages → remote ชื่อ `production` (ไม่ใช่ `origin`)
- **Shared DB:** ใช้ Supabase เดียวกับ `apron-management-system` — ห้าม drop/alter โดยไม่ backup

---

## Current State (Phase 30 — เสร็จแล้ว)

**Features ที่ทำงานอยู่:**
- สร้าง/แก้ไข/ใช้งาน template ฟอร์มรายงาน (incident & violator mode)
- Mapping ช่องข้อมูลกับ HTML preview แบบ real-time
- AI Translation (Gemini 2.5-flash-lite) → CAAT-22 format
- History บันทึกรายงานที่สร้างแล้ว (per user, RLS protected)
- Folder system จัดกลุ่ม template
- 3 roles: operation / supervisor / admin

**Security fixes (Phase 30):**
- XSS: DOMPurify ครอบทุก `innerHTML` ใน `useHtmlPreview.js`
- RLS: `user_templates` + `user_folders` → delete ได้เฉพาะ supervisor/admin
- Operation ลบ template/folder ไม่ได้แม้ผ่าน devtools

**Google Sheets Audit Log (Phase 30):**
- Supabase Webhook (INSERT/UPDATE on `user_templates`) → `Template_Backups` sheet
- Client GET → `Activity_Log` sheet (ใครสร้าง/ลบ เมื่อไหร่)
- GAS URL: `https://script.google.com/macros/s/AKfycbx9U_QsIf4X8W8U7LAxxROE-Rwy3yInKJ4GlwvMPYKWUMHl49bi0l7eRQ2mDXyKCJzl7A/exec`
- Restore ฟอร์มที่ถูกลบ: `restoreByName('ชื่อฟอร์ม')` ใน Apps Script

---

## Recent Decisions

- **Shared DB model:** ทุก user เห็น template/folder ของกันหมด — ตั้งใจ ไม่ใช่ bug (อย่าเพิ่ม `.eq('user_id')` filter ใน templates/folders)
- **useHistory รับ `user` object ทั้งก้อน** ไม่ใช่แค่ `userId` — เพื่อให้ได้ username/role สำหรับ log
- **GAS logging ใช้ GET + URL params** (ไม่ใช่ POST) เพราะ GAS redirect ทำให้ POST body หาย
- **DOMPurify sanitize ก่อน innerHTML เสมอ** — ห้ามเอาออก

---

## Known Patterns / Pitfalls

- `dangerouslySetInnerHTML` ไม่ update contentEditable หลัง render ครั้งแรก → ต้องใช้ `ref.innerHTML` เสมอ
- ทุก `handleSelectTemplate` ต้องสร้าง session fingerprint ใหม่ด้วย `Date.now()`
- `hydrateHtmlTemplate` ต้อง update sync-field ที่มีอยู่แล้ว อย่า skip
- Template save path ผ่าน `handleSaveTemplateChoice` (SaveTemplateModal) ไม่ใช่ `saveReport`
- `saveReport` = บันทึกลง `incident_history` (copy button)
- `handleSaveTemplateChoice` = บันทึกลง `user_templates` (save/save-as button)

---

## Pending / Open Questions

- Preview HTML ใน `Template_Backups` ยังว่างอยู่ — รอยืนยัน column name จาก Debug sheet
- ยังไม่ได้ add `TEMPLATE_SAVED` event ลง Activity_Log (save ผ่าน GET แต่ยังไม่ขึ้น — debug อยู่)
- `user_id` ใน Template_Backups = UUID ยังไม่ map กับ username

---

## How to Update This File
หลังงานเสร็จแต่ละชิ้น → เพิ่มใน Current State หรือ Recent Decisions
ห้ามจด attempt ที่ล้มเหลว — จดเฉพาะสิ่งที่ work แล้วเท่านั้น

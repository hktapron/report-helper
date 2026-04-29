# Incident Reporter — Project Rules

## ⚡ Step 0 — อ่าน hotcache.md ก่อนทำอะไรทั้งนั้น
- ไฟล์อยู่ที่ `hotcache.md` (ใน root ของโปรเจคนี้เลย)
- ถ้าคำตอบอยู่ที่นี่ **หยุด** ไม่ต้องเปิดไฟล์อื่น
- ถ้ามี cross-project alert → ดูเพิ่มที่ `../hotcache.md` (workspace-level)

## Stack
- React + Vite
- Supabase (shared DB กับ apron-management-system)
- Design: Rich Dark Mode, Glassmorphism, Indigo/Blue — ห้ามเบี่ยง

## Critical Rules (จาก MASTER_GUIDELINES)
- **ห้ามใช้ `dangerouslySetInnerHTML`** หลัง render ครั้งแรก — ใช้ `useEffect` + `ref.innerHTML` แทน
- **Unique Session Fingerprint** — ทุก `handleSelectTemplate` ต้องสร้าง ID ใหม่ด้วย `Date.now()`
- **`hydrateHtmlTemplate`** — ต้องตรวจ sync-field ก่อน ถ้ามีแล้วให้ update ไม่ใช่ skip

## Scope
- ห้ามแตะ `../apron-management-system/` หรือ `../stand_monitor/`
- Supabase schema changes → แจ้ง user ก่อนเสมอ (shared DB)

## After Work
- สำเร็จ → บันทึกลง `hotcache.md` (ของโปรเจคนี้)
- cross-project decision → บันทึกลง `../hotcache.md` ด้วย
- ไม่สำเร็จ → ไม่ต้องจด

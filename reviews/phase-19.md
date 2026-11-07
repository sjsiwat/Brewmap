# Review — Phase 19: ตรวจความปลอดภัยและบั๊กก่อนเปิดให้คนอื่นทดสอบ

## Round 1 — 2026-11-07
**Range:** `main..3fa3c9c`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 11 suites / 57 tests → `test:e2e` 5 suites / 68 tests → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด 415 static pages)

### Findings
1. **[nit]** [build_cafes_all.py](web/scripts/scrape-cafes/build_cafes_all.py#L246-L259) — การตัดแบ่งร้านรอบ 1–2 ด้วย `previous[:FIRST_NEW]` อิงตำแหน่งใน array แทน `index`
   - เกิดเมื่อ: ปัจจุบันทั้ง 3 ร้านที่ถูกคัดออกด้วย `EXCLUDED_CATEGORIES` อยู่ในรอบ 3 (`index > 173`) จึงไม่มีผลกระทบ แต่ถ้าอนาคตเพิ่มหมวดใน `EXCLUDED_CATEGORIES` แล้วตรงกับร้านใน 173 อันดับแรก การรัน `build_cafes_all.py` ครั้งถัดไปจะทำให้ `previous[:FIRST_NEW]` ดึงร้านลำดับ `174+` เข้ามาปนและถูกสร้างซ้ำในลูป `range(FIRST_NEW, len(raw))`
   - แนะนำ: กรองด้วย `[c for c in previous if int(c['index']) <= FIRST_NEW]` แทนการ slice ตามจำนวน

### สิ่งที่ทำได้ดี
- [`jwtSecret`](server/src/auth/auth.constants.ts#L34-L45) และ [`AuthModule`](server/src/auth/auth.module.ts#L18-L21) ป้องกันการรัน production ด้วย secret ที่ว่าง เป็นค่าตัวอย่าง (`change-me`) หรือสั้นกว่า 32 ตัวอักษร พร้อม unit test ครบทุกกรณีใน [auth.constants.spec.ts](server/src/auth/auth.constants.spec.ts#L1-L27)
- [`tidy`](web/scripts/scrape-cafes/build_cafes_all.py#L117-L135), [`clean_name`](web/scripts/scrape-cafes/build_cafes_all.py#L142-L157) และ [`thai_name`](web/scripts/scrape-cafes/build_cafes_all.py#L207-L232) จัดการวงเล็บว่าง วงเล็บไม่สมดุล ชื่ออังกฤษในวงเล็บ และคำทั่วไป (เช่น `. CAFE`) ได้ครบถ้วน โดยคง `slug` เดิมไว้ตาม `index` (`slug_of`) ไม่ทำให้ URL หรือการ seed ซ้ำซ้อน
- [`CafeFinder`](web/components/cafe-finder.tsx#L298-L434) แสดงจำนวนผลลัพธ์และปุ่มโหลดเพิ่มด้วย `toLocaleString(intlLocale[lang])` สอดคล้องกับระบบ i18n ของเว็บ

## Response
- nit 1 (`previous[:FIRST_NEW]` อิงตำแหน่ง): แก้แล้ว — กรองด้วย index แทน; ผลลัพธ์ cafes.json เหมือนเดิมทุกไบต์ และรันซ้ำได้ผลเดิม — f7dca7d

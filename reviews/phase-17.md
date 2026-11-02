# Review — Phase 17: คาเฟ่ทั่วเชียงใหม่ (scrape รอบ 3)

## Round 1 — 2026-11-02
**Range:** `main..e121f9c`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 10 suites / 52 tests → `test:e2e` 5 suites / 67 tests → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด 415 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- Pipeline การรวมและกรองข้อมูลใน [build_raw_all.py](web/scripts/scrape-cafes/build_raw_all.py#L1-L128) และ [build_cafes_all.py](web/scripts/scrape-cafes/build_cafes_all.py#L1-L223) คงลำดับและข้อมูลของ 173 ร้านเดิมไว้ไม่เปลี่ยน ลบข้อมูลส่วนบุคคลของผู้รีวิวตั้งแต่ก่อนเขียนลง `raw-all.json` และผูก `index` ตามตำแหน่งใน `raw-all.json` ทำให้สคริปต์ฝั่ง server ([raw-scrape.ts](server/scripts/raw-scrape.ts#L48-L51), [import-opening-hours.ts](server/scripts/import-opening-hours.ts#L42-L52)) อ้างอิงร้านเดียวกันได้ตรงแม้มีรายการที่ถูกคัดออก
- [`cleanEnrichment`](server/scripts/enrich-cafes.ts#L160-L201) และ [`reviewLines`](server/scripts/enrich-cafes.ts#L204-L213) ตรวจสอบผลลัพธ์จาก Gemini อย่างรัดกุม (กรองเฉพาะ 36 แท็กที่ระบบรองรับ, ปฏิเสธข้อความภาษาไทยหรือ placeholder อย่าง `N/A` สำหรับสถานที่ที่ไม่ใช่คาเฟ่, บันทึกแบบ atomic write ต่อร้าน) พร้อม unit tests ใน [enrich-cafes.spec.ts](server/scripts/enrich-cafes.spec.ts#L1-L67)
- ฝั่งเว็บปรับการ prerender ใน [`generateStaticParams`](web/app/%5Blang%5D/cafes/%5Bslug%5D/page.tsx#L17-L29) ให้สร้างล่วงหน้าเฉพาะ 200 ร้านแนะนำสูงสุดผ่าน [`getTopCafeSlugs`](web/lib/api.ts#L155-L164) และเปิด `dynamicParams = true` ร่วมกับการถอด `dynamicParams = false` ออกจาก [layout.tsx](web/app/%5Blang%5D/layout.tsx#L48-L52) ทำให้หน้าร้านที่เหลือ render เมื่อเปิดครั้งแรกและ cache ต่อได้โดยไม่เกิด 404

## Response
- ไม่มี finding ไม่มีอะไรต้องแก้

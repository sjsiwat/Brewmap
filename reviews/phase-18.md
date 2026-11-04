# Review — Phase 18: ค้นหาด้วยชื่อร้านภาษาไทย

## Round 1 — 2026-11-04
**Range:** `main..66539f9`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 10 suites / 52 tests → `test:e2e` 5 suites / 68 tests → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด 415 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- [build_names_th.py](web/scripts/scrape-cafes/build_names_th.py#L14-L35) เก็บเฉพาะ `place_id → title` ลง `names-th.json` โดยไม่เก็บข้อมูลส่วนบุคคล และ [`thai_name`](web/scripts/scrape-cafes/build_cafes_all.py#L169-L197) ใน [build_cafes_all.py](web/scripts/scrape-cafes/build_cafes_all.py) คัดกรองชื่อซ้ำภาษาอังกฤษ วงเล็บไม่ปิด และคำต่อท้ายที่เป็นเพียงชื่อสาขาหรือย่านออกอย่างรัดกุม
- [`searchWords`](server/src/cafes/dto/query-cafes.dto.ts#L66-L74) และ [`CafesService.buildFilter`](server/src/cafes/cafes.service.ts#L224-L233) รองรับการค้นหาทั้ง `name` และ `nameTh` รวมถึงการตัดคำนำหน้า `"ร้าน"` ออกก่อนจับคู่ substring regex ทำให้ค้นหาได้ทั้งแบบมีและไม่มีคำว่า `"ร้าน"` นำหน้า พร้อม e2e test ใน [cafes.e2e-spec.ts](server/test/cafes.e2e-spec.ts#L333-L346)
- ฝั่งแสดงผลใน [`CafeCard`](web/components/cafe-card.tsx#L37-L41) และ [`CafeDetail`](web/components/cafe-detail.tsx#L74-L78) แสดง `nameTh` พร้อม `lang="th"` เฉพาะเมื่อมีค่า และสอดคล้องกับโครงสร้าง DTO ([`CafeResponseDto`](server/src/cafes/dto/cafe-response.dto.ts#L10-L11)) และ type [`Cafe`](web/lib/cafes.ts#L19-L20)

## Response
- ไม่มี finding ไม่มีอะไรต้องแก้

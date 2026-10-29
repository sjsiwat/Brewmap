# Review — Phase 16: เรียงใกล้สุดเป็นค่าเริ่มต้น + ตัวกรองคะแนน/รีวิว

## Round 1 — 2026-10-29
**Range:** `main..f2f7c1f`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` 40/40 → `test:e2e` 67/67 → `build` ผ่านทั้งหมด)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด 361 static pages)

### Findings
ไม่มี (ไม่พบปัญหาในระดับ blocker / major / minor / nit)

### สิ่งที่ทำได้ดี
- Validation ของ `minRating` (`0–5`) และ `minReviews` (`int ≥ 0`) ใน [`QueryCafesDto`](server/src/cafes/dto/query-cafes.dto.ts#L124-L140) ใช้ `@Transform(emptyToUndefined)` ร่วมกับ `@Type(() => Number)` สอดคล้องกับ query field อื่น ๆ และนำไปกรองใน [`CafesService.buildFilter`](server/src/cafes/cafes.service.ts#L215-L220) ซึ่งทำงานร่วมกับทั้ง `$geoNear` และ query ปกติได้ทันที
- E2E test ใน [cafes.e2e-spec.ts](server/test/cafes.e2e-spec.ts#L80-L98) ครอบคลุมทั้งการกรองร่วมกับ `lat`/`lng` + `sort=distance` และเคสค่าผิด (`minRating=6`, `minReviews=-1`, `minReviews=1.5` → `400`)
- ฝั่งเว็บใน [`CafeFinder`](web/components/cafe-finder.tsx#L27-L87), [`FilterChips`](web/components/filter-chips.tsx#L157-L172) และ [finder-filters.ts](web/lib/finder-filters.ts#L46-L90) ตั้งค่าเริ่มต้นเป็น `distance` พร้อมจัดรูปแบบตัวเลขด้วย `toLocaleString(locale)` รองรับทั้งภาษาไทยและอังกฤษ ([en.ts](web/lib/i18n/en.ts#L251-L274), [th.ts](web/lib/i18n/th.ts#L340-L363))

## Response
- ไม่มี finding ไม่มีอะไรต้องแก้

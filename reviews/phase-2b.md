# Review — Phase 2b: แก้ข้อเสนอแนะจาก review Phase 2 + Gate ของ reviewer

## Round 1 — 2026-10-27
**Range:** `5f03977..phase-2b-review-followups`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (2 passed) → `test:e2e` (11 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` (179 static pages generated))

### Findings
ไม่พบปัญหาในระดับ `blocker`, `major`, `minor` หรือ `nit` — งานครบทุกข้อตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L126-L136) (2b.1–2b.3)

### สิ่งที่ทำได้ดี (optional)
- **Selective Page Retry (2b.1):** [`useCafeSearch`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/lib/use-cafe-search.ts#L30-L111) ปรับ `pageKey` ให้เป็น `${queryKey}|${page}` และให้ `retry()` ลบเฉพาะ key ที่มี `"error" in results[key]` ออกจากทั้ง `requested.current` และ `results` ก่อน bump `attempt` เพื่อทริกเกอร์ `useEffect` ทำให้หน้าที่โหลดสำเร็จแล้วไม่ถูกยิงซ้ำ
- **Consistent Empty Query Transform (2b.2):** export [`emptyToUndefined`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L29-L30) ไปใช้กับ `tag`, `area` ใน [`QueryCafesDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/query-cafes.dto.ts#L73-L81) และ `tag` ใน [`TopCafesDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/cafes/dto/top-cafes.dto.ts#L5-L10) พร้อมเพิ่มเคสทดสอบใน [`server/test/cafes.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/cafes.e2e-spec.ts#L114-L124)
- **Root Gate Scripts (2b.3):** เพิ่ม `gate:server` และ `gate:web` ใน [`package.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/package.json#L11-L12) ที่ root พร้อม `lint:check` (ไม่ `--fix`) และ `typecheck` ใน [`server/package.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/package.json#L16-L17) และ [`web/package.json`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/package.json#L9-L10) ทำให้รันตรวจ Gate ทั้งหมดจาก root ได้โดยตรงและไม่แก้ไขไฟล์ระหว่างตรวจ

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->

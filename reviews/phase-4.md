# Review — Phase 4: Reviews

## Round 1 — 2026-10-27
**Range:** `c93f9b0..phase-4-reviews`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (2 suites, 4 passed) → `test:e2e` (3 suites, 36 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` (182 static pages generated + Proxy middleware enabled))

### Findings
ไม่พบปัญหาในระดับ `blocker` หรือ `major` — งานครบตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L202-L216) (4.1–4.6) ทั้งฝั่ง Backend, Frontend และ e2e tests

1. **[minor]** [`server/src/reviews/dto/review.dto.ts:37`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/dto/review.dto.ts#L37-L56) และ [`server/src/reviews/reviews.service.ts:99`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/reviews.service.ts#L99-L105) — ใน [`UpdateReviewDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/dto/review.dto.ts#L37-L56) ใช้ `@IsOptional()` กับ `rating` และ `text` ซึ่งใน `class-validator` จะข้ามการตรวจเมื่อค่าเป็นทั้ง `undefined` และ `null` แต่ใน [`ReviewsService.update`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/reviews.service.ts#L99-L105) เช็กเฉพาะ `!== undefined` (`if (dto.rating !== undefined) review.rating = dto.rating;`)
   - เกิดเมื่อ: เรียก `PATCH /api/reviews/:id` โดยส่ง JSON `{"rating": null}` หรือ `{"text": null}` ตรงเข้า API — `ValidationPipe` จะปล่อยผ่าน แต่ `review.save()` จะโยน Mongoose `ValidationError` กลายเป็น HTTP 500 แทนที่จะเป็น 400 (ไม่กระทบการใช้งานผ่าน UI ปกติ และข้อมูลใน DB ไม่เสียหายเพราะ schema บังคับ `required: true`)
   - แนะนำ: ใช้ `@ValidateIf((_, value) => value !== undefined)` แทน `@IsOptional()` สำหรับ `rating` และ `text` ใน [`UpdateReviewDto`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/dto/review.dto.ts#L37-L50) เพื่อให้ค่า `null` ถูกปฏิเสธด้วย 400 Bad Request

2. **[minor]** [`web/components/cafe-reviews.tsx:277`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-reviews.tsx#L273-L292) — ใน [`loadMore`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-reviews.tsx#L273-L292) คำนวณหน้าถัดไปจาก `Math.floor(list.items.length / PAGE_SIZE) + 1` ร่วมกับการกรองรายการซ้ำ (`!list.items.some((x) => x.id === r.id)`)
   - เกิดเมื่อ: มีร้านที่มีรีวิวมากกว่า 2 หน้า (เช่น 21 รีวิว) แล้วระหว่างที่ผู้ใช้เปิดหน้าแรกอยู่ มีคนโพสต์รีวิวใหม่เข้ามา 1 รายการ ทำให้เมื่อกด `Show more reviews` ครั้งแรก (ขอ `page: 2`) มีรีวิว 1 รายการที่เลื่อนลงมาจากหน้าแรกและถูกกรองซ้ำออก เหลือ `list.items.length === 19` (`< PAGE_SIZE * 2`) การกด `Show more reviews` ครั้งถัดไปจึงคำนวณ `Math.floor(19 / 10) + 1 = 2` และยิงขอ `page: 2` ซ้ำเดิมแทนที่จะไป `page: 3`
   - แนะนำ: เก็บเลขหน้าล่าสุดที่โหลดแล้วไว้ใน state ของ `list` (เช่นใช้ `list.page + 1` จาก `next.page`) แทนการคำนวณจาก `list.items.length`

### สิ่งที่ทำได้ดี (optional)
- **การตรวจสิทธิ์เจ้าของรีวิวและสถานะ HTTP (401 / 403 / 404 / 409):** [`ReviewsService.findOwned`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/reviews.service.ts#L117-L129) ตรวจสอบ `Types.ObjectId.isValid(reviewId)` ก่อนคิวรี (คืน 404 เมื่อไม่พบหรือ ID ไม่ถูกต้อง) และตรวจ `review.userId.equals(userId)` คืน 403 `ForbiddenException` เมื่อไม่ใช่เจ้าของ ส่วนการสร้างรีวิวซ้ำใช้ compound unique index `{ userId: 1, cafeId: 1 }` ใน [`ReviewSchema`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/schemas/review.schema.ts#L36) และดักจับรหัส `11000` แปลงเป็น 409 `ConflictException` ได้อย่างรัดกุม
- **ความถูกต้องของ `communityRating` และการทนต่อการ re-seed:** [`ReviewsService.statsFor`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/reviews/reviews.service.ts#L131-L150) คำนวณค่าเฉลี่ยและจำนวนรีวิวใหม่ด้วย MongoDB aggregation (`$avg`, `$sum`) ทุกครั้งที่มีการสร้าง แก้ไข หรือลบ จึงไม่เกิดปัญหาค่าคลาดเคลื่อนสะสม (drift) และคืนค่า `null` / `0` เมื่อลบรีวิวจนหมด ส่วน [`seedCafes`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/scripts/seed.ts#L19-L42) ใช้ `$set` เฉพาะฟิลด์จาก source data โดยแยก `communityRating` และ `communityReviewCount` ออก พร้อมมี e2e test ใน [`server/test/reviews.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/reviews.e2e-spec.ts#L271-L280) ยืนยันว่า seed ซ้ำแล้วคะแนนไม่หาย
- **Accessibility ของ Star Picker และการจัดการ Auth State บน Frontend:** [`ReviewForm`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-reviews.tsx#L90-L111) ใช้ `<fieldset>` + `<legend>` และ `<input type="radio" className="sr-only">` คู่กับ `has-focus-visible:outline-2` และข้อความ `<span className="sr-only">` ทำให้ใช้งานด้วยคีย์บอร์ดและ screen reader ได้ครบถ้วน ส่วน [`CafeReviews`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/components/cafe-reviews.tsx#L208-L269) ผูก `mineState` กับ `userId` ป้องกันรีวิวค้างข้ามบัญชีเมื่อสลับผู้ใช้ คืนรีวิวกลับเข้ารายการรวมทันทีเมื่อ logout และดัก 401 เพื่อเรียก `endSession()` พาไปหน้า login ได้อย่างราบรื่น

## Response
- **#1 [minor] แก้แล้ว** (`6be8c5f`): ยืนยันก่อนแก้ด้วย e2e (`{"rating": null}` ได้ 500) · `rating` / `text` ใน `UpdateReviewDto` ใช้ `ValidateIf(value !== undefined)` แทน `@IsOptional` → `null` ได้ 400 · เพิ่ม e2e ทั้ง 2 field · `drinkOrdered: null` ยังคงทำงานเหมือน `""` (ล้างค่า)
- **#2 [minor] แก้แล้ว** (`df6911e`): เก็บ `page` ล่าสุดใน state และขอ `page + 1` · ปุ่ม Show more ใช้ `page * PAGE_SIZE < total` · ทดสอบใน Chrome: 21 รีวิว + โพสต์ใหม่ 1 รายการระหว่างเปิดหน้า → กด Show more 2 ครั้งได้ครบ 21 ไม่ซ้ำ ปุ่มหาย (โค้ดเดิมจะขอหน้า 2 ซ้ำและค้างที่ 19)
- Gate ผ่านทั้งคู่ (e2e 36/36)

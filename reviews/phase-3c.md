# Review — Phase 3c: Rate limit ต่อผู้ใช้หลัง /api proxy

## Round 1 — 2026-10-27
**Range:** `8e2f647..phase-3c-trust-proxy`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:server` (`typecheck` → `lint:check` → `test` (2 suites, 3 passed) → `test:e2e` (2 suites, 26 passed) → `build`)
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` (182 static pages generated + Proxy middleware enabled))

### Findings
ไม่พบปัญหาในระดับ `blocker` หรือ `major` — งานครบตามแผนใน [`plan.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/plan.md#L184-L198) (3c.1–3c.3) และผ่านการตรวจสอบด้านความปลอดภัยครบทั้ง 3 ประเด็นหลัก

1. **[nit]** [`server/src/auth/client-ip-throttler.guard.ts:10`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/client-ip-throttler.guard.ts#L10-L15) — [`secretMatches`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/client-ip-throttler.guard.ts#L10-L15) รับค่าจาก `req.headers[PROXY_SECRET_HEADER] as string | undefined` แม้ว่า Node.js HTTP parser จะรวม custom header `x-*` ที่ส่งซ้ำเป็น `string` คั่นด้วย `, ` เสมอ แต่หากรับ parameter เป็น `given: string | string[] | undefined` แล้วเช็ก `if (typeof given !== 'string' || !given) return false;` เหมือนที่เช็ก `typeof clientIp === 'string'` จะช่วยลดการใช้ type assertion (`as`)
   - เกิดเมื่อ: เป็นประเด็นด้านความรัดกุมของชนิดข้อมูลใน TypeScript เท่านั้น ไม่เกิดช่องโหว่ใน runtime
   - แนะนำ: เปลี่ยน signature ของ [`secretMatches`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/client-ip-throttler.guard.ts#L10-L15) ให้รับ `string | string[] | undefined` และตรวจ `typeof given === 'string'` ภายในฟังก์ชัน

2. **[nit]** [`server/src/app.setup.ts:11`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/app.setup.ts#L10-L16) — ใน [`configureApp`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/app.setup.ts#L7-L16) เงื่อนไข `if (trustProxy)` หากมีผู้ดูแลตั้งค่า `TRUST_PROXY=false` แทนการเว้นว่างตามเอกสาร Express (`proxy-addr`) จะตีความ string `"false"` เป็นชื่อ subnet/IP แล้วโยน `TypeError: invalid IP address: false` ตอนเริ่มต้นระบบ
   - เกิดเมื่อ: ตั้งค่า env `TRUST_PROXY=false` (หากเว้นว่างหรือตั้งเป็นตัวเลขเช่น `1` ตามที่ระบุใน [`.env.example`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/.env.example#L8-L9) และ [`server/README.md`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/README.md#L49-L52) จะทำงานถูกต้อง)
   - แนะนำ: อาจกรอง `if (trustProxy && trustProxy !== 'false')` เพิ่มเติมหากต้องการกันความผิดพลาดจากการตั้งค่า env

### สิ่งที่ทำได้ดี (optional)
- **ป้องกันการปลอม IP ผ่าน Web Proxy (`web/proxy.ts`):** [`proxy`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/web/proxy.ts#L13-L29) ลบ `x-client-ip` และ `x-proxy-secret` ที่มาจาก client ทิ้งเสมอในทุก request ที่ตรงกับ `/api/:path*` ก่อนจะแนบค่าใหม่เฉพาะเมื่อมี `PROXY_SECRET` เท่านั้น และระบุชัดเจนในเอกสารว่าในโหมด `next start` / local ที่ไม่มี trusted edge ของแพลตฟอร์มคอยเขียนทับ `x-real-ip` / `x-forwarded-for` ให้เว้น `PROXY_SECRET` ว่างไว้ จึงไม่เปิดช่องให้ปลอม `X-Forwarded-For` ผ่าน Next.js rewrite
- **ป้องกันการปลอม IP เมื่อยิงตรงเข้า API (`ClientIpThrottlerGuard`):** [`ClientIpThrottlerGuard.getTracker`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/client-ip-throttler.guard.ts#L20-L36) ตรวจสอบครบทั้ง 4 เงื่อนไขก่อนเชื่อ header (`secret` ไม่ว่าง, `typeof clientIp === 'string'`, `isIP(clientIp)` เป็น IPv4/IPv6 ที่ถูกต้องเท่านั้น, และ `secretMatches` ผ่าน) หากยิงตรงเข้า API โดยไม่มี secret หรือส่งค่าที่ไม่ใช่ IP จะถูกบังคับให้ fallback ไปใช้ `req.ip` เสมอ พร้อมมี e2e test ใน [`server/test/auth.e2e-spec.ts`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/test/auth.e2e-spec.ts#L213-L252) ครอบคลุมทั้งกรณีไม่มี secret, secret ผิด, IP ไม่ถูกต้อง, และการแยก bucket ระหว่าง visitor A กับ B
- **การจัดการ Secret และการตั้งค่า `trust proxy`:** [`secretMatches`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/auth/client-ip-throttler.guard.ts#L10-L15) ใช้ `timingSafeEqual` ร่วมกับการตรวจความยาว Buffer ก่อนเสมอ และใช้ env ฝั่ง server (`PROXY_SECRET`) ที่ไม่ถูกส่งออกไปยัง browser bundle ส่วน [`configureApp`](file:///Users/siwat/Documents/GitHub/JSD13/week03/vibecode-myecommerce/server/src/app.setup.ts#L10-L16) แปลงค่าตัวเลขจาก `TRUST_PROXY` เป็น `Number` ก่อนส่งเข้า `app.set('trust proxy', ...)` ทำให้เมื่อตั้ง `TRUST_PROXY=1` บน Render ตัว Express จะนับจำนวน hop เป็น 1 ชั้นจากขวาสุดของ `X-Forwarded-For` ได้อย่างถูกต้อง ไม่สามารถปลอม `X-Forwarded-For` เมื่อยิงตรงเข้า Render ได้

## Response
- **#1 [nit] แก้แล้ว** (`b820874`): `secretMatches` รับ `string | string[] | undefined` และเช็ก `typeof given === 'string'` เอง — ตัด `as` ออก
- **#2 [nit] แก้แล้ว** (`b820874`): `TRUST_PROXY` trim, `false` → ไม่ตั้ง, `true` → boolean, ตัวเลข → hop count, อื่น ๆ ส่งต่อให้ Express · ทดสอบให้ server boot ได้กับ `''`, `false`, `true`, `1`, `0`, `loopback`, `10.0.0.0/8, loopback` · `npm run gate:server` ผ่าน (e2e 26/26)

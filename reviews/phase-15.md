# Review — Phase 15: ปุ่ม "ค้นหาแก้วที่ใช่" ใต้การ์ดหน้าแรก

## Round 1 — 2026-10-29
**Range:** `main..dddffbd`
**Verdict:** APPROVED

### Gate
- [x] `npm run gate:web` (`typecheck` → `lint` → `build` ผ่านทั้งหมด 361 static pages)

### Findings
1. **[nit]** [web/components/hero.tsx](web/components/hero.tsx#L42-L48) — มี class `group` บน `<Link>` ใน [`Hero`](web/components/hero.tsx#L8-L53) แต่ไม่มี child element ที่ใช้ `group-hover:*` (ไม่มีผลต่อการทำงานหรือการแสดงผล)

### สิ่งที่ทำได้ดี
- ใช้ `<Link>` ของ Next.js คู่กับ [`localePath`](web/lib/i18n/config.ts) ชี้ไปที่ `/{lang}/cafes` ได้ถูกต้องทั้งภาษาไทยและอังกฤษ ([en.ts](web/lib/i18n/en.ts#L79), [th.ts](web/lib/i18n/th.ts#L168))
- สไตล์ปุ่ม (`bg-rust` → `hover:bg-ink`, `text-paper`, `focus-ring`) สอดคล้องกับระบบดีไซน์เดิม และใส่ `aria-hidden` บนไอคอน `Search` ครบถ้วนตามหลัก accessibility

## Response
- nit 1 (`group` ที่ไม่ได้ใช้): แก้แล้ว — 6f8b9f2

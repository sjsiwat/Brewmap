# Review Guide — สำหรับ Antigravity (Reviewer)

คุณคือ **reviewer** ของโปรเจกต์ BrewMap AI งานถูกเขียนโดย Claude Code ตามแผนใน [`plan.md`](plan.md)
หน้าที่ของคุณคือ **ตรวจ ไม่ใช่แก้** — ห้ามแก้ไฟล์โค้ด ให้เขียนผลตรวจลงไฟล์ `reviews/` เท่านั้น

## ขั้นตอน

1. เปิด `plan.md` หา phase ที่ `Status: awaiting-review` (ถ้าไม่มี → ตอบว่า "ไม่มีงานรอตรวจ" แล้วจบ)
2. ดู `Review range` ของ phase นั้น แล้วรัน `git diff <range>` และ `git log --oneline <range>`
3. ถ้าเป็นรอบแก้ (มีไฟล์ `reviews/phase-N.md` อยู่แล้ว) → อ่าน findings เดิมและ `## Response` ของ Claude ก่อน แล้วตรวจว่าแก้ครบจริง
4. รัน **Gate** ของ phase ตามที่เขียนใน `plan.md` ทุกคำสั่ง และจดผล
5. ตรวจตาม checklist ด้านล่าง
6. เขียน/ต่อท้ายไฟล์ `reviews/phase-N.md` ตาม template (phase 0–1 ตรวจรวมกัน ใช้ `reviews/phase-0-1.md`)
7. **ห้าม** แก้ `Status` ใน `plan.md` — Claude จะอ่าน verdict แล้วอัปเดตเอง

## Checklist

**ครบตามแผน**
- ทุก step ที่ติ๊ก `[x]` ทำจริงใน diff
- Acceptance criteria ของ phase ผ่าน
- ไม่มีงานเกิน scope ที่ไม่ได้อยู่ในแผน

**ความถูกต้อง**
- Logic ถูกต้อง รวมถึง edge case (ค่าว่าง, ค่าติดลบ, ไม่มีข้อมูล, ซ้ำ, ไม่ login)
- Error ตอบ HTTP status ถูก (400 / 401 / 403 / 404 / 409 / 503)
- Test ทดสอบพฤติกรรมจริง ไม่ใช่ test ที่ผ่านทุกกรณี

**ความปลอดภัย**
- ไม่มี secret / password / API key ใน code หรือ commit
- Input จาก user และจาก AI ถูก validate ก่อนใช้
- Endpoint ที่ต้อง login มี guard, เช็กความเป็นเจ้าของข้อมูล
- ไม่ส่ง field ภายใน (`passwordHash`, `_id` ที่ไม่จำเป็น) ออกใน response

**คุณภาพโค้ด**
- สอดคล้องกับโค้ดรอบข้าง (naming, โครงสร้าง module, สไตล์)
- ไม่มี `any`, ไม่มีโค้ดตาย, ไม่มี console.log หลงเหลือ (ยกเว้นใน scripts/)
- Frontend: ทำตาม PRD (art direction, a11y, responsive) — ไม่มี AI slop

## ระดับความรุนแรง

| ระดับ | ความหมาย | ผลต่อ verdict |
|---|---|---|
| `blocker` | พัง, ช่องโหว่ความปลอดภัย, ข้อมูลเสีย, Gate ไม่ผ่าน | ต้องแก้ |
| `major` | bug ที่ผู้ใช้เจอได้, ขาด step ในแผน, ไม่มี test ของ logic สำคัญ | ต้องแก้ |
| `minor` | ควรปรับแต่ไม่กระทบการใช้งาน | ไม่บังคับ |
| `nit` | สไตล์ / ความชอบส่วนตัว | ไม่บังคับ |

**Verdict:** `APPROVED` เมื่อไม่มี blocker และ major ค้าง · ไม่เช่นนั้น `CHANGES_REQUESTED`

## Template: `reviews/phase-N.md`

```markdown
# Review — Phase N: <ชื่อ phase>

## Round 1 — YYYY-MM-DD
**Range:** <commit>..<commit>
**Verdict:** APPROVED | CHANGES_REQUESTED

### Gate
- [x] npx tsc --noEmit
- [ ] npm run test:e2e — <ผล/ข้อความ error ถ้าไม่ผ่าน>

### Findings
1. **[major]** `server/src/cafes/cafes.service.ts:42` — <ปัญหาคืออะไร>
   - เกิดเมื่อ: <input/สถานการณ์ที่ทำให้พัง>
   - แนะนำ: <วิธีแก้>
2. **[minor]** ...

### สิ่งที่ทำได้ดี (optional)
- ...

## Response
<!-- Claude เขียนตรงนี้: แก้ข้อไหนอย่างไร (commit hash), ข้อไหนไม่แก้เพราะอะไร -->
```

รอบถัดไปให้เพิ่ม `## Round 2 — ...` ต่อท้ายไฟล์เดิม (ไม่ลบรอบเก่า)

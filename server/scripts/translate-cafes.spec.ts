import { cleanTranslation } from './translate-cafes';

const source = {
  specialty: 'Matcha latte',
  flavor: 'Green-tea forward',
  atmosphere: 'Quiet, garden',
  aiSummary: { pros: ['Great matcha', 'Friendly staff'], cons: ['Few seats'] },
};

const reply = {
  specialty: 'มัทฉะลาเต้',
  flavor: 'เน้นรสชาเขียว',
  atmosphere: 'เงียบ มีสวน',
  pros: ['มัทฉะดีมาก', 'พนักงานเป็นกันเอง'],
  cons: ['ที่นั่งน้อย'],
};

describe('cleanTranslation', () => {
  it('keeps the Thai fields, trimmed, with the summary in order', () => {
    expect(
      cleanTranslation({ ...reply, specialty: '  มัทฉะ   ลาเต้ ' }, source),
    ).toEqual({
      specialty: 'มัทฉะ ลาเต้',
      flavor: reply.flavor,
      atmosphere: reply.atmosphere,
      aiSummary: { pros: reply.pros, cons: reply.cons },
    });
  });

  it('has no summary when the café has none, whatever the model says', () => {
    expect(
      cleanTranslation(reply, { ...source, aiSummary: null })?.aiSummary,
    ).toBeNull();
  });

  it('keeps an empty English list empty, even if the model fills it', () => {
    expect(
      cleanTranslation(
        { ...reply, cons: ['ไม่มีข้อเสีย'] },
        { ...source, aiSummary: { pros: source.aiSummary.pros, cons: [] } },
      )?.aiSummary,
    ).toEqual({ pros: reply.pros, cons: [] });
  });

  it('rejects replies that are missing, not Thai, too long or misaligned', () => {
    expect(cleanTranslation(null, source)).toBeNull();
    expect(cleanTranslation({ ...reply, flavor: '' }, source)).toBeNull();
    expect(
      cleanTranslation({ ...reply, atmosphere: 'Quiet, garden' }, source),
    ).toBeNull();
    expect(
      cleanTranslation(
        { ...reply, specialty: 'Hojicha latte และ specialty espresso' },
        source,
      ),
    ).toBeNull();
    expect(
      cleanTranslation(
        { ...reply, specialty: 'ซิกเนเจอร์ Dirty coffee' },
        source,
      )?.specialty,
    ).toBe('ซิกเนเจอร์ Dirty coffee');
    expect(
      cleanTranslation({ ...reply, specialty: 'ก'.repeat(161) }, source),
    ).toBeNull();
    expect(
      cleanTranslation({ ...reply, pros: ['มัทฉะดีมาก'] }, source),
    ).toBeNull();
    expect(cleanTranslation({ ...reply, cons: [42] }, source)).toBeNull();
  });
});

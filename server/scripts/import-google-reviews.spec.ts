import { toGoogleReview } from './import-google-reviews';

describe('toGoogleReview', () => {
  it('keeps stars, text, language and date only', () => {
    const raw = {
      Rating: '4',
      Description: 'Great flat white',
      text_original: 'Great flat white',
      language: 'en',
      published_at: '2026-08-24T09:14:26.402Z',
      // Anything else in the scrape is never copied.
      Name: 'Somebody',
      ProfilePicture: 'https://example.com/me.jpg',
      reply_text: 'Thank you Somebody!',
    };
    expect(toGoogleReview(raw)).toEqual({
      rating: 4,
      text: 'Great flat white',
      translatedText: null,
      language: 'en',
      publishedAt: new Date('2026-08-24T09:14:26.402Z'),
    });
  });

  it("keeps Google's translation only for non-English reviews", () => {
    expect(
      toGoogleReview({
        Rating: 5,
        text_original: 'มัทฉะดี อร่อย',
        text_translated: 'The matcha is good and tasty',
        language: 'th',
      }),
    ).toMatchObject({
      text: 'มัทฉะดี อร่อย',
      translatedText: 'The matcha is good and tasty',
      language: 'th',
      publishedAt: null,
    });
    expect(
      toGoogleReview({
        Rating: 5,
        Description: 'Nice',
        text_translated: 'Nice',
        language: 'en',
      })?.translatedText,
    ).toBeNull();
  });

  it('skips reviews it cannot show: no text, or stars outside 1-5', () => {
    expect(toGoogleReview({ Rating: 5, Description: '   ' })).toBeNull();
    expect(toGoogleReview({ Rating: 0, Description: 'Hmm' })).toBeNull();
    expect(toGoogleReview({ Rating: 'six', Description: 'Hmm' })).toBeNull();
    expect(toGoogleReview({ Description: 'No stars' })).toBeNull();
  });

  it('ignores a bad date instead of failing', () => {
    expect(
      toGoogleReview({ Rating: 3, Description: 'Ok', published_at: 'soon' })
        ?.publishedAt,
    ).toBeNull();
  });
});

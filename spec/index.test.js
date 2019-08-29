import sharp from '../src';

test('skips not included files', () => {
  // given
  const s = sharp();

  // when
  const val = s.load('bla.txt');

  // then
  expect(val).toBe(null);
});

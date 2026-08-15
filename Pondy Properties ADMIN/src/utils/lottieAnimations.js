export const imageLoadingAnimation = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'simple-circle',
  ddd: 0,
  assets: [],
  layers: [
    {
      ty: 4,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: [100, 100] },
              s: { a: 1, k: [{ t: 0, s: [0, 0] }, { t: 60, s: [180, 180] }] },
              nm: 'ellipse'
            },
            { ty: 'st', c: { a: 0, k: [0.149, 0.447, 0.816, 1] }, w: 8 },
          ],
        },
      ],
      ip: 0,
      op: 60,
    },
  ],
};

export const videoLoadingAnimation = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'bars',
  ddd: 0,
  assets: [],
  layers: [
    {
      ty: 4,
      shapes: [
        {
          ty: 'rc',
          p: { a: 0, k: [100, 100] },
          s: { a: 1, k: [{ t: 0, s: [20, 60] }, { t: 30, s: [20, 120] }, { t: 60, s: [20, 60] }] },
        },
      ],
      ip: 0,
      op: 60,
    },
  ],
};

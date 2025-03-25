// toolkit.config.ts
import path from 'path';

export const config = {
  rollup: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // src klasörü kesin burada mı?
      },
    },
  },
};

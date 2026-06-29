import type { WaveJson } from '../model/wavejson'

/** Starter timing chart shown on first load. */
export const DEFAULT_MODEL: WaveJson = {
  signal: [
    { name: 'clk', wave: 'P.......' },
    { name: 'req', wave: '0.1..0..', node: '..a..b' },
    { name: 'addr', wave: 'x.=.=.x.', data: ['A0', 'A1'] },
    { name: 'data', wave: 'x...=.=.', data: ['D0', 'D1'] },
    {},
    { name: 'ack', wave: '0...1.0.' },
  ],
  edge: ['a~>b'],
  config: { hscale: 1 },
  head: { text: 'サンプル: 簡易バス転送' },
}

import { scaleLinear, scaleTime } from '@vx/scale';
import { min, max, extent } from 'd3-array';
export const getXScale = (data, xMax) => scaleTime({
  domain: extent(data),
  range: [0, xMax],
});

export const getYScale = (data, yMax) => scaleLinear({
  domain: [min(data) * 0.9, Math.max(0, max(data))],
  range: [yMax, 0],
}).nice();

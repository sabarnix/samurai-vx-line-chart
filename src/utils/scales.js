import { scaleLinear, scaleTime } from '@vx/scale';
import { max, extent, min } from 'd3-array';
export const getXScale = (data, xMax) => scaleTime({
  domain: extent(data),
  range: [0, xMax],
});

export const getYScale = (data, yMax) => scaleLinear({
  domain: [min(data), max(data)],
  range: [yMax, 0],
});

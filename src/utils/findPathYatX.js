const pathYCache = {};

export default function getPathYFromX(x, path, name, error = 0.01) {
  const key = `${name}-${x}`;

  if (key in pathYCache) {
    return pathYCache[key];
  }

  const maxIterations = 100;

  try {
    let lengthStart = 0;
    let lengthEnd = path.getTotalLength();
    let point = path.getPointAtLength((lengthEnd + lengthStart) / 2);
    let iterations = 0;

    while (x < point.x - error || x > point.x + error) {
      const midpoint = (lengthStart + lengthEnd) / 2;

      point = path.getPointAtLength(midpoint);

      if (x < point.x) {
        lengthEnd = midpoint;
      } else {
        lengthStart = midpoint;
      }

      iterations += 1;
      if (maxIterations < iterations) {
        break;
      }
    }
    pathYCache[key] = point.y;
  } catch (e) {
    pathYCache[key] = null;
  }


  return pathYCache[key];
}

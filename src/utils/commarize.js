export default function commarize(v) {
  if (v >= 1e3) {
    const units = ['k', 'M', 'B', 'T'];

    const unit = Math.floor(((v).toFixed(0).length - 1) / 3) * 3;
    const num = (v / (`1e${unit}`)).toFixed(2).toString().replace(/\.0+$/, '');
    const unitname = units[Math.floor(unit / 3) - 1];

    return num + unitname;
  }

  return v;
}

export const GRID_CELL_DEGREE = 0.27; // roughly 30km at Sri Lanka latitudes

export const getGridCellId = (lat, lng) => {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return null;
  }
  const gridLat = Math.floor(lat / GRID_CELL_DEGREE);
  const gridLng = Math.floor(lng / GRID_CELL_DEGREE);
  return `grid_${gridLat}_${gridLng}`;
};

export const GRID_CELL_RADIUS_KM = 30;

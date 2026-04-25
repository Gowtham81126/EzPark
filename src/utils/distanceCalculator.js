/**
 * Calculate approximate distance using Haversine formula (straight-line distance)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance
}

/**
 * Calculate distance using Haversine formula (straight-line distance)
 * Returns object with distance (km), duration (min), and route points
 */
export async function calculateRouteDistance(driverLocation, slotCoordinates) {
  if (!driverLocation || !slotCoordinates || !slotCoordinates.lat || !slotCoordinates.lng) {
    return { distance: null, duration: null, isApproximate: false }
  }

  // Use Haversine distance
  const distance = calculateHaversineDistance(
    driverLocation.lat, 
    driverLocation.lng, 
    slotCoordinates.lat, 
    slotCoordinates.lng
  )
  // Estimate duration assuming average speed of 30 km/h in city
  const duration = (distance / 30) * 60 // minutes
  
  return { 
    distance: distance, 
    duration: duration, 
    isApproximate: true,
    points: null // No route points for straight-line distance
  }
}

/**
 * Calculate distance from driver's location to a parking slot
 * Returns formatted distance string using Haversine formula
 */
export async function formatDistanceFromDriver(driverLocation, slotCoordinates) {
  if (!driverLocation || !slotCoordinates || !slotCoordinates.lat || !slotCoordinates.lng) {
    return 'Distance unavailable'
  }
  
  const routeData = await calculateRouteDistance(driverLocation, slotCoordinates)
  
  if (!routeData || routeData.distance === null) {
    return 'Distance unavailable'
  }
  
  return `Distance: ${routeData.distance.toFixed(1)} km`
}

/**
 * Format distance for display in location cards
 * Returns "Distance: X km"
 */
export function formatRouteDistance(routeData) {
  if (!routeData || routeData.distance === null) {
    return 'Distance unavailable'
  }

  return `Distance: ${routeData.distance.toFixed(1)} km`
}

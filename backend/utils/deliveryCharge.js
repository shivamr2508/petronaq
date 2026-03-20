// backend/utils/deliveryCharge.js

// Center point (Gota, Ahmedabad)
const CENTER_LAT = 23.0943;
const CENTER_LNG = 72.5417;

// calculate distance using Haversine formula
function getDistanceFromLatLng(lat, lng) {
  const R = 6371; // km
  const dLat = (lat - CENTER_LAT) * Math.PI / 180;
  const dLng = (lng - CENTER_LNG) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(CENTER_LAT * Math.PI/180) *
    Math.cos(lat * Math.PI/180) *
    Math.sin(dLng/2) *
    Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance;
}

function calculateDeliveryCharge(lat, lng) {

  const distance = getDistanceFromLatLng(lat, lng);

  console.log("Delivery distance:", distance, "km");

  if (distance <= 10) {
    return 0;
  }

  if (distance <= 30) {
    return 50;
  }

  return null;
}

module.exports = calculateDeliveryCharge;
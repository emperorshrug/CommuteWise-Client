// =========================================================================================
// CUSTOM HOOK: USE GEOLOCATION (WITH HEADING)
// PURPOSE: TRACKS USER POSITION AND COMPASS DIRECTION (HEADING).
// LOGIC: EXTRACTS 'coords.heading' TO DETERMINE ORIENTATION.
// =========================================================================================

import { useEffect, useRef } from "react";
import { useAppStore } from "../stores/useAppStore";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const useGeolocation = () => {
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, heading } = pos.coords;

      // UPDATE STORE WITH LAT/LNG AND HEADING
      // NOTE: HEADING MIGHT BE NULL ON LAPTOPS OR STATIONARY DEVICES
      setUserLocation({
        lat: latitude,
        lng: longitude,
        heading: heading, // PASS THE DIRECTION (OR NULL)
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("GPS Error:", error.message);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEO_OPTIONS
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [setUserLocation]);
};

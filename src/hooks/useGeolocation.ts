// =========================================================================================
// CUSTOM HOOK: USE GEOLOCATION (WITH HEADING)
// PURPOSE: TRACKS USER POSITION AND COMPASS DIRECTION (HEADING).
// LOGIC: EXTRACTS 'coords.heading' TO DETERMINE ORIENTATION.
// THROTTLING: UPDATES MAX ONCE EVERY 2 SECONDS TO PREVENT EXCESSIVE STATE UPDATES.
// =========================================================================================

import { useEffect, useRef } from "react";
import { useAppStore } from "../stores/useAppStore";

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 2000, // CACHE POSITION FOR 2 SECONDS (THROTTLING)
};

const THROTTLE_MS = 2000; // MAXIMUM UPDATE FREQUENCY: 2 SECONDS

export const useGeolocation = () => {
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0); // TRACK LAST UPDATE TIME

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const now = Date.now();
      
      // THROTTLE: ONLY UPDATE IF 2 SECONDS HAVE PASSED SINCE LAST UPDATE
      if (now - lastUpdateRef.current < THROTTLE_MS) {
        return;
      }

      const { latitude, longitude, heading } = pos.coords;

      // UPDATE STORE WITH LAT/LNG AND HEADING
      // NOTE: HEADING MIGHT BE NULL ON LAPTOPS OR STATIONARY DEVICES
      setUserLocation({
        lat: latitude,
        lng: longitude,
        heading: heading, // PASS THE DIRECTION (OR NULL)
      });

      lastUpdateRef.current = now; // UPDATE LAST UPDATE TIME
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

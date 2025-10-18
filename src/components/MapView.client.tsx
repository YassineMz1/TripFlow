// Dynamic import wrapper for MapView to disable SSR
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default MapView;

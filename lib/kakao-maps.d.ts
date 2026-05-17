export interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void;
  getCenter: () => { getLat: () => number; getLng: () => number };
}

export interface KakaoMarker {
  setMap: (map: KakaoMapInstance | null) => void;
  setPosition: (latlng: KakaoLatLng) => void;
  getPosition: () => KakaoLatLng;
}

export interface KakaoInfoWindow {
  open: (map: KakaoMapInstance, marker: KakaoMarker) => void;
  close: () => void;
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMouseEvent {
  latLng: KakaoLatLng;
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: object) => KakaoMapInstance;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: object) => KakaoMarker;
        InfoWindow: new (options: object) => KakaoInfoWindow;
        event: {
          addListener: (
            target: object,
            type: string,
            callback: (event?: KakaoMouseEvent) => void
          ) => void;
        };
      };
    };
  }
}

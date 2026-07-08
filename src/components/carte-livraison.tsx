import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '@/theme/tokens';

/**
 * Carte OpenStreetMap (Leaflet dans une WebView — compatible Expo Go, aucune
 * clé API). Deux usages :
 *  - sélection d'adresse : `draggable` + `onPositionChange` (épingle déplaçable) ;
 *  - suivi de livraison : `livreur` mis à jour par injection JS, sans recharger.
 * Les tuiles OSM exigent le réseau et l'attribution (affichée par Leaflet).
 */

export interface PointCarte {
  lat: number;
  lng: number;
}

export function CarteLivraison({
  destination,
  livreur,
  draggable = false,
  onPositionChange,
  hauteur = 220,
}: {
  destination: PointCarte;
  livreur?: PointCarte | null;
  draggable?: boolean;
  onPositionChange?: (point: PointCarte) => void;
  hauteur?: number;
}) {
  const webref = useRef<WebView>(null);

  // Le HTML n'est construit qu'une fois : les mises à jour passent par
  // injectJavaScript (pas de rechargement de la WebView à chaque position).
  const html = useMemo(
    () => construireHtml(destination, draggable),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!livreur) return;
    webref.current?.injectJavaScript(
      `window.majLivreur(${livreur.lat}, ${livreur.lng}); true;`,
    );
  }, [livreur]);

  return (
    <View style={[styles.cadre, { height: hauteur }]}>
      <WebView
        ref={webref}
        source={{ html }}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          if (!onPositionChange) return;
          try {
            const point = JSON.parse(event.nativeEvent.data) as PointCarte;
            if (typeof point.lat === 'number' && typeof point.lng === 'number') {
              onPositionChange(point);
            }
          } catch {
            // Message non JSON : ignoré.
          }
        }}
      />
    </View>
  );
}

function construireHtml(destination: PointCarte, draggable: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%}</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${destination.lat}, ${destination.lng}], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var iconeDestination = L.divIcon({ className: '', html: '<div style="font-size:28px;line-height:28px">📍</div>', iconSize: [28,28], iconAnchor: [14,28] });
  var iconeLivreur = L.divIcon({ className: '', html: '<div style="font-size:28px;line-height:28px">🛵</div>', iconSize: [28,28], iconAnchor: [14,14] });

  var destination = L.marker([${destination.lat}, ${destination.lng}], { icon: iconeDestination, draggable: ${draggable} }).addTo(map);
  ${
    draggable
      ? `destination.on('dragend', function () {
    var p = destination.getLatLng();
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: p.lat, lng: p.lng }));
  });
  map.on('click', function (e) {
    destination.setLatLng(e.latlng);
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
  });`
      : ''
  }

  var livreur = null;
  window.majLivreur = function (lat, lng) {
    if (!livreur) {
      livreur = L.marker([lat, lng], { icon: iconeLivreur }).addTo(map);
      map.fitBounds(L.latLngBounds([lat, lng], destination.getLatLng()), { padding: [36, 36] });
    } else {
      livreur.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
    }
  };
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  cadre: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  web: {
    flex: 1,
  },
});

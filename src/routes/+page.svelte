<!--
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 -->

<script lang="ts">
  /* global google */

  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;

  import { onMount } from 'svelte';

  import SearchBar from './components/SearchBar.svelte';
  import Sections from './sections/Sections.svelte';

  // name: 'Rinconada Library',
  // address: '1213 Newell Rd, Palo Alto, CA 94303',

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const defaultPlace = {
    name: 'ASOCIACIÓN COMARCAL GRAN VEGA DE SEVILLA',
    address: 'Ctra. Sevilla-Cazalla, km. 7,5 Pol. Ind. Torrepavas, 41309 La Rinconada, Sevilla, Spanyol',
  };
  let location: google.maps.LatLng | undefined;
  // const zoom = 17;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;


  // onMount(async () => {
  //   // Load the Google Maps libraries.
  //   const loader = new Loader({ apiKey: googleMapsApiKey });
  //   const libraries = {
  //     geometry: loader.importLibrary('geometry'),
  //     maps: loader.importLibrary('maps'),
  //     places: loader.importLibrary('places'),
  //   };
  //   geometryLibrary = await libraries.geometry;
  //   mapsLibrary = await libraries.maps;
  //   placesLibrary = await libraries.places;

  //   // Get the address information for the default location.
  //   const geocoder = new google.maps.Geocoder();
  //   const geocoderResponse = await geocoder.geocode({
  //     address: defaultPlace.address,
  //   });
  //   const geocoderResult = geocoderResponse.results[0];

  //   // Initialize the map at the desired location.
  //   location = geocoderResult.geometry.location; 
  //   // location = new google.maps.LatLng(sevillaCoordinates.lat, sevillaCoordinates.lng); 
  //   map = new mapsLibrary.Map(mapElement, {
  //     center: location,
  //     zoom: zoom,
  //     tilt: 0,
  //     mapTypeId: 'satellite',
  //     mapTypeControl: false,
  //     fullscreenControl: false,
  //     rotateControl: false,
  //     streetViewControl: false,
  //     zoomControl: false,
  //   });
  // });

 
  onMount(async () => {
    // Load the Google Maps libraries
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;
    placesLibrary = await libraries.places;

    // Initialize the map
    map = new mapsLibrary.Map(mapElement, {
      center: { lat: 37.3886, lng: -5.9823 },
      zoom: 10,
      mapTypeId: 'roadmap',
      mapTypeControl: false,
      fullscreenControl: false,
      rotateControl: false,
      streetViewControl: false,
      zoomControl: true,
    });

    var kmlLayer = new google.maps.KmlLayer({
      url: `https://spatially-design.s3.ap-southeast-1.amazonaws.com/energy-transition/sevillaArea.kml`,
      preserveViewport: true, // Prevents resetting the viewport
      suppressInfoWindows: false, // Keeps default KMZ info windows
    });
    kmlLayer.setMap(map);

    // Adjust map bounds based on the KMZ layer
    google.maps.event.addListenerOnce(kmlLayer, 'defaultviewport_changed', () => {
      const bounds = kmlLayer.getDefaultViewport();
      if (bounds) {
        map.fitBounds(bounds); // Ensure bounds are not null
      } else {
        console.error('Failed to retrieve bounds from KML layer.');
      }
    });

    // Geocode the default place and center map
    const geocoder = new google.maps.Geocoder();
    const placeResponse = await geocoder.geocode({ address: defaultPlace.address });
    if (placeResponse.results[0]) {
      location = placeResponse.results[0].geometry.location;
      map.setCenter(location);
    }
  });

</script>

<!-- Top bar -->
<div class="flex flex-row h-full">
  <!-- Main map -->
  <div bind:this={mapElement} class="w-full" />

  <!-- Side bar -->
  <aside class="flex-none md:w-96 w-80 p-2 pt-3 overflow-auto">
    <div class="flex flex-col space-y-2 h-full">
      {#if placesLibrary && map}
        <SearchBar bind:location {placesLibrary} {map} initialValue={defaultPlace.name} />
      {/if}

      <!-- <div class="p-4 surface-variant outline-text rounded-lg space-y-3">
        <p>
          <a
            class="primary-text"
            href="https://developers.google.com/maps/documentation/solar/overview?hl=en"
            target="_blank"
          >
            Two distinct endpoints of the <b>Solar API</b>
            <md-icon class="text-sm">open_in_new</md-icon>
          </a>
          offer many benefits to solar marketplace websites, solar installers, and solar SaaS designers.
        </p>

        <p>
          <b>Click on an area below</b>
          to see what type of information the Solar API can provide.
        </p>
      </div> -->

      {#if location}
        <Sections {location} {map} {geometryLibrary} {googleMapsApiKey} />
      {/if}

      <div class="grow" />

      <!-- <div class="flex flex-col items-center w-full">
        <md-text-button
          href="https://github.com/googlemaps-samples/js-solar-potential"
          target="_blank"
        >
          View code on GitHub
          <img slot="icon" src="github-mark.svg" alt="GitHub" width="16" height="16" />
        </md-text-button>
      </div> -->

      <div class="flex flex-col items-center w-full">
        <img src="/granvega.png" alt="GitHub" width="80" height="80" />
      </div>

      <span class="pb-2 text-center outline-text label-small">
        Oficina de Transformación Comunitaria de Gran Vega de Sevilla
      </span>

      <div class="flex flex-col items-center w-full mb-20">
        <img src="/eu.png" alt="GitHub" width="400" height="100" />
      </div>

    </div>
  </aside>
</div>

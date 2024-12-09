<script lang="ts">
  /* global google */

  import { onMount } from 'svelte';
  import type { MdFilledTextField } from '@material/web/textfield/filled-text-field';

  export let location: google.maps.LatLng | undefined;

  export let placesLibrary: google.maps.PlacesLibrary;
  export let map: google.maps.Map;
  export let initialValue = '';
  export let zoom = 19;

  let textFieldElement: MdFilledTextField;

   // Geocode function with restrictions to Sevilla
   async function geocodeAddress(address: string): Promise<google.maps.GeocoderResult | null> {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({
      address,
      componentRestrictions: {
        administrativeArea: 'Sevilla',
        country: 'ES',
      },
    });
    return response.results[0] || null;
  }

  onMount(async () => {
    // Wait for the textFieldElement to finish rendering
    await textFieldElement.updateComplete;

    const inputElement = textFieldElement.renderRoot.querySelector('input') as HTMLInputElement;
    const autocomplete = new placesLibrary.Autocomplete(inputElement, {
      fields: ['formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: 'ES' }, // Restrict to Spain
    });

    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();

      // Use the geocodeAddress function for an additional check
      const address = inputElement.value;
      const geocodedResult = await geocodeAddress(address);

      if (!geocodedResult || !place.geometry || !place.geometry.location) {
        textFieldElement.value = '';
        alert('Address not found or not within Sevilla.');
        return;
      }

      const sevillaRegion = geocodedResult.address_components.some(component => 
        component.long_name === 'Sevilla' || component.short_name === 'Sevilla'
      );

      if (!sevillaRegion) {
        alert('The selected address is not in Sevilla.');
        textFieldElement.value = '';
        return;
      }

      if (place.geometry.viewport) {
        map.setCenter(place.geometry.location);
        map.setZoom(zoom);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(zoom);
      }

      location = place.geometry.location;
      textFieldElement.value = place.name || place.formatted_address || '';
    });
  });

 
</script>

<md-filled-text-field bind:this={textFieldElement} label="Buscar una dirección" value={initialValue}>
  <md-icon slot="leadingicon">busque</md-icon>
</md-filled-text-field>

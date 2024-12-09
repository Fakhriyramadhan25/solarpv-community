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

  import { onMount } from 'svelte';

  import type { MdDialog } from '@material/web/dialog/dialog';
  import Calendar from '../components/Calendar.svelte';
  import Dropdown from '../components/Dropdown.svelte';
  import Expandable from '../components/Expandable.svelte';
  import { getLayer, type Layer } from '../layer';
  import {
    getDataLayerUrls,
    type BuildingInsightsResponse,
    type DataLayersResponse,
    type LayerId,
    type RequestError,
  } from '../solar';
  import InputBool from '../components/InputBool.svelte';
  import Show from '../components/Show.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import type { MdSlider } from '@material/web/slider/slider';

  export let expandedSection: string;
  export let showPanels = true;

  export let googleMapsApiKey: string;
  export let buildingInsights: BuildingInsightsResponse;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let map: google.maps.Map;

  const icon = 'layers';
  const title = 'Punto final de Capas de Datos';

  const dataLayerOptions: Record<LayerId | 'none', string> = {
    none: 'No layer',
    mask: 'Roof mask',
    dsm: 'Digital Surface Model',
    rgb: 'Aerial image',
    annualFlux: 'Annual sunshine',
    monthlyFlux: 'Monthly sunshine',
    hourlyShade: 'Hourly shade',
  };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  let dataLayersResponse: DataLayersResponse | undefined;
  let requestError: RequestError | undefined;
  let apiResponseDialog: MdDialog;
  let layerId: LayerId | 'none' = 'annualFlux';
  let layer: Layer | undefined;
  let imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';

  let playAnimation = true;
  let tick = 0;
  let month = 0;
  let day = 14;
  let hour = 0;

  let overlays: google.maps.GroundOverlay[] = [];
  let showRoofOnly = false;
  async function showDataLayer(reset = false) {
    if (reset) {
      dataLayersResponse = undefined;
      requestError = undefined;
      layer = undefined;

      // Default values per layer.
      showRoofOnly = ['annualFlux', 'monthlyFlux', 'hourlyShade'].includes(layerId);
      map.setMapTypeId(layerId == 'rgb' ? 'roadmap' : 'satellite');
      overlays.map((overlay) => overlay.setMap(null));
      month = layerId == 'hourlyShade' ? 3 : 0;
      day = 14;
      hour = 5;
      playAnimation = ['monthlyFlux', 'hourlyShade'].includes(layerId);
    }
    if (layerId == 'none') {
      return;
    }

    if (!layer) {
      const center = buildingInsights.center;
      const ne = buildingInsights.boundingBox.ne;
      const sw = buildingInsights.boundingBox.sw;
      const diameter = geometryLibrary.spherical.computeDistanceBetween(
        new google.maps.LatLng(ne.latitude, ne.longitude),
        new google.maps.LatLng(sw.latitude, sw.longitude),
      );
      const radius = Math.ceil(diameter / 2);
      try {
        dataLayersResponse = await getDataLayerUrls(center, radius, googleMapsApiKey);
      } catch (e) {
        requestError = e as RequestError;
        return;
      }

      imageryQuality = dataLayersResponse.imageryQuality;

      try {
        layer = await getLayer(layerId, dataLayersResponse, googleMapsApiKey);
      } catch (e) {
        requestError = e as RequestError;
        return;
      }
    }

    const bounds = layer.bounds;
    console.log('Render layer:', {
      layerId: layer.id,
      showRoofOnly: showRoofOnly,
      month: month,
      day: day,
    });
    overlays.map((overlay) => overlay.setMap(null));
    overlays = layer
      .render(showRoofOnly, month, day)
      .map((canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds));

    if (!['monthlyFlux', 'hourlyShade'].includes(layer.id)) {
      overlays[0].setMap(map);
    }
  }

  $: if (layer?.id == 'monthlyFlux') {
    overlays.map((overlay, i) => overlay.setMap(i == month ? map : null));
  } else if (layer?.id == 'hourlyShade') {
    overlays.map((overlay, i) => overlay.setMap(i == hour ? map : null));
  }

  function onSliderChange(event: Event) {
    const target = event.target as MdSlider;
    if (layer?.id == 'monthlyFlux') {
      if (target.valueStart != month) {
        month = target.valueStart ?? 0;
      } else if (target.valueEnd != month) {
        month = target.valueEnd ?? 0;
      }
      tick = month;
    } else if (layer?.id == 'hourlyShade') {
      if (target.valueStart != hour) {
        hour = target.valueStart ?? 0;
      } else if (target.valueEnd != hour) {
        hour = target.valueEnd ?? 0;
      }
      tick = hour;
    }
  }

  $: if (layer?.id == 'monthlyFlux') {
    if (playAnimation) {
      month = tick % 12;
    } else {
      tick = month;
    }
  } else if (layer?.id == 'hourlyShade') {
    if (playAnimation) {
      hour = tick % 24;
    } else {
      tick = hour;
    }
  }

  onMount(() => {
    showDataLayer(true);

    setInterval(() => {
      tick++;
    }, 1000);
  });
</script>

{#if requestError}
  <div class="error-container on-error-container-text">
    <Expandable section={title} icon="error" {title} subtitle={requestError.error.status}>
      <div class="grid place-items-center py-2 space-y-4">
        <div class="grid place-items-center">
          <p class="body-medium">
            Error on <code>dataLayers</code>
            {layerId} request
          </p>
          <p class="title-large">ERROR {requestError.error.code}</p>
          <p class="body-medium"><code>{requestError.error.status}</code></p>
          <p class="label-medium">{requestError.error.message}</p>
        </div>
        <md-filled-button role={undefined} on:click={() => showDataLayer(true)}>
          Retry
          <md-icon slot="icon">refresh</md-icon>
        </md-filled-button>
      </div>
    </Expandable>
  </div>
{:else}
  <Expandable bind:section={expandedSection} {icon} {title} subtitle={dataLayerOptions[layerId]}>
    <div class="flex flex-col space-y-2 px-2">
      <span class="outline-text label-medium">
        <b>{title}</b> proporciona imágenes en bruto y procesadas y detalles granulares sobre un área que rodea
        de un lugar.
      </span>

      <Dropdown
        bind:value={layerId}
        options={dataLayerOptions}
        onChange={async () => {
          layer = undefined;
          showDataLayer();
        }}
      />

      {#if layerId == 'none'}
        <div />
      {:else if !layer}
        <md-linear-progress four-color indeterminate />
      {:else}
        {#if layer.id == 'hourlyShade'}
          <Calendar bind:month bind:day onChange={async () => showDataLayer()} />
        {/if}

        <span class="outline-text label-medium">
          {#if imageryQuality == 'HIGH'}
            <p><b>Imágenes aéreas a baja altitud</b> disponible.</p>
            <p>Las imágenes y los datos DSM se procesaron en <b>10 cm/pixel</b>.</p>
          {:else if imageryQuality == 'MEDIUM'}
            <p><b>Imágenes aéreas aumentadas con IA</b> disponible.</p>
            <p>Las imágenes y los datos DSM se procesaron en <b>25 cm/pixel</b>.</p>
          {:else if imageryQuality == 'LOW'}
            <p><b>Aumento de las imágenes aéreas o por satélite</b> disponible.</p>
            <p>Las imágenes y los datos DSM se procesaron en <b>50 cm/pixel</b>.</p>
          {/if}
        </span>

        <InputBool bind:value={showPanels} label="Solar panels" />
        <InputBool bind:value={showRoofOnly} label="Roof only" onChange={() => showDataLayer()} />

        {#if ['monthlyFlux', 'hourlyShade'].includes(layerId)}
          <InputBool bind:value={playAnimation} label="Play animation" />
        {/if}
      {/if}
      <div class="flex flex-row">
        <div class="grow" />
        <!-- <md-filled-tonal-button role={undefined} on:click={() => apiResponseDialog.show()}>
          API response
        </md-filled-tonal-button> -->3
      </div>

      <md-dialog bind:this={apiResponseDialog}>
        <div slot="headline">
          <div class="flex items-center primary-text">
            <md-icon>{icon}</md-icon>
            <b>&nbsp;{title}</b>
          </div>
        </div>
        <div slot="content">
          <Show value={dataLayersResponse} label="dataLayersResponse" />
        </div>
        <div slot="actions">
          <md-text-button role={undefined} on:click={() => apiResponseDialog.close()}>
            Close
          </md-text-button>
        </div>
      </md-dialog>
    </div>
  </Expandable>
{/if}

<div class="absolute top-0 left-0 w-72">
  {#if expandedSection == title && layer}
    <div class="m-2">
      <SummaryCard {icon} {title} rows={[{ name: dataLayerOptions[layerId], value: '' }]}>
        <div class="flex flex-col space-y-4">
          <p class="outline-text">
            {#if layerId == 'mask'}
            La imagen de máscara de edificio: un bit por píxel que indica si ese píxel se considera o no parte de un tejado.
            parte de un tejado o no.
            {:else if layerId == 'dsm'}
            Imagen del MDS (Modelo Digital de Superficie) de la región. Los valores están en metros sobre
            geoide EGM96 (es decir, el nivel del mar). Las ubicaciones no válidas (de las que no tenemos datos) se almacenan
            como -9999.
            {:else if layerId == 'rgb'}
            Una imagen de datos RGB (foto aérea) de la región.
            {:else if layerId == 'annualFlux'}
            Mapa de flujo anual (luz solar anual sobre tejados) de la región. Los valores son kWh/kW/año.
            Se trata de un flujo no enmascarado: el flujo se calcula para cada lugar, no sólo para los tejados de los edificios.
            edificios. Las ubicaciones no válidas se almacenan como -9999: las ubicaciones fuera de nuestra zona de cobertura
            fuera de nuestra zona de cobertura no serán válidas, y algunas ubicaciones dentro de la zona de cobertura, 
            donde no hemos podido calcular el flujo, tampoco serán válidas.
            calcular el flujo.
            {:else if layerId == 'monthlyFlux'}
            El mapa de flujo mensual (luz solar en los tejados, desglosada por meses) de la región. Los valores
            son kWh/kW/año. El archivo de imágenes GeoTIFF al que apunta esta URL contendrá doce
            bandas, correspondientes a enero...diciembre, por orden.
            {:else if layerId == 'hourlyShade'}
            Doce URL de sombra horaria, correspondientes a enero...diciembre, por orden. Cada archivo de imágenes
            archivo de imágenes GeoTIFF contendrá 24 bandas, correspondientes a las 24 horas del día.
            Cada píxel es un número entero de 32 bits, correspondiente a los (hasta) 31 días de ese mes; un
            1 bit significa que el lugar correspondiente puede ver el sol ese día, a esa hora, de ese mes.
            esa hora, de ese mes. Las ubicaciones no válidas se almacenan como -9999 (dado que es negativo, tiene el bit 31 activado.
            negativo, tiene el bit 31 activado, y ningún valor válido podría tener el bit 31 activado, ya que correspondería al día 32 del mes.
            correspondería al día 32 del mes).
            {/if}
          </p>

          {#if layer.palette}
            <div>
              <div
                class="h-2 outline rounded-sm"
                style={`background: linear-gradient(to right, ${layer.palette.colors.map(
                  (hex) => '#' + hex,
                )})`}
              />
              <div class="flex justify-between pt-1 label-small">
                <span>{layer.palette.min}</span>
                <span>{layer.palette.max}</span>
              </div>
            </div>
          {/if}
        </div>
      </SummaryCard>
    </div>
  {/if}
</div>

<div class="absolute bottom-6 left-0 w-full">
  <div class="md:mr-96 mr-80 grid place-items-center">
    {#if layer}
      <div
        class="flex items-center surface on-surface-text pr-4 text-center label-large rounded-full shadow-md"
      >
        {#if layer.id == 'monthlyFlux'}
          <md-slider
            range
            min={0}
            max={11}
            value-start={month}
            value-end={month}
            on:input={onSliderChange}
          />
          <span class="w-8">{monthNames[month]}</span>
        {:else if layer.id == 'hourlyShade'}
          <md-slider
            range
            min={0}
            max={23}
            value-start={hour}
            value-end={hour}
            on:input={onSliderChange}
          />
          <span class="w-24 whitespace-nowrap">
            {monthNames[month]}
            {day},
            {#if hour == 0}
              12am
            {:else if hour < 10}
              {hour}am
            {:else if hour < 12}
              {hour}am
            {:else if hour == 12}
              12pm
            {:else if hour < 22}
              {hour - 12}pm
            {:else}
              {hour - 12}pm
            {/if}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>

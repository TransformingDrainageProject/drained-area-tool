'use strict';

require([
  'esri/geometry/Extent',
  'esri/Graphic',
  'esri/PopupTemplate',
  'esri/layers/MapImageLayer',
  'esri/layers/TileLayer',
  'esri/layers/WMSLayer',
  'esri/Map',
  'esri/request',
  'esri/views/MapView',
  'esri/widgets/BasemapGallery',
  'esri/widgets/Expand',
  'esri/widgets/LayerList',
  'esri/widgets/Legend',
  'esri/widgets/ScaleBar',
  'esri/widgets/Search',
], function (
  Extent,
  Graphic,
  PopupTemplate,
  MapImageLayer,
  TileLayer,
  WMSLayer,
  Map,
  esriRequest,
  MapView,
  BasemapGallery,
  Expand,
  LayerList,
  Legend,
  ScaleBar,
  Search
) {
  // Initialize map
  const map = new Map({
    basemap: 'topo',
  });

  const view = new MapView({
    container: 'viewDiv',
    map: map,
    zoom: 6,
    center: [-97.048, 43.0],
    extent: new Extent(
      -100.00035920442963,
      35.99568300000004,
      -80.51845400000002,
      49.38435800000008
    ),
  });

  view.when(function () {
    const search = new Search({ view: view });
    view.ui.add(search, { position: 'top-right' });

    const basemapGallery = new BasemapGallery({
      view: view,
      container: document.createElement('div'),
    });

    // Create an Expand instance and set the content
    // property to the DOM node of the basemap gallery widget
    // Use an Esri icon font to represent the content inside
    // of the Expand widget
    const bgExpand = new Expand({
      view: view,
      content: basemapGallery,
    });
    // close the expand whenver a basemap is selected
    basemapGallery.watch('activeBasemap', function () {
      const mobileSize =
        view.heightBreakpoint === 'xsmall' || view.widthBreakpoint === 'xsmall';

      if (mobileSize) {
        bgExpand.collapse();
      }
    });
    view.ui.add(bgExpand, 'top-left');

    const scaleBar = new ScaleBar({ view: view, unit: 'dual' });
    view.ui.add(scaleBar, { position: 'bottom-right' });

    const drainedAreaUrl =
      'https://montana.agriculture.purdue.edu/geoserver/drainedarea/ows';

    const drainedAreaFeatureInfoURL =
      'https://montana.agriculture.purdue.edu/geoserver/drainedarea/WMS/?service=WMS&version=1.3.0';

    const boundaryLayers = new WMSLayer({
      url: drainedAreaUrl,
      version: '1.3.0',
      featureInfoFormat: 'application/json',
      featureInfoUrl: drainedAreaFeatureInfoURL,
      sublayers: [
        {
          name: 'drainedarea:huc8_w_drainclass',
          title: 'Watershed (HUC 8)',
          visible: false,
        },
        {
          name: 'drainedarea:county_w_drainclass',
          title: 'County',
          visible: false,
        },
        { name: 'drainedarea:state_w_drainclass', title: 'State' },
      ],
      title: 'Boundaries',
    });

    const drainageClassScoresURL =
      'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer';
    const drainageClassScoreLayer = new MapImageLayer({
      url: drainageClassScoresURL,
      opacity: 0.6,
      id: 'drainageClassScores',
      title: 'Drainage Class Scores',
    });

    const soilDrainageClassURL =
      'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_CONUS_Drainage_Classes/MapServer';
    const soilDrainageClassLayer = new TileLayer({
      url: soilDrainageClassURL,
      opacity: 0.6,
      visible: false,
      id: 'drainageClassLayer',
      title: 'Soil',
    });

    map.layers.push(
      soilDrainageClassLayer,
      drainageClassScoreLayer,
      boundaryLayers
    );

    const layerList = new Expand({
      content: new LayerList({
        view: view,
      }),
      view: view,
      expanded: true,
    });
    view.ui.add(layerList, 'top-right');

    const legend = new Expand({
      content: new Legend({
        view: view,
        style: 'card',
        layerInfos: [
          {
            layer: drainageClassScoreLayer,
            title: 'Drainage Class Scores',
          },
          {
            layer: soilDrainageClassLayer,
            title: 'Soil',
          },
        ],
      }),
      view: view,
      expanded: true,
    });
    view.ui.add(legend, 'bottom-left');

    view.popup.autoOpenEnabled = false;
    view.on('click', function (event) {
      const mapPoint = event.mapPoint;
      const screenPoint = event.screenPoint;

      executeIdentifyTask(mapPoint, screenPoint, view);
    });
  });

  function executeIdentifyTask(mapPoint, screenPoint, view) {
    const url =
      'https://montana.agriculture.purdue.edu/geoserver/drainedarea/wms';
    const options = {
      query: {
        SERVICE: 'WMS',
        VERSION: '1.1.1',
        REQUEST: 'GetFeatureInfo',
        QUERY_LAYERS:
          'drainedarea:county_w_drainclass,drainedarea:state_w_drainclass,drainedarea:huc8_w_drainclass',
        LAYERS:
          'drainedarea:county_w_drainclass,drainedarea:state_w_drainclass,drainedarea:huc8_w_drainclass',
        INFO_FORMAT: 'application/json',
        FEATURE_COUNT: 50,
        X: screenPoint.x,
        Y: screenPoint.y,
        SRS: 'EPSG:3857',
        WIDTH: view.width,
        HEIGHT: view.height,
        BBOX: `${view.extent.xmin},${view.extent.ymin},${view.extent.xmax},${view.extent.ymax}`,
      },
    };

    esriRequest(url, options).then(function (response) {
      if (response && response.data) {
        createPopup(mapPoint, response.data, view);
      } else {
        view.popup = null;
        view.popup.open({
          location: mapPoint,
          title: 'Error',
          content: 'Unable to process request at this time.',
        });
      }
    });
  }

  function createPopup(mapPoint, data, view) {
    let graphics = [];

    data.features.forEach(function (feature) {
      const featureID = feature.id.split('.')[0].split('_')[0];
      const boundary = featureID === 'huc8' ? 'watershed' : featureID;
      let popupContent = '';
      let popupGraphic = new Graphic();
      let props = feature.properties;

      popupContent = `<strong>${
        featureID === 'huc8' ? `${props.name} (${props.huc8})` : props.NAME
      }</strong><br /><br />`;
      popupContent += 'Acres Likely Drained: ';
      popupContent += `${formatNumber(props.LIKELY_ARE)}<br />`;
      popupContent += 'Acres Likely or Potentially Drained: ';
      popupContent += `${formatNumber(
        parseFloat(props.LIKELY_ARE) + parseFloat(props.POTENTIALL)
      )}<br />`;
      popupContent += `Percent of ${boundary} likely drained: `;
      popupContent += `${props.LIKELY_PER.toFixed(2)}%<br />`;
      popupContent += `Percent of ${boundary} likely or potentially drained: `;
      popupContent += `${(
        parseFloat(props.LIKELY_PER) + parseFloat(props.POTENTIA_1)
      ).toFixed(2)}%`;

      popupGraphic.popupTemplate = new PopupTemplate({
        title: `Likely drained agricultural lands by ${boundary}`,
        content: popupContent,
      });

      graphics.push(popupGraphic);
    });

    function formatNumber(n) {
      return parseFloat(n.toFixed(2)).toLocaleString();
    }

    view.popup.open({
      location: mapPoint,
      features: graphics,
    });
  }
});

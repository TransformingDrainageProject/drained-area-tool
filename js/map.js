'use strict';

require([
  'dojo/parser',
  'esri/dijit/Popup',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'dojo/dom-construct',
  'esri/map',
  'esri/dijit/BasemapToggle',
  'esri/dijit/BasemapGallery',
  'esri/arcgis/utils',
  'esri/dijit/HomeButton',
  'esri/dijit/LocateButton',
  'esri/dijit/Search',
  'esri/layers/ArcGISDynamicMapServiceLayer',
  'esri/layers/ArcGISTiledMapServiceLayer',
  'esri/layers/FeatureLayer',
  'esri/dijit/LayerList',
  'esri/dijit/Legend',
  'esri/dijit/Scalebar',
  'esri/geometry/webMercatorUtils',
  'esri/tasks/IdentifyTask',
  'esri/tasks/IdentifyParameters',
  'dojo/_base/array',
  'esri/InfoTemplate',
  'dojo/promise/all',
  'dojo/dom',
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/TitlePane',
  'dojo/domReady!',
], function (
  parser,
  Popup,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Color,
  domConstruct,
  Map,
  BasemapToggle,
  BasemapGallery,
  arcgisUtils,
  HomeButton,
  LocateButton,
  Search,
  ArcGISDynamicMapServiceLayer,
  ArcGISTiledMapServiceLayer,
  FeatureLayer,
  LayerList,
  Legend,
  Scalebar,
  webMercatorUtils,
  IdentifyTask,
  IdentifyParameters,
  arrayUtils,
  InfoTemplate,
  All,
  dom
) {
  parser.parse();

  //Add widgets on the map
  const popup = new Popup(
    {
      fillSymbol: new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 0, 0]),
          2
        ),
        new Color([255, 255, 0, 0.25])
      ),
    },
    domConstruct.create('div')
  );

  const map = new Map('map', {
    basemap: 'topo',
    center: [-90.048, 43.0],
    zoom: 6,
    infoWindow: popup,
  });

  const basemapGallery = new BasemapGallery(
    {
      showArcGISBasemaps: true,
      map: map,
    },
    'basemapGallery'
  );

  basemapGallery.startup();

  basemapGallery.on('error', function (msg) {
    console.log('basemap gallery error:  ', msg);
  });

  const home = new HomeButton(
    {
      map: map,
    },
    'HomeButton'
  );

  home.startup();

  const geoLocate = new LocateButton(
    {
      map: map,
    },
    'LocateButton'
  );

  geoLocate.startup();

  const search = new Search(
    {
      map: map,
    },
    dom.byId('search')
  );

  search.startup();

  //Add dynamic map layers from Mapserver
  const huc12FeatureLayer = new FeatureLayer(
    'https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer/6'
  );

  const featureURL0 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/studyarea/MapServer';

  const operationalLayer0 = new ArcGISDynamicMapServiceLayer(featureURL0, {
    visible: true,
    id: '0',
  });

  const rasterURL1 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer';

  const operationalLayer1 = new ArcGISDynamicMapServiceLayer(rasterURL1, {
    opacity: 0.6,
    visible: true,
    id: '1',
  });

  const rasterURL2 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_CONUS_Drainage_Classes/MapServer';

  const operationalLayer2 = new ArcGISTiledMapServiceLayer(rasterURL2, {
    opacity: 0.6,
    visible: false,
    id: '2',
  });

  const rasterURL3 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_Hillshade/MapServer';

  const operationalLayer3 = new ArcGISTiledMapServiceLayer(rasterURL3, {
    opacity: 0.3,
    visible: true,
    id: '3',
  });

  map.addLayers([
    operationalLayer0,
    operationalLayer1,
    operationalLayer2,
    operationalLayer3,
  ]);

  map.on('layers-add-result', function (evt) {
    const layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
      return { layer: layer.layer, title: ' ' };
    });

    let layerLegends = [];

    for (let i = 0; i < layerInfo.length; i++) {
      if (layerInfo[i].layer.id !== '3') {
        layerLegends.push(layerInfo[i]);
      }
    }

    if (layerLegends.length > 0) {
      const legendDijit = new Legend(
        {
          map: map,

          layerInfos: layerLegends.reverse(),
        },
        'legendDiv'
      );
      legendDijit.startup();
    }
  });

  //Map event handling
  dojo.connect(map, 'onLoad', mapReady);
  dojo.connect(map, 'onMouseMove', showCoordinates);

  const layerList = new LayerList(
    {
      map: map,
      layers: [
        {
          layer: operationalLayer0,
          id: 'State Boundary',
          visibility: true,
        },
        {
          layer: operationalLayer3,
          id: 'Hillshade',
          visibility: true,
        },
      ],
      showLegend: false,
      showSubLayers: false,
      showOpacitySlider: false,
    },
    'layerList'
  );
  layerList.startup();

  const layerList1 = new LayerList(
    {
      map: map,
      layers: [
        {
          layer: operationalLayer2,
          id: 'Natural Drainage Class',
          visibility: false,
        },
        {
          layer: operationalLayer1,
          id: 'Agriculture Drainage Likely Extent',
          visibility: true,
        },
      ],
      showLegend: false,
      showSubLayers: false,
      showOpacitySlider: false,
    },
    'layerList1'
  );
  layerList1.startup();

  const scalebar = new Scalebar({
    map: map,
    scalebarUnit: 'dual',
  });

  function mapReady(map) {
    const identifyTask = new IdentifyTask(
      'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer'
    );
    const identifyParams = new IdentifyParameters();
    identifyParams.tolerance = 1;
    identifyParams.returnGeometry = true;
    identifyParams.layerIds = [0];
    identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
    identifyParams.width = map.width;
    identifyParams.height = map.height;

    dojo.connect(map, 'onClick', function (event) {
      huc12FeatureLayer
        .queryFeatures({
          geometry: event.mapPoint,
          outFields: ['*'],
          returnGeometry: false,
        })
        .then(function (result) {
          executeIdentifyTask(
            event,
            identifyParams,
            identifyTask,
            result.features[0].attributes
          );
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  }

  function executeIdentifyTask(
    event,
    identifyParams,
    identifyTask,
    featureAttributes
  ) {
    console.log('executeIdentifyTask');
    identifyParams.geometry = event.mapPoint;
    identifyParams.mapExtent = map.extent;

    const deferred = identifyTask.execute(identifyParams);
    deferred.addCallback(function (response) {
      // response is an array of identify result objects
      // Let's return an array of features.
      return arrayUtils.map(response, function (result) {
        let feature = result.feature;
        let layerName = 'Drainage conditions';
        feature.attributes.layerName = layerName;

        const condition = {
          0: 'Unlikely to be drained',
          1: 'Potentially drained',
          2: 'Likely to be drained',
        };

        const naturalClass = {
          0: 'Moderately well - Excessively drained',
          1: 'Somewhat poorly drained',
          2: 'Poorly - Very poorly drained',
        };

        const drainageCondition = new InfoTemplate(
          layerName,
          condition[feature.attributes['Pixel Value']] +
            '<br/><br/>Natural drainage class: ' +
            naturalClass[feature.attributes['Pixel Value']] +
            '<br/><br/>Area (ac): ' +
            featureAttributes['AREAACRES'] +
            '<br/><br/>HUC12: ' +
            featureAttributes['HUC12']
        );

        feature.setInfoTemplate(drainageCondition);

        return feature;
      });
    });

    // InfoWindow expects an array of features from each deferred
    // object that you pass. If the response from the task execution
    // above is not an array of features, then you need to add a callback
    // like the one above to post-process the response and return an
    // array of features.
    map.infoWindow.setFeatures([deferred]);
    map.infoWindow.show(event.mapPoint);
  }

  function showCoordinates(evt) {
    //the map is in web mercator but display coordinates in geographic (lat, long)
    const mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);

    //display mouse coordinates
    dom.byId('info').innerHTML = mp.x.toFixed(3) + ', ' + mp.y.toFixed(3);
  }
});

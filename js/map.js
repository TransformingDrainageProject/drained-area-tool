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
  var popup = new Popup(
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

  var map = new Map('map', {
    basemap: 'topo',
    center: [-90.048, 43.0],
    zoom: 6,
    infoWindow: popup,
  });

  var basemapGallery = new BasemapGallery(
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

  var home = new HomeButton(
    {
      map: map,
    },
    'HomeButton'
  );

  home.startup();

  var geoLocate = new LocateButton(
    {
      map: map,
    },
    'LocateButton'
  );

  geoLocate.startup();

  var search = new Search(
    {
      map: map,
    },
    dom.byId('search')
  );

  search.startup();

  //Add dynamic map layers from Mapserver

  var featureURL0 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/studyarea/MapServer';

  var operationalLayer0 = new ArcGISDynamicMapServiceLayer(featureURL0, {
    visible: true,
    id: '0',
  });

  var rasterURL1 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer';

  var operationalLayer1 = new ArcGISDynamicMapServiceLayer(rasterURL1, {
    opacity: 0.6,
    visible: true,
    id: '1',
  });

  var rasterURL2 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_CONUS_Drainage_Classes/MapServer';

  var operationalLayer2 = new ArcGISTiledMapServiceLayer(rasterURL2, {
    opacity: 0.6,
    visible: false,
    id: '2',
  });

  var rasterURL3 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_Hillshade/MapServer';

  var operationalLayer3 = new ArcGISTiledMapServiceLayer(rasterURL3, {
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
    var layerInfo = arrayUtils.map(evt.layers, function (layer, index) {
      return { layer: layer.layer, title: ' ' };
    });

    var layerLegends = [];

    for (i = 0; i < layerInfo.length; i++) {
      if (layerInfo[i].layer.id !== '3') {
        layerLegends.push(layerInfo[i]);
      } else {
      }
    }

    if (layerLegends.length > 0) {
      var legendDijit = new Legend(
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

  var layerList = new LayerList(
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

  var layerList1 = new LayerList(
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

  var scalebar = new Scalebar({
    map: map,
    scalebarUnit: 'dual',
  });

  function mapReady(map) {
    dojo.connect(map, 'onClick', executeIdentifyTask);

    identifyTask = new IdentifyTask(
      'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer'
    );
    identifyParams = new IdentifyParameters();
    identifyParams.tolerance = 1;
    identifyParams.returnGeometry = true;
    identifyParams.layerIds = [0];
    identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
    identifyParams.width = map.width;
    identifyParams.height = map.height;
  }

  function executeIdentifyTask(event) {
    identifyParams.geometry = event.mapPoint;
    identifyParams.mapExtent = map.extent;

    var deferred = identifyTask.execute(identifyParams);
    deferred.addCallback(function (response) {
      // response is an array of identify result objects
      // Let's return an array of features.
      return arrayUtils.map(response, function (result) {
        var feature = result.feature;
        var layerName = 'Drainage conditions';

        feature.attributes.layerName = layerName;

        var condition = {
          0: 'Unlikely to be drained',
          1: 'Potentially drained',
          2: 'Likely to be drained',
        };

        var naturalClass = {
          0: 'Moderately well - Excessively drained',
          1: 'Somewhat poorly drained',
          2: 'Poorly - Very poorly drained',
        };

        var drainageCondition = new InfoTemplate(
          layerName,
          condition[feature.attributes['Pixel Value']] +
            '<br/><br/>Natural drainage class: ' +
            naturalClass[feature.attributes['Pixel Value']]
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
    var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);

    //display mouse coordinates
    dom.byId('info').innerHTML = mp.x.toFixed(3) + ', ' + mp.y.toFixed(3);
  }
});

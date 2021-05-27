'use strict';

require([
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/TitlePane',
  'dojo/domReady!',
]);

require([
  'dojo/_base/array',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/parser',
  'esri/Color',
  'esri/dijit/BasemapGallery',
  'esri/dijit/HomeButton',
  'esri/dijit/LayerList',
  'esri/dijit/Legend',
  'esri/dijit/LocateButton',
  'esri/dijit/Popup',
  'esri/dijit/Scalebar',
  'esri/dijit/Search',
  'esri/geometry/Extent',
  'esri/geometry/webMercatorUtils',
  'esri/InfoTemplate',
  'esri/layers/ArcGISDynamicMapServiceLayer',
  'esri/layers/ArcGISTiledMapServiceLayer',
  'esri/layers/FeatureLayer',
  'esri/layers/WMSLayer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/map',
  'esri/tasks/IdentifyParameters',
  'esri/tasks/IdentifyTask',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
], function (
  arrayUtils,
  dom,
  domConstruct,
  parser,
  Color,
  BasemapGallery,
  HomeButton,
  LayerList,
  Legend,
  LocateButton,
  Popup,
  Scalebar,
  Search,
  Extent,
  webMercatorUtils,
  InfoTemplate,
  ArcGISDynamicMapServiceLayer,
  ArcGISTiledMapServiceLayer,
  FeatureLayer,
  WMSLayer,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Map,
  IdentifyParameters,
  IdentifyTask,
  Query,
  QueryTask
) {
  parser.parse();

  //Add widgets on the map
  const popup = new Popup(
    {
      fillSymbol: new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_NULL,
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
    center: [-97.048, 43.0],
    zoom: 6,
    showLabels: 'true',
    infoWindow: popup,
    extent: new Extent(
      -100.00035920442963,
      35.99568300000004,
      -80.51845400000002,
      49.38435800000008
    ),
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
  esri.config.defaults.io.corsEnabledServers.push(
    'https://montana.agriculture.purdue.edu/geoserver'
  );
  var url = 'https://montana.agriculture.purdue.edu/geoserver/drainedarea/ows';
  const opts = {
    visible: false,
    format: 'png',
    version: '1.3.0',
    visibleLayers: ['drainedarea:huc8_w_drainclass'],
    featureInfoFormat: 'application/json',
    getFeatureInfoUrl:
      'https://montana.agriculture.purdue.edu/geoserver/drainedarea/WMS/?service=WMS&version=1.3.0&info_format=application/json',
  };
  var huc8FeatureLayer = new WMSLayer(url, opts);
  huc8FeatureLayer.id = 'huc8layer';
  console.log(huc8FeatureLayer);
  //Add dynamic map layers from Mapserver

  const opts2 = {
    format: 'png',
    version: '1.3.0',
    visibleLayers: ['drainedarea:state_w_drainclass'],
  };
  var stateLayer = new WMSLayer(url, opts2);
  stateLayer.id = 'stateLayer';
  console.log(stateLayer);

  const opts3 = {
    format: 'png',
    version: '1.3.0',
    visibleLayers: ['drainedarea:county_w_drainclass'],
    visible: false,
  };
  var countyFeatureLayer = new WMSLayer(url, opts3);
  countyFeatureLayer.id = 'countyFeatureLayer';

  const querylayers = [];

  const rasterURL1 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/Drainage_class_score2/MapServer';
  const operationalLayer1 = new ArcGISDynamicMapServiceLayer(rasterURL1, {
    opacity: 0.6,
    visible: true,
    id: 'drainageExtentLayer',
  });

  const rasterURL2 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_CONUS_Drainage_Classes/MapServer';

  const operationalLayer2 = new ArcGISTiledMapServiceLayer(rasterURL2, {
    opacity: 0.6,
    visible: false,
    id: 'drainageClassLayer',
  });

  const rasterURL3 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Isee/USA_Hillshade/MapServer';

  const operationalLayer3 = new ArcGISTiledMapServiceLayer(rasterURL3, {
    opacity: 0.3,
    visible: true,
    id: '3',
  });

  map.addLayers([
    stateLayer,
    operationalLayer1,
    operationalLayer2,
    operationalLayer3,
    huc8FeatureLayer,
    countyFeatureLayer,
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

  const layerList2 = new LayerList(
    {
      map: map,
      layers: [
        {
          layer: huc8FeatureLayer,
          id: 'HUC8 Watershed',
          title: 'HUC8 Watershed',
          visibility: false,
        },
        {
          layer: countyFeatureLayer,
          id: 'County',
          title: 'County',
          visibility: false,
        },
      ],
      showLegend: false,
      showSubLayers: false,
      showOpacitySlider: false,
    },
    'layerList2'
  );
  layerList2.startup();

  const scalebar = new Scalebar({
    map: map,
    scalebarUnit: 'dual',
  });

  function mapReady(map) {
    dojo.connect(map, 'onClick', function (event) {
      let identitfyResults = [];
      let mapPoint = event.mapPoint;
      let screenPoint = event.screenPoint;
console.log(event);
      map.infoWindow.clearFeatures();
      map.infoWindow.setTitle('Likely drained agricultural land by state');
      map.infoWindow.setContent('Loading...');
      map.infoWindow.show(mapPoint);
      const requiredLayers = [
        'stateLayer',
        'countyFeatureLayer',
        'huc8FeatureLayer',
        'drainageExtentLayer',
        'drainageClassLayer',
      ];

      // Create array of dynamic nad feature layers' ids

      const featureLayers = dojo.map(map.graphicsLayerIds, function (layerId) {
        return map.getLayer(layerId);
      });
      // Filter layers to only layers that need identify operation (e.g. visible)
      const showFeatureLayers = dojo.filter(querylayers, function (layer) {
        return layer;
      });
      // Create array of Query tasks for each feature layer
      const queryTasks = dojo.map(showFeatureLayers, function (layer) {
        return new QueryTask(layer.url);
      });
      const queries = createQueryParams(showFeatureLayers, event);
      const queryPromises = queryTasks.map(function (task, index) {
        return task.execute(queries[index]);
      });
      const promises = queryPromises;
      Promise.all(promises).then(function (response) {
        let responseLayers = { dynamic: [], feature: [] };
        response.forEach(function (rep) {
          if (Array.isArray(rep)) {
            responseLayers.dynamic.push(rep);
          } else {
            responseLayers.feature.push(rep);
            console.log(rep);
          }
        });
        executeIdentifyTask(responseLayers, mapPoint, screenPoint);
      });
    });
  }

  function createQueryParams(showLayers, event) {
    const queryParamsList = dojo.map(showLayers, function (layer) {
      const queryParams = new Query();
      queryParams.geometry = event.mapPoint;
      queryParams.outFields = ['*'];
      queryParams.returnGeometry = true;

      return queryParams;
    });

    return queryParamsList;
  }

  function createIdentifyParams(showLayers, event) {
    const identifyParamsList = dojo.map(showLayers, function (layer) {
      const identifyParams = new IdentifyParameters();
      identifyParams.width = map.width;
      identifyParams.height = map.height;
      identifyParams.geometry = event.mapPoint;
      identifyParams.mapExtent = map.extent;
      identifyParams.tolerance = 3;
      identifyParams.returnGeometry = true;

      // Map service may have multiple layers, collect those here
      const subLayers = dojo.map(layer.layerInfos, function (subLayer) {
        if (subLayer.subLayerIds) {
          return subLayer.subLayerIds;
        } else {
          return subLayer.id;
        }
      });
      identifyParams.layerIds = subLayers;
      return identifyParams;
    });

    return identifyParamsList;
  }

  function executeIdentifyTask(response, mapPoint, screenPoint, queries, queryTasks) {
    let results = [];
    let taskUrls = [];
    let featureResults = [];
    console.log(response);
    const featureLayers = dojo.filter(response.feature, function (layer) {
      return layer;
    });
    for (let i = 0; i < featureLayers.length; i++) {
      featureResults = featureResults.concat(featureLayers[i]);
    }
    var huc8num;
    var countyfips;
    var statefips;
    featureResults = dojo.map(featureResults, function (result, index) {
      let feature = result.features[0];
      var layerName;
      if (result.fields[1].name == 'NAME') {
        layerName = 'Counties';
        statefips = feature.attributes['STATE_FIPS'];
        countyfips = feature.attributes['FIPS'];
      } else {
        layerName = 'HUC8 Watersheds';
        huc8num = feature.attributes['huc8'];
      }
      feature.attributes.layerName = layerName;
      const drainageCondition = new InfoTemplate(layerName);
      feature.setInfoTemplate(drainageCondition);

      return feature;
    });
    /* code for querying from our server the acres likely drained */
    var queryurl = "https://montana.agriculture.purdue.edu/geoserver/drainedarea/wms";
    var layersRequest = esri.request({
	url: queryurl,
	content: {SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetFeatureInfo', 
          QUERY_LAYERS: 'drainedarea:county_w_drainclass,drainedarea:state_w_drainclass,drainedarea:huc8_w_drainclass',
	  LAYERS: 'drainedarea:county_w_drainclass,drainedarea:state_w_drainclass,drainedarea:huc8_w_drainclass',
	  INFO_FORMAT: 'application/json', FEATURE_COUNT: 50, X: screenPoint.x, Y: screenPoint.y, 
	  SRS: "EPSG:" + 3857, WIDTH: map.width, HEIGHT: map.height, BBOX: map.extent.xmin + ',' + map.extent.ymin + ',' + map.extent.xmax + ',' + map.extent.ymax },
	handleAs: 'json',
	callbackParamName: 'callback',
    });
    let responseobj = {};
    Promise.resolve(layersRequest).then(function (response) {
      responseobj = response;
      createPopups(responseobj, mapPoint);
      return response;
    });

    return featureResults;
  }
  function createPopups(responseobj, mapPoint) {
console.log(responseobj);
    let features = responseobj.features;
console.log(features.length);
    let size = features.length;
    var countydata;
    var statedata;
    var hucdata;
    for (var i = 0; i < size; i++) {
       if (features[i].id.includes("county") && countydata == null) {
	  countydata = responseobj.features[i].properties;
       } if (features[i].id.includes("state") && statedata == null) {
	  statedata = responseobj.features[i].properties;
       } if (features[i].id.includes("huc8") && hucdata == null) {
          hucdata = responseobj.features[i].properties;
       }
    }
    var windowFeatures = [];
    console.log(responseobj);
    /* check for response error */
    if (responseobj.error) {
      map.infoWindow.clearFeatures();
      map.infoWindow.setTitle('Error');
      map.infoWindow.setContent(responseobj.results.error);
      map.infoWindow.show(mapPoint);
    } else {
      /* state popup */
      var statecontent =
        '<b>' +
        statedata.NAME +
        '</b><br> Area in acres: <br> &emsp;Acres Likely Drained: ' +
        statedata.LIKELY_ARE.toFixed(2) +
        '<br>&emsp;Acres Likely or Potentially Drained: ' +
        statedata.POTENTIALL.toFixed(2) +
        '<br>Percent of state: <br> &emsp;Percent of state likely drained: ' +
        statedata.LIKELY_PER.toFixed(2) +
        '<br>&emsp;Percent of state likely or potentially drained: ' +
        statedata.POTENTIA_1.toFixed(2); // +
      // "<br>&emsp;Percent of ag land: <br> Percent of Ag land likely to be drained: " + statedata.per_ag_likely.toFixed(2) +
      // "<br>P&emsp;ercent of ag land likely or potentially to be drained: " + statedata.per_st_likely_pot.toFixed(2);
      var state = {
        getLayer: function () {}, // as long as it returns null, you're good
        attributes: {}, // this does not influence the content in the popup
        getInfoTemplate: function () {
          return {
            title: 'Likely drained agricultural lands by state',
            content: statecontent,
            declaredClass: 'esri.InfoTemplate',
          };
        },
        getTitle: function () {
          return this.getInfoTemplate().title;
        },
        getContent: function () {
          return statecontent;
        },
      };
      windowFeatures.push(state);

      /* county popup */
      var countycontent =
        '<b>' +
        countydata.NAME +
        '</b><br>Area in acres:<br> &emsp;Acres Likely Drained: ' +
        countydata.LIKELY_ARE.toFixed(2) +
        '<br> &emsp;Acres Likely or Potentially Drained: ' +
        countydata.POTENTIALL.toFixed(2) +
        '<br>Percent of county: <br> &emsp;Percent of county likely drained: ' +
        countydata.LIKELY_PER.toFixed(2) +
        '<br>&emsp;Percent of county likely or potentially drained: ' +
        countydata.POTENTIA_1.toFixed(2); // +
      // "<br>&emsp; Percent of ag land: <br> Percent of Ag land likely to be drained: " + countydata.per_ag_likely.toFixed(2) +
      // "<br>&emsp; Percent of ag land likely or potentially to be drained: " + countydata.per_st_likely_pot.toFixed(2);
      var county = {
        getLayer: function () {},
        attributes: {},
        getInfoTemplate: function () {
          return {
            title: 'Likely drained agricultural lands by county',
            content: '${*}',
            declaredClass: 'esri.InfoTemplate',
          };
        },
        getTitle: function () {
          return this.getInfoTemplate().title;
        },
        getContent: function () {
          return countycontent;
        },
      };
      windowFeatures.push(county);

      /* huc8 popup */
      var huccontent =
        '<b>' +
        hucdata.name +
        ' ' +
        hucdata.huc8 +
        '</b><br> Area in acres: <br> &emsp;Acres Likely Drained: ' +
        hucdata.LIKELY_ARE.toFixed(2) +
        '<br>&emsp;Acres Likely or Potentially Drained: ' +
        hucdata.POTENTIALL.toFixed(2) +
        '<br>Percent of watershed: <br>&emsp;Percent of watershed likely drained: ' +
        hucdata.LIKELY_PER.toFixed(2) +
        '<br>&emsp;Percent of watershed likely or potentially drained: ' +
        hucdata.POTENTIA_1.toFixed(2); //+
      // "<br>&emsp;Percent of ag land: <br> Percent of Ag land likely to be drained: " + hucdata.per_ag_likely.toFixed(2) +
      // "<br>&emsp;Percent of ag land likely or potentially to be drained: " + hucdata.per_st_likely_pot.toFixed(2);
      var huc = {
        getLayer: function () {},
        attributes: {},
        getInfoTemplate: function () {
          return {
            title: 'Likely drained agricultural lands by watershed',
            content: '${*}',
            declaredClass: 'esri.InfoTemplate',
          };
        },
        getTitle: function () {
          return this.getInfoTemplate().title;
        },
        getContent: function () {
          return huccontent;
        },
      };
      windowFeatures.push(huc);
      map.infoWindow.resize(400, 100);
      map.infoWindow.setFeatures(windowFeatures);
      map.infoWindow.show(mapPoint);
    }
    return responseobj;
  }
  function executeIdentifyTask2(
    event,
    identifyParams,
    identifyTask
    //  featureAttributes
  ) {
    identifyParams.geometry = event.mapPoint;
    identifyParams.mapExtent = map.extent;
    identifyTask = new IdentifyTask(huc8FeatureURL);
    const deferred = []; // = identifyTask.execute(identifyParams);
    //    deferred.addCallback(function (response) {
    identifyTask.execute(identifyParams).then(function (response) {
      // response is an array of identify result objects
      // Let's return an array of features.
      return arrayUtils.map(response, function (result) {
        let feature = result.feature;
        let layerName = 'Drained condition';
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
            '<br/><br/>HUC8: ' +
            featureAttributes['HUC8']
        );

        feature.setInfoTemplate(drainageCondition);
        console.log('feature\n');
        deferred = feature;
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

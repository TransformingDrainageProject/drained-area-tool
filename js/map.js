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
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'dojo/_base/array',
  'esri/InfoTemplate',
  'dojo/promise/all',
  'dojo/dom',
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/TitlePane',
  'dojo/domReady!',
  'esri/layers/ImageParameters'
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
  Query,
  QueryTask,
  arrayUtils,
  InfoTemplate,
  All,
  dom,
  ImageParameters
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
    zoom: 9,
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
  const huc8FeatureURL =
    'https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer/4';

    const huc8FeatureLayer = new esri.layers.FeatureLayer(huc8FeatureURL, {
	visible:false,
	id: 'huc8Layer'
   });

  const countyFeatureURL =
    'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0';

  const countyFeatureLayer = new FeatureLayer(countyFeatureURL, {
    opacity: 0.6,
    visible: false,
    id: 'countyLayer',
  });

  const featureURL0 =
    'https://mapsweb.lib.purdue.edu/arcgis/rest/services/Ag/studyarea/MapServer';

  const operationalLayer0 = new ArcGISDynamicMapServiceLayer(featureURL0, {
    visible: true,
    id: 'stateLayer',
  });

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
    operationalLayer0,
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
      if (layerInfo[i].layer.id !== '4') {
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
        {
          layer: operationalLayer0,
          id: 'State',
          visibility: true,
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

      const requiredLayers = [
        'stateLayer',
        'countyFeatureLayer',
        'huc8FeatureLayer',
        'drainageExtentLayer',
        'drainageClassLayer',
      ];

      // Create array of dynamic nad feature layers' ids
      const dynamicLayers = dojo.map(map.layerIds, function (layerId) {
        return map.getLayer(layerId);
      });
      const featureLayers = dojo.map(map.graphicsLayerIds, function (layerId) {
        return map.getLayer(layerId);
      });

      // Filter layers to only layers that need identify operation (e.g. visible)
      const showDynamicLayers = dojo.filter(dynamicLayers, function (layer) {
        if (requiredLayers.indexOf(layer.id) > -1) {
    //      if (layer.visible) {
            return layer;
      //    }
        }
      });
      const showFeatureLayers = dojo.filter(featureLayers, function (layer) {
            return layer;
      });
      // Create array of IdentifyTasks for each dynamic layer
      var identifyTasks = dojo.map(showDynamicLayers, function (layer) {
        return new IdentifyTask(layer.url);
      });

      // Create array of Query tasks for each feature layer
      const queryTasks = dojo.map(showFeatureLayers, function (layer) {
        return new QueryTask(layer.url);
      });

      // Create array of IdentifyParameters for each layer
      const params = createIdentifyParams(showDynamicLayers, event);

      const queries = createQueryParams(showFeatureLayers, event);

      const identifyPromises = identifyTasks.map(function (task, index) {
        return task.execute(params[index]);
      });

      const queryPromises = queryTasks.map(function (task, index) {
        return task.execute(queries[index]);
      });
      const promises = identifyPromises.concat(queryPromises);
      
      Promise.all(promises).then(function (response) {
        let responseLayers = { dynamic: [], feature: [] };
        response.forEach(function (rep) {
          if (Array.isArray(rep)) {
            responseLayers.dynamic.push(rep);
          } else {
            responseLayers.feature.push(rep);
          }
        });
//        identifyTasks = new IdentifyTask(huc8FeatureURL);
        executeIdentifyTask(responseLayers, identifyTasks, mapPoint);
//	executeIdentifyTask2(event, createIdentifyParams(requiredLayers,event), identifyTasks );
      });

    });
  }

  function createQueryParams(showLayers, event) {
    const queryParamsList = dojo.map(showLayers, function (layer) {
      const queryParams = new Query();
      queryParams.geometry = event.mapPoint;
      queryParams.outFields = ['*'];
      queryParams.returnGeometry = false;

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
//      identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
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
//      identifyParams.layerIds = [0,1,2,3,4];
      return identifyParams;
    });

    return identifyParamsList;
  }

  function executeIdentifyTask(response, tasks, mapPoint, queries, queryTasks) {
    let results = [];
    let taskUrls = [];
    let featureResults = []; 
   console.log(response);
    const dynamicLayers = dojo.filter(response.dynamic, function (layer) {
      // Remove inner array
    return layer[0];
    });
    const featureLayers = dojo.filter(response.feature, function (layer) {
	return layer;
});
    for (let i = 0; i < dynamicLayers.length; i++) {
      results = results.concat(dynamicLayers[i]);
      for (let j = 0; j < dynamicLayers[i].length; j++) {
        taskUrls = taskUrls.concat(tasks[i].url);
      }
    }
    for (let i = 0; i < featureLayers.length; i++) {
     	featureResults = featureResults.concat(featureLayers[i]);
    }
    featureResults = dojo.map(featureResults, function (result, index) {
	let feature = result.features[0];
	var layerName;
	if (result.fields[0].name == 'FID') {
		layerName = 'Counties';
	}
	else {
		layerName = 'HUC8 Watersheds';
	}
	feature.attributes.layerName = layerName;
	console.log(feature);
        const drainageCondition = new InfoTemplate(
          layerName,
        );
        feature.setInfoTemplate(drainageCondition);

	return feature;	
   });

    results = dojo.map(results, function (result, index) {
      const feature = result.feature;
      const layerName = result.layerName;
      const serviceUrl = taskUrls[index];
      feature.attributes.layerName = layerName;
      console.log(feature);
      const template = new InfoTemplate(layerName);
      feature.setInfoTemplate(template);
console.log(feature);
      return feature;
    });
    results = results.concat(featureResults);
    if (results.length === 0) {
      map.infoWindow.clearFeatures();
    } else {
      map.infoWindow.setFeatures(results);
    }

    map.infoWindow.show(mapPoint);

    return results;
  }

  function executeIdentifyTask2(
    event,
    identifyParams,
    identifyTask,
  //  featureAttributes
  ) {
    identifyParams.geometry = event.mapPoint;
    identifyParams.mapExtent = map.extent;
    identifyTask = new IdentifyTask(huc8FeatureURL);
    const deferred = [];// = identifyTask.execute(identifyParams);
//    deferred.addCallback(function (response) {
   identifyTask.execute(identifyParams).then(function(response) {  
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
	console.log("feature\n");
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

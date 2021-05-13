'use strict';

require([
  'dojo/parser',
  'esri/dijit/Popup',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'esri/geometry/Extent',
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
  'esri/layers/LabelLayer',
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
  'esri/symbols/TextSymbol',
  'esri/layers/LabelClass',
  'dojo/promise/all',
  'dojo/dom',
  'dijit/layout/BorderContainer',
  'dijit/layout/ContentPane',
  'dijit/TitlePane',
  'dojo/domReady!',
  'esri/layers/ImageParameters',
  'esri/request',
  'esri/config',
  'esri/renderers/Renderer',
  'esri/renderers/SimpleRenderer',
], function (
  parser,
  Popup,
  SimpleFillSymbol,
  SimpleLineSymbol,
  Color,
  Extent,
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
  LabelLayer,
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
  TextSymbol,
  LabelClass,
  All,
  dom,
  ImageParameters,
esriRequest,
  esriConfig,
  Renderer,
  SimpleRenderer,
) {
  parser.parse();


  //Add widgets on the map
  const popup = new Popup(
    {

      fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
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
    showLabels: 'true',
    infoWindow: popup,
    extent: new Extent(-100.00035920442963,35.99568300000004,-80.51845400000002,49.38435800000008),
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

    const huc8FeatureLayer = new FeatureLayer(huc8FeatureURL, {
	visible:false,
	id: 'huc8Layer',
	outFields:["*"],
	opacity: 0.6
   });
  var huc8symbol = new TextSymbol();
  var huc8json = {
  "labelExpressionInfo": {"expression": "$feature.huc8"},
	"maxScale": 0,
	"minScale": 5000000,
 };
  var huc8label = new LabelClass(huc8json);
  huc8label.symbol = huc8symbol;
  huc8FeatureLayer.setLabelingInfo([huc8label]);
  huc8FeatureLayer.setMaxScale(7);
  huc8FeatureLayer.setMinScale(0);
  const countyFeatureURL =
'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/2';
  const countyFeatureLayer = new FeatureLayer(countyFeatureURL, {
    opacity: 0.6,
    visible: false,
    id: 'countyLayer',
    outFields:["*"],
  });
var labelSymbol = new TextSymbol();
var json = {
  "maxScale": 0,
  "minScale": 5000000,
  "labelExpressionInfo": {"expression": "$feature.NAME"}
  };
var labelClass = new LabelClass(json);
labelClass.symbol = labelSymbol;
countyFeatureLayer.setLabelingInfo([ labelClass]);

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
//        {
  //        layer: operationalLayer0,
    //      id: 'State',
      //    visibility: true,
        //},
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
	map.infoWindow.clearFeatures();
	map.infoWindow.setTitle("Likely drained agricultural land by state");
	map.infoWindow.setContent("Loading...");
        map.infoWindow.show(mapPoint);	
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
        executeIdentifyTask(responseLayers, identifyTasks, mapPoint);
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
  function createIdentifyParamsD(layerPolygon, event) {
		const identifyParamsD = new IdentifyParameters();
	identifyParamsD.outFields = ["*"];
		identifyParamsD.mapExtent = layerPolygon.feature.geometry.getExtent();
		identifyParamsD.geometry = layerPolygon.feature.geometry;
		identifyParamsD.geometryType = layerPolygon.geometryType;
		identifyParamsD.tolerance = 100;
		identifyParamsD.returnGeometry = true;
		identifyParamsD.spatialReference = layerPolygon.feature.geometry.spatialReference;
//identifyParamsD.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;

		return identifyParamsD;
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
console.log(results[1]);
    const paramsD = createIdentifyParamsD(results[0], event);
    const identifyTaskD = new IdentifyTask(rasterURL1);
let countOfFeatures = 0;
    const promisesD = identifyTaskD.execute(paramsD);
let finalPromise = Promise.resolve(promisesD);
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
	}
	else {
		layerName = 'HUC8 Watersheds';
		huc8num = feature.attributes['huc8'];
	}
	feature.attributes.layerName = layerName;
        const drainageCondition = new InfoTemplate(
          layerName,
        );
        feature.setInfoTemplate(drainageCondition);

	return feature;	
   });
/* code for querying from our server the acres likely drained */
 esri.config.defaults.io.corsEnabledServers.push("lthia.agriculture.purdue.edu/cgi-bin/drainedarea.py");

	var queryurl = "https://lthia.agriculture.purdue.edu/cgi-bin/drainedarea.py";
	var layersRequest = esri.request({
		url: queryurl,
		content: {"huc": huc8num, "county": countyfips, "state": statefips},
		handleAs:"json",
		callbackParamName:"callback",
	});
        let responseobj = {};
	Promise.resolve(layersRequest).then(function(response) {
		responseobj = response;
      		createPopups(responseobj, mapPoint);
      		return response;
	});


    return featureResults;
  }
  function createPopups(responseobj,mapPoint) {
	let countydata = responseobj.results.county;
	let statedata = responseobj.results.state;
	let hucdata = responseobj.results.huc;
	var windowFeatures = [];
	console.log(responseobj);
if(responseobj.results.error){
	map.infoWindow.clearFeatures();
	map.infoWindow.setTitle("Error");
	map.infoWindow.setContent(responseobj.results.error);
        map.infoWindow.show(mapPoint);
}
else {
	var statecontent = "<b>" +  statedata.state + "</b><br> Area in acres: <br> &emsp;Acres Likely Drained: " + statedata.ac_likely.toFixed(2) +
 "<br>&emsp;Acres Likely or Potentially Drained: " + statedata.ac_likely_pot.toFixed(2) +
 "<br>Percent of state: <br> &emsp;Percent of state likely drained: " + statedata.per_st_likely.toFixed(2) +
 "<br>&emsp;Percent of state likely or potentially drained: " + statedata.per_st_likely_pot.toFixed(2);// +
// "<br>&emsp;Percent of ag land: <br> Percent of Ag land likely to be drained: " + statedata.per_ag_likely.toFixed(2) +
// "<br>P&emsp;ercent of ag land likely or potentially to be drained: " + statedata.per_st_likely_pot.toFixed(2);
var state = {
    getLayer: function () {}, // as long as it returns null, you're good
    attributes: {}, // this does not influence the content in the popup
    getInfoTemplate: function () {
        return { title: "Likely drained agricultural lands by state", content: statecontent, declaredClass: "esri.InfoTemplate" };
    },
    getTitle: function () { return this.getInfoTemplate().title; },
    getContent: function () { return statecontent }
};
windowFeatures.push(state);
        var countycontent = "<b>" + countydata.county + "</b><br>Area in acres:<br> &emsp;Acres Likely Drained: " + countydata.ac_likely.toFixed(2) +
 "<br> &emsp;Acres Likely or Potentially Drained: " + countydata.ac_likely_pot.toFixed(2) +
 "<br>Percent of county: <br> &emsp;Percent of county likely drained: " + countydata.per_co_likely.toFixed(2) +
 "<br>&emsp;Percent of county likely or potentially drained: " + countydata.per_co_likely_pot.toFixed(2);// +
// "<br>&emsp; Percent of ag land: <br> Percent of Ag land likely to be drained: " + countydata.per_ag_likely.toFixed(2) +
// "<br>&emsp; Percent of ag land likely or potentially to be drained: " + countydata.per_st_likely_pot.toFixed(2);
var county = {
    getLayer: function () {},
    attributes: {},
    getInfoTemplate: function () {
        return { title: "Likely drained agricultural lands by county", content: "${*}", declaredClass: "esri.InfoTemplate" };
    },
    getTitle: function () { return this.getInfoTemplate().title; },
    getContent: function () { return countycontent }
};
windowFeatures.push(county);
        var huccontent = "<b>" + hucdata.huc8_name + " " + hucdata.huc8_no + "</b><br> Area in acres: <br> &emsp;Acres Likely Drained: " + hucdata.ac_likely.toFixed(2) +
 "<br>&emsp;Acres Likely or Potentially Drained: " + hucdata.ac_likely_pot.toFixed(2) +
 "<br>Percent of watershed: <br>&emsp;Percent of watershed likely drained: " + hucdata.per_huc8_likely.toFixed(2) +
 "<br>&emsp;Percent of watershed likely or potentially drained: " + hucdata.per_huc8_likely_pot.toFixed(2); //+
// "<br>&emsp;Percent of ag land: <br> Percent of Ag land likely to be drained: " + hucdata.per_ag_likely.toFixed(2) +
// "<br>&emsp;Percent of ag land likely or potentially to be drained: " + hucdata.per_st_likely_pot.toFixed(2);
var huc = {
    getLayer: function () {},
    attributes: {},
    getInfoTemplate: function () {
        return { title: "Likely drained agricultural lands by watershed", content: "${*}", declaredClass: "esri.InfoTemplate" };
    },
    getTitle: function () { return this.getInfoTemplate().title; },
    getContent: function () { return huccontent }
};
	windowFeatures.push(huc);
	map.infoWindow.resize(400,100);
	map.infoWindow.setFeatures(windowFeatures);
	map.infoWindow.show(mapPoint);
}
return responseobj;


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

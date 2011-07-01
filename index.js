// index.js

function loadBottomText(file) {
	//$("#pagetext").load('pages/' + file + '.html');
	$("#pagetext").fadeOut("fast",function() {
		$("#pagetext").load('http://tristan.hume.ca/geosummative/pages/' + file + '.html?rand=' + Math.random(),function(){
			$("#pagetext").fadeIn('fast');
		})
	})
}
function ShowNiagaraKml() {
	var features = DS_ge.getFeatures();
	while (features.getFirstChild())
	   features.removeChild(features.getFirstChild());
	$("#left-sidebar-drive").hide("slow");
	$("#right-sidebar-map").hide("slow");
	$("#indexcell").show("fast");
	
	function kmlFinishedLoading(kmlObject) {
		//alert("kml loaded")
	  if (kmlObject) {
	    DS_ge.getFeatures().appendChild(kmlObject);
	  }
	  if (kmlObject.getAbstractView() !== null)
			DS_ge.getView().setAbstractView(kmlObject.getAbstractView());
	}
	google.earth.fetchKml(DS_ge, "http://tristan.hume.ca/geosummative/places.kml", kmlFinishedLoading);
	// load main page
	loadBottomText("main");
	// add legend
	var screenOverlay = DS_ge.createScreenOverlay('');
	
	// Specify a path to the image and set as the icon
	var icon = DS_ge.createIcon('');
	icon.setHref('http://tristan.hume.ca/geosummative/legend4.png');
	screenOverlay.setIcon(icon);
	
	// Set the ScreenOverlay's position in the window
	screenOverlay.getOverlayXY().setXUnits(DS_ge.UNITS_PIXELS);
	screenOverlay.getOverlayXY().setYUnits(DS_ge.UNITS_PIXELS);
	screenOverlay.getOverlayXY().setX(319);
	screenOverlay.getOverlayXY().setY(500 + 22);
	
	// Set the overlay's size in pixels
	screenOverlay.getSize().setXUnits(DS_ge.UNITS_PIXELS);
	screenOverlay.getSize().setYUnits(DS_ge.UNITS_PIXELS);
	screenOverlay.getSize().setX(639);
	screenOverlay.getSize().setY(45);
	if(!screenOverlay) {
		//alert("starting up")
	}
	//alert(screenOverlay)
	
	// Add the ScreenOverlay to Earth
	DS_ge.getFeatures().appendChild(screenOverlay);
	
	DS_ge.getOptions().setScaleLegendVisibility(true); 
	DS_ge.getOptions().setStatusBarVisibility(true);
	DS_ge.getOptions().setUnitsFeetMiles(false) 
}

/**
 * The global Directions object for the currently loaded directions
 * @type {google.maps.Directions}
 */
var DS_directions = null;

/**
 * The list of driving steps loaded from google.maps.Directions
 * @type {Array.<Object>}
 */
var DS_steps = [];

/**
 * The list of path vertices and their metadata for the driving directions
 * @type {Array.<Object>}
 */
var DS_path = []; // entire driving path

/**
 * The global simulator instance that conducts the driving simulation
 * @type {DDSimulator}
 */
var DS_simulator; // instance of the DDSimulator class

/**
 * The car marker that appears on the reference map to the right of the main
 * simulation screen
 * @type {google.maps.Marker}
 */
var DS_mapMarker = null; // car marker on the Map

/**
 * Instead of using the plugin's built-in ID system, which doesn't like when
 * IDs are reused, we will use a separate dictionary mapping ID to placemark
 * object
 * @type {Object}
 */
var DS_placemarks = {};

/**
 * The callback for when the 'Go!' button is pressed. This uses the Maps API's
 * Directions class to get the route and pull out the individual route steps
 * into a path, which is rendered as a polyline.
 */
function DS_goDirections() {
	//alert("getting directions")
  $('#route-details').empty();
  $('#route-details').html(
      '<span class="loading">Loading directions...</span>');
  
  if (DS_directions)
    DS_directions.clear();

  DS_directions = new google.maps.Directions(DS_map, null);
  
  google.maps.Event.addListener(DS_directions, 'load', DS_directionsLoaded);
  
  google.maps.Event.addListener(DS_directions, 'error', function() {
    $('#route-details').empty();
    $('#route-details').html(
        '<span class="error">No directions found.</span>');
  });
  
  DS_directions.load('from: 15 Norwich Way, Ottawa Ontario to: 5068 St Ctr, Niagara Falls, ON',
  //DS_directions.load('from: 15 Norwich Way, Ottawa Ontario to: 17 Marble Arch Crescent, Ottawa, Ontario, Canada',
      {getSteps: true, getPolyline: true});
}

/**
 * Initialization after directions are loaded
 */
function DS_directionsLoaded() {
  // Directions data has loaded
  $('#route-details').empty();
  var route = DS_directions.getRoute(0);
  var start = route.getStartGeocode();
  var end = route.getEndGeocode();
  
  // build the path and step arrays from the google.maps.Directions route
  DS_buildPathStepArrays();
  
  DS_geHelpers.clearFeatures();
  DS_placemarks = {};
  
  // create the starting point placemark
  DS_placemarks['start'] = DS_geHelpers.createPointPlacemark(
      new google.maps.LatLng(start.Point.coordinates[1],
                             start.Point.coordinates[0]),
      {description: start.address, standardIcon: 'grn-diamond'});
  
  // create the point placemarks for each step in the driving directions
  for (var i = 0; i < DS_steps.length; i++) {
    var step = DS_steps[i];
    
    var placemark = DS_geHelpers.createPointPlacemark(
        step.loc, {description: step.desc, standardIcon: 'red-circle'});
    
    DS_placemarks['step-' + i] = placemark; 
    
    google.earth.addEventListener(placemark, 'click', function(event) {
      // match up the placemark to its id in the dictionary to find out
      // which step number it is
      var id = '';
      for (k in DS_placemarks)
        if (DS_placemarks[k].equals(event.getTarget()))
          id = k;
      
      var stepNum = parseInt(id.match(/step-(\d+)/)[1]);
      
      DS_flyToStep(stepNum);
    });
  }
  
  // create the ending point placemark
  DS_placemarks['end'] = DS_geHelpers.createPointPlacemark(
      new google.maps.LatLng(end.Point.coordinates[1],
                             end.Point.coordinates[0]),
      {description: end.address, standardIcon: 'grn-diamond'});
  
  // build the route LineString; instead of creating a LineString using
  // pushLatLngAlt, which has some performance issues, we will construct a
  // KML blob and use parseKml() 
  var lineStringKml = '<LineString><coordinates>\n';
  
  for (var i = 0; i < DS_path.length; i++)
    lineStringKml +=
        DS_path[i].loc.lng().toString() + ',' +
        DS_path[i].loc.lat().toString() +
        ',10\n';
  
  lineStringKml += '</coordinates></LineString>';
  
  // create the route placemark from the LineString KML blob
  var routeLineString = DS_ge.parseKml(lineStringKml);
  routeLineString.setTessellate(true);
  
  var routePlacemark = DS_ge.createPlacemark('');
  routePlacemark.setGeometry(routeLineString);
  DS_placemarks['route'] = routePlacemark;
  
  routePlacemark.setStyleSelector(
      DS_geHelpers.createLineStyle({width: 10, color: '88ff0000'}));
  
  DS_ge.getFeatures().appendChild(routePlacemark);

  // build the left directions list
  DS_buildDirectionsList();
  
  // fly to the start of the route
  DS_flyToLatLng(new google.maps.LatLng(
                 start.Point.coordinates[1], start.Point.coordinates[0]));
  
  // enable the simulator controls
  $('#simulator-form input').removeAttr('disabled');
  
  // destroy the simulator if exists
  if (DS_simulator) {
    DS_simulator.destroy();
    DS_simulator = null;
  }
}

/**
 * Generates the DS_path and DS_step arrays from the global DS_directions
 * instance
 * 
 * NOTE: only the first route is used
 */
function DS_buildPathStepArrays() {
  // begin processing the directions' steps and path
  DS_steps = [];
  DS_path = [];
  
  var polyline = DS_directions.getPolyline();
  var route = DS_directions.getRoute(0);
  var numPolylineVertices = polyline.getVertexCount();
  var numSteps = route.getNumSteps();
  
  for (var i = 0; i < numSteps; i++) {
    var step = route.getStep(i);
    
    var firstPolylineIndex = step.getPolylineIndex();
    
    var lastPolylineIndex = -1;
    if (i == numSteps - 1)
      lastPolylineIndex = numPolylineVertices - 1;
    else {
      // subtract 2 because the last vertex of a step is duplicated
      // as the first vertex of the next step in google.maps.Directions results
      lastPolylineIndex = route.getStep(i + 1).getPolylineIndex() - 2;
    }
    
    DS_steps.push({
      loc: step.getLatLng(),
      desc: step.getDescriptionHtml(),
      distanceHtml: step.getDistance().html,
      pathIndex: DS_path.length
    });
    
    var stepDistance = step.getDistance().meters;
    for (var j = firstPolylineIndex; j <= lastPolylineIndex; j++) {
      var loc = polyline.getVertex(j);
      var distance = (j == numPolylineVertices - 1) ?
                     0 : DS_geHelpers.distance(loc, polyline.getVertex(j + 1));
      
      DS_path.push({
        loc: loc,
        step: i,
        distance: distance,
        
        // this segment's time duration is proportional to its length in
        // relation to the length of the step
        duration: step.getDuration().seconds * distance / stepDistance
      });
    }
  }
}

/**
 * Generates the HTML elements for the left directions list
 * 
 * NOTE: only the first route is used
 */
function DS_buildDirectionsList() {
  var start = DS_directions.getRoute(0).getStartGeocode();
  var end = DS_directions.getRoute(0).getEndGeocode();
  
  $('#route-details').append($(
      '<div id="dir-start">' + start.address + '</div>'));
  
  $('#route-details').append('<ol>');
  for (var i = 0; i < DS_steps.length; i++) {
    $('#route-details ol').append($(
        '<li class="dir-step" id="dir-step-' + i + '">' +
        DS_steps[i].desc +
        '<div class="note">' + DS_steps[i].distanceHtml + '</div>' + 
        '</li>'));
  }
  
  $('#route-details').append($(
      '<div id="dir-end">' + end.address + '</div>'));
  
  // handle events on the directions list
  $('#dir-start').click(function() {
    DS_flyToLatLng(new google.maps.LatLng(
                   start.Point.coordinates[1], start.Point.coordinates[0]));
  });
  
  $('#dir-end').click(function() {
    DS_flyToLatLng(new google.maps.LatLng(
                   end.Point.coordinates[1], end.Point.coordinates[0]));
  });
  
  $('#route-details li').click(function() {
    var id = $(this).attr('id');
    if (id == 'dir-start' || id == 'dir-end')
      return;
    
    var stepNum = parseInt(id.match(/dir-step-(\d+)/)[1]);
    DS_flyToStep(stepNum);
  });
}

/**
 * Fly the camera to the given step index in the route, and highlight it in
 * the directions list. Also show the placemark description balloon.
 * @param {number} stepNum The 0-based step index to fly to
 */
function DS_flyToStep(stepNum) {
  var step = DS_steps[stepNum];
  
  var la = DS_ge.createLookAt('');
  la.set(step.loc.lat(), step.loc.lng(),
      0, // altitude
      DS_ge.ALTITUDE_RELATIVE_TO_GROUND,
      DS_geHelpers.getHeading(step.loc, DS_path[step.pathIndex + 1].loc),
      60, // tilt
      50 // range (inverse of zoom)
      );
  DS_ge.getView().setAbstractView(la);

  // show the description balloon.
  var balloon = DS_ge.createFeatureBalloon('');
  balloon.setFeature(DS_placemarks['step-' + stepNum]);
  DS_ge.setBalloon(balloon); 

  DS_highlightStep(stepNum);
}

/**
 * Highlights the given step in the left directions list
 * @param {number} stepNum The 0-based step index to highlight in the
 *     directions list
 */
function DS_highlightStep(stepNum) {
  $('#route-details li').removeClass('sel');
  $('#route-details #dir-step-' + stepNum).addClass('sel');
}

/**
 * Move the camera to the given location, staring straight down, and unhighlight
 * all items in the left directions list
 * @param {google.maps.LatLng} loc The location to fly the camera to
 */
function DS_flyToLatLng(loc) {
  var la = DS_ge.createLookAt('');
  la.set(loc.lat(), loc.lng(),
      10, // altitude
      DS_ge.ALTITUDE_RELATIVE_TO_GROUND,
      90, // heading
      0, // tilt
      200 // range (inverse of zoom)
      );
  DS_ge.getView().setAbstractView(la);
  
  $('#route-details li').removeClass('sel');
}

/**
 * Formats a time given in seconds to a human readable format
 * @param {number} s Time in seconds
 * @return {string} A string formatted in hh:mm form representing the given
 *     number of seconds
 */
function DS_formatTime(s) {
  var m = Math.floor(s / 60);
  s %= 60;
  var h = Math.floor(m / 60);
  m %= 60;
  s = Math.round(s);
  return ((h < 10) ? ('0' + h) : h) + ':' + ((m < 10) ? ('0' + m) : m);
}

/**
 * Simulator controls
 * @param {string} command The control command to run
 * @param {Function?} opt_cb Optional callback to run when the command
 *     completes its task
 */
function DS_controlSimulator(command, opt_cb) {
  switch (command) {
    case 'reset':
      if (DS_simulator)
        DS_simulator.destroy();
      
      // create a DDSimulator object for the current DS_path array
      // on the DS_ge Earth instance
      DS_simulator = new DDSimulator(DS_ge, DS_path, {
        // as the simulator runs, reposition the map on the right and the
        // car marker on the map, and update the status box on the bottom
        on_tick: function() {
          DS_map.panTo(DS_simulator.currentLoc);
          DS_mapMarker.setLatLng(DS_simulator.currentLoc);
          if (DS_simulator) {
            $('#status').html(
                '<strong>Time:</strong> ' +
                  DS_formatTime(DS_simulator.totalTime) + '<br/>' +
                '<strong>Distance:</strong> ' +
                  (Math.round(DS_simulator.totalDistance / 1000)) +
                  ' km' + '<br/>' +
                '<strong>Speed Multiplier:</strong> ' + DS_simulator.options.speed	+'x ')  +
                  ' <br/>';
          }
        },
        
        // when the simulator moves to a new step (specified as an integer
        // index in DS_path items), highlight that step in the directions
        // list
        on_changeStep: function(stepNum) {
          DS_highlightStep(stepNum);
        },
				
		on_finish: function() {
			alert("Arrived at Niagara Falls after " + DS_formatTime(DS_simulator.totalTime));
			ShowNiagaraKml();
		} 
      });
      
      if (!DS_mapMarker) {
        // create vehicle location indicator on map
        var icon = new google.maps.Icon();
        icon.iconSize = new google.maps.Size(42, 42);
        icon.iconAnchor = new google.maps.Point(21, 21);
        icon.image = 'smart_marker.png';
        DS_mapMarker = new google.maps.Marker(
                       DS_simulator.currentLoc, {icon: icon});
        DS_map.addOverlay(DS_mapMarker);
      }
      
      DS_map.setZoom(8);
      DS_mapMarker.setLatLng(DS_simulator.currentLoc);
      
      DS_updateSpeedIndicator();
      DS_simulator.initUI(opt_cb);
      break;
    
    case 'start':
      if (!DS_simulator)
        DS_controlSimulator('reset', function() {
          DS_simulator.start();
          if (opt_cb) opt_cb();
        });
      else {
        DS_simulator.start();
        if (opt_cb) opt_cb();
      }
      break;
    
    case 'pause':
      if (DS_simulator)
        DS_simulator.stop();
      
      if (opt_cb) opt_cb();
      break;
    
    case 'resume':
      if (DS_simulator)
        DS_simulator.start();
      
      if (opt_cb) opt_cb();
      break;
    
    case 'slower':
      if (DS_simulator && DS_simulator.options.speed > 0.125) {
        DS_simulator.options.speed /= 2.0;
        DS_updateSpeedIndicator();
      }
      break;
    
    case 'faster':
      if (DS_simulator && DS_simulator.options.speed < 128000.0) {
        DS_simulator.options.speed *= 2.0;
        DS_updateSpeedIndicator();
      }
      break;
  }
}

/**
 * Update the speed indicator in the simulation controls box to reflect
 * the current simulation speed multiplier
 */
function DS_updateSpeedIndicator() {
  if (DS_simulator.options.speed < 1)
    $('#speed-indicator').text('1/' +
        Math.floor(1 / DS_simulator.options.speed) + 'x');
  else
    $('#speed-indicator').text(Math.floor(DS_simulator.options.speed) + 'x');
}

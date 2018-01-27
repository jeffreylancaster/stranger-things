/* HELPFUL FUNCTIONS */

function isolate(className){
	className = className.toLowerCase().replace(/([^A-Z0-9])/gi,"");
	$(".characters").addClass("hide");
	if(className == "king" || className == "khal" || className == "khaleesi" || className == "hand" || className == "dead"){
		$("."+className).parent().removeClass("hide");
	} else if(className == "alive"){
		$(".characters").not($(".dead").parent()).removeClass("hide");
	} else {
		$("."+className).removeClass("hide");
	}
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// to dedpulicate an array
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

// from: http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};


/* STARTUP */

// hide the UI box until everything is loaded
$("#ui, footer").toggle();


/* VARIABLES AND CONFIGURATION */

var config = {
	subLocation: true,
	xscale: 20, // higher numbers squish the visualization more
	yscale: 2 // higher numbers spread out the visualization more
}


// variable containers for imported data
var charactersData,
  locationsData,
  locationsAltData,
  episodesData,
  charactersIncludeData,
  charactersGenderData,
  keyValue,
  keyValuesFile,
  episodeLengths,
  locations,
  subLocations,
  group,
  colors;


/* IMPORT DATA */

if(config.subLocation){
	keyValuesFile = "keyValues.json";
} else {
	keyValuesFile = "keyValues-locations.json";
}

$.when(
  $.getJSON("../data/characters.json", function(data) {
    charactersData = data.characters;
    console.log("characters.json loaded");
  })
  .fail(function() {console.error("characters.json not loaded");}),
      
  // $.getJSON("../data/locations.json", function(data) {
  //   locationsData = data.regions;
  //   console.log("locations.json loaded");
  // })
  // .fail(function() {console.error("locations.json not loaded");}),

  // $.getJSON("../data/locations-alt.json", function(data) {
  //   locationsAltData = data.sceneLocSorted;
  //   console.log("locations-alt.json loaded");
  // })
  // .fail(function() {console.error("locations-alt.json not loaded");}),

  // $.getJSON("../data/episodes.json", function(data) {
  //   episodesData = data.episodes;
  //   console.log("episodes.json loaded");
  // })
  // .fail(function() {console.error("episodes.json not loaded");}),

  // $.getJSON("../data/characters-include.json", function(data) {
  //   charactersIncludeData = data.include;
  //   console.log("characters-include.json loaded");
  // })
  // .fail(function() {console.error("characters-include.json not loaded");}),

  $.getJSON("../data/characters-gender.json", function(data) {
    charactersGenderData = data.gender;
    console.log("characters-gender.json loaded");
  })
  .fail(function() {console.error("characters-gender.json not loaded");}),

  $.getJSON("../data/keyValues.json", function(data) {
    keyValues = data.keyValues;
	episodeLengths = data.episodeLengths;
    locations = data.sceneLocSorted;
    subLocations = data.sceneSubLocSorted;
    console.log("keyValues.json loaded");
  })
  .fail(function() {console.error("keyValues.json not loaded");}),

  $.getJSON("../data/characters-groups.json", function(data) {
    group = data.groups;
    console.log("characters-groups.json loaded");
  })
  .fail(function() {console.error("characters-groups.json not loaded");}),

  $.getJSON("../data/colors.json", function(data) {
    colors = data.colors;
    console.log("colors.json loaded");
  })
  .fail(function() {console.error("colors.json not loaded");}),


/* DO STUFF WITH THE DATA */

).then(function() {
    console.log("now that the files are loaded... do magic.");

	const width = episodeLengths[episodeLengths.length-1].episodes[episodeLengths[episodeLengths.length-1].episodes.length-1].shift/config.xscale;
	const height = config.yscale*(2*locations[locations.length-1].middle + locations[locations.length-1].max);

	const svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height);

	var titlePoints = []; // an array for points for characters with titles
	var titlePointsAdj = []; // array to help modify titlePoints
	var points = []; // an array for points for characters
	var titles = []; // an array to keep titles

    // build the array of points from keyValues
	keyValues.forEach(function(d,i){
		points.push([]);
		titlePoints.push([]);
		keyValues[i].values.forEach(function(e,j){
			// check if start and end are mismatched
			if(keyValues[i].values[j].s > keyValues[i].values[j].e){
				console.log(keyValues[i].key, j);
			}
			
			// additional variables: title (t), alive (a), born (b), greensight (g), flashback (f), warg (w)
			
			// ignore flashbacks, greensight, warging, not yet born, mindpalace
			if(keyValues[i].values[j].f || keyValues[i].values[j].g || keyValues[i].values[j].w || keyValues[i].values[j].m || keyValues[i].values[j].b == false){}
			
			// for everything else
			else {
				var objStart = {};
				var objEnd = {};
				objStart = {"x":keyValues[i].values[j].s, "y":keyValues[i].values[j].y, "c": keyValues[i].key};
				objEnd = {"x":keyValues[i].values[j].e, "y":keyValues[i].values[j].y, "c": keyValues[i].key};
				// if they have a title, otherwise add null
				if(keyValues[i].values[j].t){
					objStart.t = keyValues[i].values[j].t;
					objEnd.t = keyValues[i].values[j].t;
				} else {
					objStart.t = null;
					objEnd.t = null;
				}
				// if they die
				if(keyValues[i].values[j].a == false){
					objEnd.a == false;
				}
				points[i].push(objStart);
				points[i].push(objEnd);
				
				// add title points to titlePoints
				if(keyValues[i].values[j].t){
					titlePoints[i].push(objStart);
					titlePoints[i].push(objEnd);
					titles.push(keyValues[i].values[j].t);
				} else {
					titlePoints[i].push(null);
				}
			}
		});
	});
	
	// dedpulicate the titles array and add values to select
	titles = titles.filter(onlyUnique).sort();
	for(i=0; i<titles.length; i++){
		$("#title-select > select").append("<option>"+titles[i]+"</option>");
	}

	// remove objects that only have null values
	for(i=0; i<titlePoints.length; i++){
		for(j=0; j<titlePoints[i].length; j++){
			if(titlePoints[i][j] != null){
				titlePointsAdj.push(titlePoints[i]);
				break;
			}
		}
	}
	titlePoints = titlePointsAdj;

	// remove initial null values
	for(i=0; i<titlePoints.length; i++){
		var toSplice = 0;
		for(j=0; j<titlePoints[i].length; j++){
			if(titlePoints[i][j] == null){
				toSplice++;
			} else {
				break;
			}
		}
		titlePoints[i] = titlePoints[i].slice(toSplice,titlePoints[i].length);
	}
	
	// if two types of titles, then split into separate objects

	var lineFunction = d3.line()
		.x(function(d) { return d.x/config.xscale; })
		.y(function(d) { return 2*config.yscale*d.y; })
		.curve(d3.curveMonotoneX);

	var discontinuousLineFunction = d3.line()
		.defined(function(d) { return d; })
		.x(function(d) { return d.x/config.xscale; })
		.y(function(d) { return 2*config.yscale*d.y; })
		.curve(d3.curveMonotoneX);

	// add rectangles representing each region
	locations.forEach(function(d,i){
		var regionName = d.name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		svg.append("rect")
			.attr("class", "region "+regionName)
			.attr("height", 2*config.yscale*d.max)
			.attr("width", width)
			.attr("x", 0)
			.attr("y", config.yscale*(2*d.middle)-d.max*config.yscale);
		svg.append("text")
			.attr("class", "region")
            .text(d.name.replace("#",""))
            .style("font-size", function(){
            	var threshold = 50;
            	if(2*d.max*config.yscale > threshold){
            		return threshold;
            	} else {
            		return 2*d.max*config.yscale;
            	}
            })
            .attr("x", 10)
            .attr("y", 2*config.yscale*d.middle+2*config.yscale)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start");
        svg.append("text")
			.attr("class", "region")
            .text(d.name.replace("#",""))
            .style("font-size", function(){
            	var threshold = 50;
            	if(2*d.max*config.yscale > threshold){
            		return threshold;
            	} else {
            		return 2*d.max*config.yscale;
            	}
            })
            .attr("x", width-10)
            .attr("y", 2*config.yscale*d.middle+2)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "end");
	});

	// add rectangles representing each episode
	episodeLengths.forEach(function(d,i){
		// add rectangles for each episode
		episodeLengths[i].episodes.forEach(function(e,j){
			episodeTitle = e.episodeTitle.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			svg.append("g")
				.attr("class", episodeTitle+"-episode");
			svg.select("."+episodeTitle+"-episode")
				.append("rect")
				.attr("class", "episode season"+episodeLengths[i].seasonNum)
				.attr("height", height+10)
				.attr("width", e.length/config.xscale)
				.attr("x", e.shift/config.xscale)
				.attr("y", -5);
		});
		episodeLengths[i].episodes.forEach(function(e,j){
			episodeTitle = e.episodeTitle.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			// add episode title to top
			svg.select("."+episodeTitle+"-episode")
				.append("text")
				.attr("class", "episodeTitle")
	            .text("\"" + e.episodeTitle + "\" (S"+ d.seasonNum + ":E" + e.episodeNum + ")")
	            .attr("x", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 4){
	            		return e.shift/config.xscale;
	            	}
	            	else if(d.seasonNum == 1 && e.episodeNum > 4){
	            		return (e.shift + e.length)/config.xscale;
	            	}
	            	else {
	            		return (e.shift + e.length/2)/config.xscale;
	            	}
	            })
	            .attr("y", -5)
	            .attr("dominant-baseline", "ideographic")
	            .attr("text-anchor", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 4){
	            		return "start";
	            	}
	            	else if(d.seasonNum == 1 && e.episodeNum > 4){
	            		return "end";
	            	}
	            	else {
	            		return "middle";
	            	}
	            });
	        // add episode title to bottom
	        svg.select("."+episodeTitle+"-episode")
				.append("text")
				.attr("class", "episodeTitle")
	            .text("\"" + e.episodeTitle + "\" (S"+ d.seasonNum + ":E" + e.episodeNum + ")")
	            .attr("x", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 4){
	            		return e.shift/100;
	            	}
	            	else if(d.seasonNum == 1 && e.episodeNum > 4){
	            		return (e.shift + e.length)/config.xscale;
	            	}
	            	else {
	            		return (e.shift + e.length/2)/config.xscale;
	            	}
	            })
	            .attr("y", height + 5)
	            .attr("dominant-baseline", "text-before-edge")
	            .attr("text-anchor", function(){
	            	if(d.seasonNum == 1 && e.episodeNum < 4){
	            		return "start";
	            	}
	            	else if(d.seasonNum == 1 && e.episodeNum > 4){
	            		return "end";
	            	}
	            	else {
	            		return "middle";
	            	}
	            });
		})
	});

	// for each valid character, make a group
	keyValues.forEach(function(d,i){
		if(points[i].length > 0){
			var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			// make the group
			svg.append("g")
				.attr("class", className + " characters");
		}
	});

	// for each character who dies, add a circle at that spot
	keyValues.forEach(function(d,i){
		var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		d.values.forEach(function(e,j){
			if(e.a == false){
				svg.select("g."+className)
					.append("circle")
					.attr("cx", function(){return e.e/config.xscale;})
					.attr("cy", function(){return 2*config.yscale*e.y;})
					.attr("class", "dead");
			}
		});
	});

	// for each valid character with a title, add title line to the group
	titlePoints.forEach(function(d,i){
		var className = d[0].c.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		svg.select("g."+className).selectAll("paths")
			.data([d])
			.enter()
			.append("path")
			.attr("class", "titleLine "+d[0].t.toLowerCase())
			.attr("d", discontinuousLineFunction);
	});

	// for each valid character, add the linear path to the group
	keyValues.forEach(function(d,i){
		if(points[i].length > 0){
			var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			svg.select("g."+className).selectAll("paths")
				.data([points[i]])
				.enter()
				.append("path")
				.attr("class", "line")
				.attr("d", lineFunction);
		}
	});

	// append the rectangles & text representing each scene to the group
	keyValues.forEach(function(d,i){
		var className = d.key.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		keyValues[i].values.forEach(function(e,j){
			var width = (keyValues[i].values[j].e - keyValues[i].values[j].s)/config.xscale;
			var height = 4;
			svg.select("g."+className)
				.append("rect")
		        .attr("x", keyValues[i].values[j].s/config.xscale)
		        .attr("y", 2*config.yscale*keyValues[i].values[j].y-(height/2))
		        .attr("width", width)
		        .attr("height", 3)
		        .attr("class", "rect");
		});
		svg.select("g."+className)
	    	.append("text")
	    	.attr("class", "character")
            .text(keyValues[i].key)
            .style("font", "400 20px Helvetica Neue")
            .attr("dominant-baseline", "hanging")
            .attr("text-anchor", "end");
	});

	if(config.subLocation){
		// add a single text box for all subLocation
		svg.append("text")
			.attr("x", 0)
            .attr("y", 0)
			.attr("class", "subLocation")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start");
	}

	// bring the group (includes the path and rectangles) to the front when rolled over and show the text label
	svg.selectAll("g.characters")
		.on('mouseover', function(d) {
            d3.select(this).moveToFront();
            d3.selectAll(".character")
            	.attr("x", function(){
            		return d3.event.pageX - 40;
            	})
            	.attr("y", d3.mouse(this)[1]+10)
            	.attr("text-anchor", function(){
            		if(d3.event.pageX < 200){
            			return "start";
            		} else {
            			return "end";
            		}
            	});
            // hide/show the character thumbnail
            $(".characterThumb").hide();
            var thumbClass = $(this).attr("class").split(" ")[0]+"-image";
            $("."+thumbClass).show();
            if(d3.event.pageX < 200){
    			$("."+thumbClass).css({top: d3.event.pageY-22.5, left: d3.event.pageX-80-10});
    		} else {
    			$("."+thumbClass).css({top: d3.event.pageY-22.5, left: d3.event.pageX+10});
    		}
    		$(".subLocation").show();
            for(i=0; i<subLocations.length; i++){
            	if(d3.mouse(this)[1]/(2*config.yscale) > subLocations[i].middle - subLocations[i].max/(2*config.yscale) && d3.mouse(this)[1]/(2*config.yscale) < subLocations[i].middle + subLocations[i].max/(2*config.yscale)){
            		d3.selectAll(".subLocation")
		            	.attr("x", function(){
		            		return window.pageXOffset + 20;
		            	})
		            	.attr("y", function(){
		            		return 2*config.yscale*subLocations[i].middle;
		            	})
		            	.text(function(){
		            		return subLocations[i].name;
		            	});
            	}
            }
        })
        .on('mouseout', function(d) {
        	$(".characterThumb").hide();
        	$(".subLocation").hide();
        });


    // add group-specific styling to lines

    var charactersArray = [];
	for(i=0; i<group.length; i++){
		for(j=0; j<group[i].characters.length; j++){
			var className = group[i].characters[j].toLowerCase().replace(/([^A-Z0-9])/gi,"");
			var groupName = group[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
			$("."+className).addClass(groupName);
			if(groupName !== "include"){
				$("."+className).addClass("include");
			}
			// only include characters from characters-groups in select
			charactersArray.push(group[i].characters[j]);
			
			// charactersArrayForIMDBImages.push({"name":group[i].characters[j]}); // remove
		}
		if(group[i].name == "Include"){
			$("#group-select > select").append("<option disabled></option><option value='include'>All Main Characters</option><option value='characters'>All Characters</option>");
		} else {
			$("#group-select > select").append("<option>"+group[i].name+"</option>");
		}
	}
	
	// sort charactersArray and add to character-select
	charactersArray = charactersArray.sort();
	for(i=0; i<charactersArray.length; i++){
		$("#character-select > select").append("<option>"+charactersArray[i]+"</option>");
	}
	$("#character-select > select").append("<option disabled></option><option value='characters'>All Characters</option>");

	// build the key - include: groups, titles, dead, in scene

	const keyScale = 410;

	const key = d3.select("#key").append("svg")
		.attr("width", keyScale)
		.attr("height", (9/16)*keyScale);

	const selectKey = d3.select("#key").select("svg");

	// to draw the lines
	var lineFunction = d3.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.curve(d3.curveLinear);

	// add key title
	selectKey.append("text")
		.attr("class", "region")
        .text("Key")
        .style("font-size", 30)
        .attr("x", 0)
        .attr("y", -5)
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "start");
	
	// add a group for each group
	for(i=0; i<group.length; i++){
		var groupName = group[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		selectKey.append("g")
			.attr("class", groupName);

		if(groupName == "main"){
			selectKey.select("g."+groupName)
				.append("circle")
				.attr("cx", 150)
				.attr("cy", 16*i+35)
				.attr("class", "dead");
		}

		// add group line
		selectKey.select("g."+groupName).selectAll("paths")
			.data(function(){
				// different lengths for dead lines
				if(groupName == "main"){
					return [[{"x":0,"y":16*i+35},{"x":150,"y":16*i+35}]]
				} else {
					return [[{"x":0,"y":16*i+35},{"x":200,"y":16*i+35}]]
				}
			})
			.enter()
			.append("path")
			.attr("class", "line")
			.attr("d", lineFunction);

		// add line label
		selectKey.select("g."+groupName).append("text")
            .text(group[i].name)
            .attr("class", "keyLabel")
            .attr("x", 215)
            .attr("y", 16*i+35)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "start");
	}	

	// add .include to all lines
	for(i=0; i<group.length; i++){
		var groupName = group[i].name.toLowerCase().replace(/([^A-Z0-9])/gi,"");
		if(groupName !== "include"){
			$("."+groupName).addClass("include");
		}
	}


	// add gender as class to lines, add UI select behavior
	for(i in charactersGenderData){
		for(j=0; j<charactersGenderData[i].characters.length; j++){
			var className = charactersGenderData[i].characters[j].toLowerCase().replace(/([^A-Z0-9])/gi,"");
			$("."+className).addClass(charactersGenderData[i].gender);
		}
		// add gender select
		$("#gender-select").append("<input type='radio' name='gender' value='"+charactersGenderData[i].gender+"'>"+toTitleCase(charactersGenderData[i].gender));
	}
	$("#gender-select").append("<input type='radio' name='gender' value='characters'>All Characters");

	// on change in gender select, show only that gender
	$("#gender-select input").change(function(){
		// reset other selects
		$("#life-select input").prop("checked", false);
		$('#character-select option, #group-select option, #title-select option').prop('selected', function() {
	        return this.defaultSelected;
	    });
		// show only that gender
		isolate($("#gender-select input[type='radio']:checked").val());
	});

	// on change in group select, show only that group
	$("#group-select select").change(function(){
		// reset other selects
		$("#gender-select input, #life-select input").prop("checked", false);
		$('#character-select option, #title-select option').prop('selected', function() {
	        return this.defaultSelected;
	    });
		// show only that group
		isolate($("#group-select select option:selected").val());
	});

	// on change in character select, show only that character
	$("#character-select select").change(function(){
		// reset other selects
		$("#gender-select input, #life-select input").prop("checked", false);
		$('#group-select option, #title-select option').prop('selected', function() {
	        return this.defaultSelected;
	    });
		// show only that character
		isolate($("#character-select select option:selected").val());
	});

	// on change in title select, show only that title
	$("#title-select select").change(function(){
		// reset other selects
		$("#gender-select input, #life-select input").prop("checked", false);
		$('#group-select option, #character-select option').prop('selected', function() {
	        return this.defaultSelected;
	    });
		// show only that title
		isolate($("#title-select select option:selected").val());
	});

	// on change in alive select, show only that life
	$("#life-select input").change(function(){
		// reset other selects
		$("#gender-select input").prop("checked", false);
		$('#character-select option, #group-select option, #title-select option').prop('selected', function() {
	        return this.defaultSelected;
	    });
		// show only that life
		isolate($("#life-select input[type='radio']:checked").val());
	});


	// add color data to styles
	for(i in colors){
		if(colors[i].class){
			for(j=0; j<colors[i].class.length; j++){
				$("."+colors[i].class[j]+" .line, ."+colors[i].class[j]+" .rect").css({
					"stroke": colors[i].hexadecimal
				});
				$("."+colors[i].class[j]+" .rect").css({
					"fill": colors[i].hexadecimal
				});
			}
		}
		// add additional css via jquery - doesn't work yet
		/*if(data.colors[i].css){
			for(j=0; j<data.colors[i].class.length; j++){
				for(k in data.colors[i].css){
					$("."+data.colors[i].class[j]).css({k: data.colors[i].css[k]});
					console.log(k, data.colors[i].css[k]);
				}
			}
		}*/
	}

	// append the character thumbnail to the body
	for(i=0; i<charactersData.length; i++){
		if(charactersData[i].characterImageThumb){
			$("body").append("<div class='characterThumb "+charactersData[i].characterName.toLowerCase().replace(/([^A-Z0-9])/gi,"")+"-image' style='background-image: url("+charactersData[i].characterImageThumb+");'></div>")
		}
	}
	// for(i=0; i<charactersArrayForIMDBImages.length; i++){
	// 	for(j=0; j<data.characters.length; j++){
	// 		if(charactersArrayForIMDBImages[i].name == data.characters[j].characterName){
	// 			charactersArrayForIMDBImages[i].characterLink = "http://imdb.com"+data.characters[j].characterLink;
	// 		}
	// 	}
	// 	$("body").append("<a href='"+charactersArrayForIMDBImages[i].characterLink+"' target='_blank'>"+charactersArrayForIMDBImages[i].name+"</a><br>");
	// }

	$("#loading").hide(); // hide the loading box
	$("#ui, footer").toggle(); // show the UI box

});
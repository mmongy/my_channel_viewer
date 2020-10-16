
function makeChannelImage(currentImageDataJSON, index){
  //baseImageRenderingURL, imageID, channelIndex, channelActiveOrNot, channelColor, channelMinimalValue, channelMaximalValue, channelLabel

  /*
  A rendering URL looks like that:
    http://idr.openmicroscopy.org/webgateway/render_image/9844369/0/0/?c=1%7C7:4095%2400FFFF,2%7C11:4095%2400FF00,3%7C12:2156%240000FF ("%7C" is "|", "%24" is "$")
    After "render_image": the tunings are:
    - "9844369": Image id
    - "0": Time
    - "0": Z-depth
    - "?c=": URL Channels marker
    - "1%7C7:4095%2400FFFF": Informations for a channel. In order: Channel index | Min_pixel_value : Max_pixel_value $ Color
    - The Channel Index is preceded with "-" if deactivated.

  See:
    https://docs.openmicroscopy.org/omero/5.0.0/developers/Web/WebGateway.html
    https://docs.openmicroscopy.org/omero/5.4.9/developers/Web/WebGateway.html
  for more options.

  */

  var imageID = currentImageDataJSON.id;
  var pixelMinRange = currentImageDataJSON.pixel_range[0];
  var pixelMaxRange = currentImageDataJSON.pixel_range[1];
  let channelIndex = index+1;
  let channelColor = currentImageDataJSON.channels[index].color;
  let channelLabel = currentImageDataJSON.channels[index].label;
  let channelMinimalValue = currentImageDataJSON.channels[index].window.min;
  let channelMaximalValue = currentImageDataJSON.channels[index].window.max;

  if ($("#checkbox_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label).is(':checked')){
    currentImageDataJSON.channels[index].active = true;
  }
  else{
    currentImageDataJSON.channels[index].active = false;
  }

  //Check if channel active or not
  var channelActiveOrNotCharacter = "";
  if (currentImageDataJSON.channels[index].active == false){
    channelActiveOrNotCharacter = "-";
  }

  //Assemble the URL
  var channelTuningsURLchunk = ""+channelActiveOrNotCharacter+channelIndex+"|"+channelMinimalValue+":"+channelMaximalValue+"$"+channelColor+""
  return channelTuningsURLchunk
}

function updateChannelColor(currentImageDataJSON, index){
  var colorChooserIdentifier = "color_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label;
  var lutChooserIdentifier = "lut_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label;
  // color value is '#ff0000', we want to remove the '#'
  if(document.getElementById(lutChooserIdentifier).value != ""){
    var newColor = document.getElementById(lutChooserIdentifier).value.replace("#", '');
  }
  else{
    var newColor = document.getElementById(colorChooserIdentifier).value.replace("#", '');
  }
  currentImageDataJSON.channels[index].color = newColor
}

function updateColorChanger(currentImageDataJSON, index){
  var colorChangerIdentifier = "#color_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label
  $(colorChangerIdentifier).on("change", "input", function () { //Not working?
    //updateChannelAndResultImage(currentImageDataJSON, index)
    updateAllChannelsAndResultImage(currentImageDataJSON)
  });
}

function updateLUTChanger(currentImageDataJSON, index){
  var lutChangerIdentifier = "#lut_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label
  $(lutChangerIdentifier).on("change", "select", function () { //Not working?
    //updateChannelAndResultImage(currentImageDataJSON, index)
    updateAllChannelsAndResultImage(currentImageDataJSON)
  });
}

function updateZDepthTuningSlider(currentImageDataJSON){
  var sliderIdentifier = "#zdepth-slider_"+currentImageDataJSON.id;
  var valueVisualizerIdentifier = "#ZdepthValue_read_input_"+currentImageDataJSON.id;
  //jQuery(document).ready(function ($) {
    $( sliderIdentifier ).slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: (currentImageDataJSON.size.z)-1,
      value: currentImageDataJSON.rdefs.defaultZ,
      slide: function( event, ui ) {
        $( valueVisualizerIdentifier ).val( ui.value );
      },
      change: function( event, ui ) {
        //console.log(event);
        //console.log(ui.values) //Faire le setPixelValue() ici
        $( valueVisualizerIdentifier ).val( ui.value );
        currentImageDataJSON.rdefs.defaultZ = ui.value;
        updateAllChannelsAndResultImage(currentImageDataJSON)
      }
    });
    $( valueVisualizerIdentifier ).val( $( sliderIdentifier ).slider( "value" ) );
  //});
}

function updateTTimeTuningSlider(currentImageDataJSON){
  var sliderIdentifier = "#ttime-slider_"+currentImageDataJSON.id;
  var valueVisualizerIdentifier = "#TtimeValue_read_input_"+currentImageDataJSON.id;
  //jQuery(document).ready(function ($) {
    $( sliderIdentifier ).slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: (currentImageDataJSON.size.t)-1,
      value: currentImageDataJSON.rdefs.defaultT,
      slide: function( event, ui ) {
        $( valueVisualizerIdentifier ).val( ui.value );
      },
      change: function( event, ui ) {
        //console.log(event);
        //console.log(ui.values) //Faire le setPixelValue() ici
        $( valueVisualizerIdentifier ).val( ui.value );
        currentImageDataJSON.rdefs.defaultT = ui.value;
        updateAllChannelsAndResultImage(currentImageDataJSON)
      }
    });
    $( valueVisualizerIdentifier ).val( $( sliderIdentifier ).slider( "value" ) );
  //});
}

function updateChannelTuningSlider(currentImageDataJSON, index){
  var sliderIdentifier = "#slider-range_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label.toString();
  var valueVisualizerIdentifier = "#minmaxPixelValues_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label.toString();
  //currentImageDataJSON.pixel_range[1] = document.getElementById("RealDynamicRange").value;
  //jQuery(document).ready(function ($) {
    $( sliderIdentifier ).slider({
        orientation: "horizontal",
        range: true,
        min: currentImageDataJSON.pixel_range[0],
        max: currentImageDataJSON.pixel_range[1],
        values: [currentImageDataJSON.channels[index].window.min, currentImageDataJSON.channels[index].window.max],
        slide: function( event, ui ) {
          //console.log(event);
          //console.log(ui.values) //Faire le setPixelValue() ici
          $( valueVisualizerIdentifier ).val(ui.values[ 0 ] + " - " + ui.values[ 1 ] )
        },
        change: function( event, ui ) {
          //console.log(event);
          //console.log(ui.values) //Faire le setPixelValue() ici
          $( valueVisualizerIdentifier ).val(ui.values[ 0 ] + " - " + ui.values[ 1 ] )
          currentImageDataJSON.channels[index].window.min = ui.values[ 0 ];
          currentImageDataJSON.channels[index].window.max = ui.values[ 1 ];
          currentImageDataJSON.pixel_range[1] = document.getElementById("RealDynamicRange_"+currentImageDataJSON.id).value
          $( sliderIdentifier ).slider( "option", "max", currentImageDataJSON.pixel_range[1] );
          updateAllChannelsAndResultImage(currentImageDataJSON)
        }
    });
    //var max = $( sliderIdentifier ).slider( "option", "max" );

    $( valueVisualizerIdentifier ).val($( sliderIdentifier ).slider("values", 0)+" - "+$( sliderIdentifier ).slider("values", 1))
  //});
}


function updateAllChangers(currentImageDataJSON, index){
  //jQuery(document).ready(function ($) {
    console.log('updateAllChangers', currentImageDataJSON, index)
    updateColorChanger(currentImageDataJSON, index);
    updateLUTChanger(currentImageDataJSON, index);
    updateChannelTuningSlider(currentImageDataJSON, index)
  //});
}

function generateTuningThumbnailHTMLlist(currentImageDataJSON){
  var tuningThumbnailsHTMLlist = `
    <ul class="ThumbnailsList" id="ThumbnailsList_${currentImageDataJSON.id}">
      <li><a href="#tuner_result_${currentImageDataJSON.id}">Result image</a></li>

  `
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    var channelThumbnailListItem = `
      <li><a href="#tuner_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}">${currentImageDataJSON.channels[index].label}</a></li>
    `
    tuningThumbnailsHTMLlist = tuningThumbnailsHTMLlist+channelThumbnailListItem;
  }
  var quickFigureThumbnailListItem = `
    <li><a href="#tuner_quick_figure_${currentImageDataJSON.id}">Quick Figure</a></li>
  `
  tuningThumbnailsHTMLlist = tuningThumbnailsHTMLlist+quickFigureThumbnailListItem+"</ul>"
  return tuningThumbnailsHTMLlist;
}

function generateChannelTuningHTML(currentImageDataJSON, currentLUTsJSON, index){

  //Adding luts

  var lutItems = currentLUTsJSON.luts;
  //console.log(lutData)
  let lutsHtml = lutItems.map(lut => {
    let lut_name = lut.name.replace('.lut', '');
    return `<option value="${lut.name}">${lut_name}</option>`;
  }).join("");
  //console.log("lutsHtml", lutsHtml)
  var channelRenderingURL = updateChannelImageURL(currentImageDataJSON, index);

  var channelRenderingHTMLstring = `
    <div style="position:relative;" class="ChannelTuner" id="tuner_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}">
      <input type="text" name="channel_${currentImageDataJSON.id}_${index}" id="channel_${currentImageDataJSON.id}_${index}" value="${currentImageDataJSON.channels[index].label}" readonly>
      <img class="ChannelImage" name="channel_image_${currentImageDataJSON.id}_${index}" id="${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" src="${channelRenderingURL}"/>
      <div class="chartContainer" id="chartContainer_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" style="height: 37px; max-width: 57px; margin: 0px auto;"></div>
      <p>
        <label for="minmaxPixelValues_${currentImageDataJSON.id}_${index}">Channel ${currentImageDataJSON.channels[index].label}:</label>
        <input type="text" name="minmaxPixelValues_${currentImageDataJSON.id}_${index}" id="minmaxPixelValues_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" readonly style="border:0; color:#${currentImageDataJSON.channels[index].color}; font-weight:bold;">
      </p>
      <span id="slider-range_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" class="ui-slider-range" style="left: 0%; width: 40%;">
      </span>
      <p>
        <label for="checkbox_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}">Enable/Disable Channel:
        <input name="active-or-not_${currentImageDataJSON.id}_${index}" type="checkbox" id="checkbox_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" checked>
      </p>
      <input name="color_${currentImageDataJSON.id}_${index}" class="ColorChanger" type="color" id="color_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}" value="#${currentImageDataJSON.channels[index].color}">
      <select class="lut" name="lut_${currentImageDataJSON.id}_${index}" id="lut_${currentImageDataJSON.id}_${currentImageDataJSON.channels[index].label}"><option value=''>No custom LUT</option>${lutsHtml}</select>
    </div>
    `
    return channelRenderingHTMLstring;
}

function generateAllChannelsTuningHTML(currentImageDataJSON, currentLUTsJSON){
  var allChannelsHTMLstring = "";
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    var channelHTMLstring = generateChannelTuningHTML(currentImageDataJSON, currentLUTsJSON, index);
    allChannelsHTMLstring = allChannelsHTMLstring + channelHTMLstring
  }
  return allChannelsHTMLstring;
}

function generateResultImageHTML(currentImageDataJSON){

  var resultImageURL = updateResultImageURL(currentImageDataJSON);

  var resultRenderingHTMLstring = `
    <div style="position:relative;" class="ResultTuner" id="tuner_result_${currentImageDataJSON.id}">
      <input type="text" name="result" id="result_read_input_${currentImageDataJSON.id}" value="${currentImageDataJSON.meta.imageName}" readonly>
      <img class="ResultImage" id="result_image_${currentImageDataJSON.id}" src="${resultImageURL}"/>
      <p>
        <label for="ZdepthValue_label_${currentImageDataJSON.id}">Profondeur Z: </label>
        <input type="text" name="Zdepth" id="ZdepthValue_read_input_${currentImageDataJSON.id}" readonly style="border:0; color:#000000; font-weight:bold;">
        <select class="z-project" name="z-project_${currentImageDataJSON.id}" id="z-project_${currentImageDataJSON.id}">
          <option value="normal">No Z-projection</option>
          <option value="intmean">Mean Z-projection</option>
          <option value="intmax">Max Z-projection</option>
        </select>
      </p>
      <span id="zdepth-slider_${currentImageDataJSON.id}" class="ui-slider-horizontal ui-corner-all ui-widget-header" style="left: 0%; width: 40%;">
      </span>
      <p>
        <label for="TtimeValue_label_${currentImageDataJSON.id}">Temps T: </label>
        <input type="text" name="Ttime" id="TtimeValue_read_input_${currentImageDataJSON.id}" readonly style="border:0; color:#000000; font-weight:bold;">
      </p>
      <span id="ttime-slider_${currentImageDataJSON.id}" class="ui-slider-horizontal ui-corner-all ui-widget-header" style="left: 0%; width: 40%;">
      </span>
      <p>
        <label for"RealDynamicRange_${currentImageDataJSON.id}"> Select the real maximum dynamic range of your images: </label>
        <select class="RealDynamicRange" name="RealDynamicRange_${currentImageDataJSON.id}" id="RealDynamicRange_${currentImageDataJSON.id}">
          <option value="255"> 8-bits (256 values) </option>
          <option value="4095"> 12-bits (4096 values) </option>
          <option value="65535"> 16-bits (65536 values) </option>
          <option value="16777215"> 24-bits (16777216 values) </option>
          <option value="4294967295"> 32-bits (4294967296 values) </option>
        </select>
      </p>
      <p>
        <label for="transfer_tunings_button_${currentImageDataJSON.id}"> Apply these tunings to all selected images </label>
        <button class="transfer_tunings_button" id="transfer_tunings_button_${currentImageDataJSON.id}" type="button">Apply</button>
      </p>
    </div>
  `
  return resultRenderingHTMLstring;
}

function generateQuickFigure(currentImageDataJSON){

  var resultImageURL = updateQuickFigureURL(currentImageDataJSON);

  var resultRenderingHTMLstring = `
    <div style="position:relative;" class="QuickFigureTuner" id="tuner_quick_figure_${currentImageDataJSON.id}">
      <img class="MontageImage" id="quick_figure_image_${currentImageDataJSON.id}" src="${resultImageURL}"/>
    </div>
  `
  return resultRenderingHTMLstring;
}



function updateQuickFigureURL(currentImageDataJSON){
  var baseImageRenderingURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'render_split_channel/' + currentImageDataJSON.id + '/';
  let channelZDepth = currentImageDataJSON.rdefs.defaultZ;
  let channelTtime = currentImageDataJSON.rdefs.defaultT;

  var quickFigureURL = baseImageRenderingURL+channelZDepth+"/"+channelTtime+"/?c=";
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    var channelTuningsURLchunk = makeChannelImage(currentImageDataJSON, index)
    quickFigureURL+=channelTuningsURLchunk+",";
  }
  quickFigureURL = quickFigureURL.substring(0, quickFigureURL.length-1);
  //console.log("UPDATE_RESULT_IMAGE");
  //console.log("QUICK_FIGURE_URL", quickFigureURL)
  return quickFigureURL;
}

function updateResultImageURL(currentImageDataJSON){
  //Assemble the result image URL
  var baseImageRenderingURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'render_image/' + currentImageDataJSON.id + '/';
  let channelZDepth = currentImageDataJSON.rdefs.defaultZ;
  let channelTtime = currentImageDataJSON.rdefs.defaultT;

  var resultImageURL = baseImageRenderingURL+channelZDepth+"/"+channelTtime+"/?c=";
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    var channelTuningsURLchunk = makeChannelImage(currentImageDataJSON, index)
    resultImageURL+=channelTuningsURLchunk+",";
  }
  resultImageURL = resultImageURL.substring(0, resultImageURL.length-1);
  //console.log("UPDATE_RESULT_IMAGE");
  //console.log("RESULT_IMAGE_URL", resultImageURL)
  return resultImageURL;

}

function updateChannelImageURL(currentImageDataJSON, index){
  var baseImageRenderingURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'render_image/' + currentImageDataJSON.id + '/';
  let channelZDepth = currentImageDataJSON.rdefs.defaultZ;
  let channelTtime = currentImageDataJSON.rdefs.defaultT;

  var channelTuningsURLchunk = makeChannelImage(currentImageDataJSON, index)
  var channelRenderingURL = baseImageRenderingURL+channelZDepth+"/"+channelTtime+"/?c="+channelTuningsURLchunk;
  return channelRenderingURL;
}

function updateChannelImage(currentImageDataJSON, index){
  drawHistogram(currentImageDataJSON, index)
  updateChannelColor(currentImageDataJSON, index)
  var channelRenderingURL = updateChannelImageURL(currentImageDataJSON, index)
  var imageIdentifier = "#"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label;
  var minmaxIdentifier = "#minmaxPixelValues_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label;
  var lutChooserIdentifier = "lut_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label
  $(imageIdentifier).attr('src', channelRenderingURL);
  if(document.getElementById(lutChooserIdentifier).value == ""){
    $(minmaxIdentifier).attr('style', "border:0; color: #"+currentImageDataJSON.channels[index].color+"; font-weight:bold;")
  }
  if(document.getElementById(lutChooserIdentifier).value != ""){
    $(minmaxIdentifier).attr('style', "border:0; color: #000000; font-weight:bold;")
  }


}

function updateAllChannelsAndResultImage(currentImageDataJSON){
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    updateChannelImage(currentImageDataJSON, index)
  }
  var resultImageURL = updateResultImageURL(currentImageDataJSON)
  var quickFigureURL = updateQuickFigureURL(currentImageDataJSON)
  //Write the image in HTML
  var resultImageIdentifier = "#result_image_"+currentImageDataJSON.id
  var quickFigureImageIdentifier = "#quick_figure_image_"+currentImageDataJSON.id
  $(resultImageIdentifier).attr('src', resultImageURL);
  $(quickFigureImageIdentifier).attr('src', quickFigureURL);
}

function getChannelHistogramData(currentImageDataJSON, index){
  let channelIndex = index+1;
  //https://docs.openmicroscopy.org/omero/5.6.1/developers/Web/WebGateway.html
  var baseHistogramURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'histogram_json/' + currentImageDataJSON.id + '/channel/' + channelIndex + '/?theT=' + currentImageDataJSON.rdefs.defaultT + '&theZ=' + currentImageDataJSON.rdefs.defaultZ + '&bins=' + currentImageDataJSON.pixel_range[1];
}

function drawHistogram(currentImageDataJSON, index){
  //Get Data
  let channelIndex = index+1;
  //https://docs.openmicroscopy.org/omero/5.6.1/developers/Web/WebGateway.html
  var baseHistogramURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'histogram_json/' + currentImageDataJSON.id + '/channel/' + channelIndex + '/?theT=' + currentImageDataJSON.rdefs.defaultT + '&theZ=' + currentImageDataJSON.rdefs.defaultZ + '&bins=' + currentImageDataJSON.pixel_range[1];

  //https://canvasjs.com/javascript-charts/json-data-api-ajax-chart/
  $.getJSON(baseHistogramURL, function (currentHistogramDataJSON) {
    var dataPoints = [];
	  for (var i = 0; i < currentHistogramDataJSON.data.length; i++) {
		    dataPoints.push({
	         //x: new Date(data[i].date),
			     //y: data[i].units
           x: i,
           y: currentHistogramDataJSON.data[i]
		    });
	  }
    //console.log(dataPoints);
    var chartContainerIdentifier = "chartContainer_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label
    var chart = new CanvasJS.Chart(chartContainerIdentifier, {
  	   animationEnabled: true,
  	   theme: "light2",
  	   title: {
  		     text: "Channel Histogram",
           fontSize: 14
  	   },
  	   axisY: {
  		     title: "Number of pixels",
  		     titleFontSize: 12,
  		     includeZero: true
  	   },
  	   data: [{
  		     type: "column",
  		     yValueFormatString: "#,### Units",
  		     dataPoints: dataPoints
  	   }]
    });
	  chart.render();
  });
}


//Synchronous, useful for tests

function getJSONcontent(wantedURL){ //https://stackoverflow.com/questions/4200641/how-to-return-a-value-from-a-function-that-calls-getjson; synchronous only
   var value= $.ajax({
      url: wantedURL,
      async: false
   }).responseText;
   return JSON.parse(value);
}

function loadImage(imageId) {
  var imageDataURL = window.PARAMS.WEBGATEWAY_BASE_URL + 'imgData/' + imageId + '/';
  var currentImageDataJSON = getJSONcontent(imageDataURL)
  //console.log(currentImageDataJSON);
  return currentImageDataJSON;
} //Fin de loadImage

function loadLUTs(){
  let lutsUrl = window.PARAMS.WEBGATEWAY_BASE_URL + 'luts/';
  var currentLUTsJSON = getJSONcontent(lutsUrl)
  //console.log(currentLUTsJSON);
  return currentLUTsJSON;
}

function getSelectedImagesIDs(currentEvent){
  var imageIDvalues = [];
  for(var i=1; i<currentEvent.target.children.length; i++){
    imageIDvalues.push(currentEvent.target.children[i].value);
  }
  return imageIDvalues;
}



function modifySelectedImagesJSONs(listOfJSONs, currentImageDataJSON){
  for(var i=0; i<listOfJSONs.length; i++){
    listOfJSONs[i].pixel_range[0] = currentImageDataJSON.pixel_range[0];
    listOfJSONs[i].pixel_range[1] = currentImageDataJSON.pixel_range[1];
    listOfJSONs[i].channels = currentImageDataJSON.channels
    updateAllChannelsAndResultImage(listOfJSONs[i])
  }
  imagesDivItems = document.getElementsByClassName("ImageDivItem")
  console.log("imagesDivItems", imagesDivItems);

  //Modifier les LUTs et la Dynamic range dans cette fonction
  var chosenDynamicRange = document.getElementById("RealDynamicRange_"+currentImageDataJSON.id).value;
  var selectedLutItems = []
  for(var index=0; index<currentImageDataJSON.channels.length; index++){
    var chosenLutItem = document.getElementById("lut_"+currentImageDataJSON.id+"_"+currentImageDataJSON.channels[index].label).value
    selectedLutItems.push(chosenLutItem);
  }

  for(var indexDivImage=0; indexDivImage<imagesDivItems.length; indexDivImage++){
    document.getElementById("RealDynamicRange_"+listOfJSONs[indexDivImage].id).value = chosenDynamicRange;
    for(var indexSelectedLutItem=0; indexSelectedLutItem<selectedLutItems.length; indexSelectedLutItem++){
      document.getElementById("lut_"+listOfJSONs[indexDivImage].id+"_"+listOfJSONs[indexDivImage].channels[indexSelectedLutItem].label).value = selectedLutItems[indexSelectedLutItem];
    }
  }
  //console.log("Modified")
  //console.log(listOfJSONs)
}

function getAllSelectedImagesJSONs(imageIDvalues){
  var listOfJSONs = [];
  for(var i=0; i<imageIDvalues.length; i++){
    imageID = imageIDvalues[i];
    imageJSON = loadImage(imageID);
    listOfJSONs.push(imageJSON);
  }
  return listOfJSONs;
}

function generateImageDivsString(all_images, listOfJSONs, currentLUTsJSON){
  var imageDivsString = "";
  for(imageDivItemIndex=0; imageDivItemIndex<all_images.children.length; imageDivItemIndex++){
    var imageHtmlItem = all_images.children[imageDivItemIndex];
    var imageJSONitem = loadImage(imageHtmlItem.id)
    listOfJSONs.push(imageJSONitem);
    var beginningImageDivItem =`<div style="position:relative; display:none;" class="ImageDivItem" id="image_div_${imageHtmlItem.id}">`
    var tuningThumbnailsHTMLlist = generateTuningThumbnailHTMLlist(imageJSONitem)
    var resultRenderingHTMLstring = generateResultImageHTML(imageJSONitem);
    var allChannelsHTMLstring = generateAllChannelsTuningHTML(imageJSONitem, currentLUTsJSON);
    var quickFigureHTMLstring = generateQuickFigure(imageJSONitem);
    var endingImageDivItem = '</div>'
    var imageDivItemString = beginningImageDivItem+tuningThumbnailsHTMLlist+resultRenderingHTMLstring+allChannelsHTMLstring+quickFigureHTMLstring+endingImageDivItem;
    imageDivsString = imageDivsString + imageDivItemString;
  }
  return imageDivsString;
}

//------Start------

//https://stackoverflow.com/questions/56552131/include-jquery-from-js-file-if-it-is-not-present?noredirect=1&lq=1
// This will check if jQuery has loaded. If not, it will add to <head>
window.onload = function() {
  if (!window.jQuery) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'http://code.jquery.com/jquery-latest.min.js';
    head.appendChild(script);
  }
}

// Construct the API projects URL
var projectsUrl = PARAMS.API_BASE_URL + 'm/projects/';

// Filter projects by Owner to only show 'your' projects
projectsUrl += '?owner=' + PARAMS.EXP_ID;

// When the page loads, listen for changes to the selected_images_dropdown...
$(function () {
  // The currentImageDataJSON will be available anywhere inside this function...
  let currentImageDataJSON;
  let fullHTMLstring;
  let imageIDvalues;
  let listOfJSONs = [];
  let lutsUrl = window.PARAMS.WEBGATEWAY_BASE_URL + 'luts/';
  let all_images = document.getElementById("all_selected_images")
  console.log("ALL_IMAGES", all_images);
  //var currentLUTsJSON = loadLUTs();
  $.getJSON(lutsUrl, function (currentLUTsJSON) {
    imageDivsString = generateImageDivsString(all_images, listOfJSONs, currentLUTsJSON)
    //console.log("List_of_JSONs", listOfJSONs)
    $("#TuningItems").html(imageDivsString);
    $("#Selected_images_dropdown").on('change', function (event) {
      let imageId = event.target.value;
      //console.log('selected', imageId);
      for(var i=0; i<listOfJSONs.length; i++){
        if(listOfJSONs[i].id == imageId){
          currentImageDataJSON = listOfJSONs[i];
          console.log("Selected_JSON", currentImageDataJSON)
          $(".ImageDivItem").not("#image_div_"+imageId).hide();
          $("#image_div_"+imageId).show();
          $("#image_div_"+imageId).tabs()
        }
        //else{
          //$(".ImageDivItem").hide();
        //}
        updateZDepthTuningSlider(currentImageDataJSON);
        updateTTimeTuningSlider(currentImageDataJSON)
        for(var index=0; index<currentImageDataJSON.channels.length; index++){
          updateAllChangers(currentImageDataJSON, index)
        }
        // Immediately show the initial state...
        updateAllChannelsAndResultImage(currentImageDataJSON)
      }

      //https://stackoverflow.com/questions/34151201/jquery-bind-a-function-to-a-button-with-an-on-method
      $("body").on("click", "#transfer_tunings_button_"+imageId, function(){
        alert("Its working!!! "+imageId);
        console.log('Applying to all images...')
        modifySelectedImagesJSONs(listOfJSONs, currentImageDataJSON)
      });

      //Binding multiple events at once on the TuningItms block: http://jqfundamentals.com/chapter/events
      $("#image_div_"+imageId).on("select.lut input.ColorChanger select.RealDynamicRange", function () {
        console.log('Changing...', currentImageDataJSON);
        updateAllChannelsAndResultImage(currentImageDataJSON);
      });

    });
  });
});

//Histogramme https://canvasjs.com/javascript-charts/json-data-api-ajax-chart/

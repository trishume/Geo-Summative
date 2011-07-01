function addCaption( oImgElem, bUseCaptionMarker )
{
  // Check that image element not already have a div.imgblock as parent.
  if( oImgElem.parentNode && oImgElem.parentNode.className=="imgblock")
    return;
    
  // Create the div.imgblock element      
  var oImgBlockElem = document.createElement("div");
  oImgBlockElem.className = "imgblock";
  oImgBlockElem.style.styleFloat = oImgElem.style.styleFloat;
  oImgElem.style.styleFloat = "none";

  if( oImgElem.className.search("leftjust") >= 0 )
  {
    oImgBlockElem.className = oImgBlockElem.className + " leftjust";
    oImgElem.className = oImgElem.className.replace("leftjust","");
  }
  if( oImgElem.className.search("rightjust") >= 0 )
  {
    oImgBlockElem.className = oImgBlockElem.className + " rightjust"; 
    oImgElem.className = oImgElem.className.replace("rightjust","");
  }


  var oHandle = oImgElem;  // oHandle is element that should be moved into our div.imgblock element

  // If the current image has a parent A (anchor/hyperlink) element then
  // we would also like that to go into our div.imgblock, therefore the oHandle
  // is adjusted to point to the A element.
  if( oImgElem.parentNode.tagName == "A" )
  {
    oHandle = oImgElem.parentNode;
  }

  //  alert("Before for '" + oImgElem.alt + "'");
  // Replace the oHandle node (the img or a) with our new div.imgblock element.
  var oOldHandle = oHandle.parentNode.replaceChild(oImgBlockElem,oHandle);  // This line sometimes crash in IE with error R6025!
  
  if( false ) //bUsePhotoShadow )
  {
    var oPhotoShadowElem = document.createElement("div");
    oPhotoShadowElem.className = "photoshadow";
  
    oImgBlockElem.appendChild(oPhotoShadowElem);
    oPhotoShadowElem.appendChild(oOldHandle);
  }
  else
  {
    oImgBlockElem.appendChild(oOldHandle);
  }
  //oImgBlockElem.appendChild(oOldHandle);
  oHandle=null;
  //  alert("After for '" + oImgElem.alt + "'");


  // Create div.caption element
  var oCaptionElem = document.createElement("div");
  oCaptionElem.className = "imgcaption";
  oCaptionElem.style.marginLeft = oImgElem.style.marginLeft;

  if( /*false &&*/ bUseCaptionMarker )
  {
    // Create div.caption-marker element
    var oCaptionMarkerElem = document.createElement("div");
    oCaptionMarkerElem.className = "captionmarker";
    var oCaptionMarkerTextElem = document.createTextNode("\u00bb");
    oCaptionMarkerElem.appendChild(oCaptionMarkerTextElem);
    oCaptionElem.appendChild(oCaptionMarkerElem );
  }

  if( /*false*/true )
  {
    // Create div.caption-text element with appropriate alt text
    var oCaptionTextElem = document.createElement("div");
    oCaptionTextElem.className = "captiontext";
    var oCaptionText = document.createTextNode( oImgElem.alt );
    oCaptionTextElem.appendChild(oCaptionText );
    oCaptionElem.appendChild(oCaptionTextElem);
  }

  // Check whether copyright element should be handled...
  if( /*false &&*/ oImgElem.getAttribute("copyright") != null )
  {
    // Create div.copyright element with appropriate bolded text according to | delimiter (if any)...
    var oCopyrightElem = document.createElement("div");
    oCopyrightElem.className = "copyright";
    //var oCopyrightText = document.createTextNode( oImgElem.getAttribute("copyright") );
    var oCopyrightText = document.createElement("span");
    // Convert all texts before a possible '|' character into a bold-face...
    ostr = oImgElem.getAttribute("copyright").replace(new RegExp("[^|]* |"),"<b>$&</b>");
    oCopyrightText.innerHTML = ostr;
    oCopyrightElem.appendChild(oCopyrightText);
    oCaptionElem.appendChild(oCopyrightElem );
  }

  if( oImgElem.getAttribute("camera") != null )
  {
    // Adds extra <div class="exif"><span>...</span></div> with ... replaced with camera, lens and settings attribute texts.
    var oExifElem = document.createElement("div");
    oExifElem.className = "exif";
    var oExifText = document.createElement("span");
    oExifText.innerHTML = oImgElem.getAttribute("camera") + ", " + oImgElem.getAttribute("lens") + "<br/>" + oImgElem.getAttribute("settings");
    
    oExifElem.appendChild(oExifText);
    oCaptionElem.appendChild(oExifElem);
    
    /* Adds extra <div class="exif2"><span>...</span></div>
    if( oImgElem.getAttribute("settings") != null )
    {
      var oExifSettingsElem = document.createElement("div");
      oExifSettingsElem.className = "exif2";
      var oExifSettingsText = document.createElement("span");
      oExifSettingsText.innerHTML = oImgElem.getAttribute("settings");
      oExifSettingsElem.appendChild(oExifSettingsText);
      oCaptionElem.appendChild(oExifSettingsElem);
    }
    */
  }
  
  //if( oImgElem.getAttribute("exif") != null )
  if( oImgElem.className.search("addexifcap") >= 0 )
  {
    // Adds extra <div class="exif"><span>...</span></div> with ... replaced with camera, lens and settings attribute texts.
    var oExifElem = document.createElement("div");
    oExifElem.className = "exif";
    var oExifText = document.createElement("span");
    oExifText.innerHTML = EXIF.getTag(oImgElem, "Model") + ", " +  
      EXIF.getTag(oImgElem, "FocalLength") + "mm, f/" + 
      EXIF.getTag(oImgElem, "FNumber") + ", 1/" + 
      1/EXIF.getTag(oImgElem, "ExposureTime") + "s, " + 
      "ISO " + EXIF.getTag(oImgElem, "ISOSpeedRatings");
    
    
    oExifElem.appendChild(oExifText);
    oCaptionElem.appendChild(oExifElem);
  }

  oImgBlockElem.appendChild(oCaptionElem);

  //return true;
    
  with(oImgElem.style)
  {
    oCaptionElem.style.width = (oImgElem.scrollWidth)+"px";
  }
  oImgBlockElem.style.width = (oImgElem.scrollWidth)+"px";

  return true; 
}

function addCaps()
{
  /*var i=0;
  var oImages = document.images; //document.getElementsByTagName("img"); // document.images
  var oImg;
  //alert("inside addCaps() - " + oImages.length );
  for( i=0; i<oImages.length; i++ )
  {
    oImg = document.images[i];
    //alert("oImg.className = " + oImg.className);
    if( oImg.className.search("addcap") >= 0 )
    {
    	alert("adding caption");
      addCaption(oImg,true);
    } 
  }*/
  $(".addcap").each(function(ind){
  	alert("adding caption to element " + this.className);
  	addCaption(this,true);
  })

  return true;
}

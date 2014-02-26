/**
 * Created by Sargis Sargsyan on 2/11/14.
 */

if (typeof PsdUtils !== 'object') {
	PsdUtils = {};
}

// PS stores dimension as "xxx pixels"
PsdUtils.normalizeDimension = function(dimension) {
	return parseInt(String(dimension).split(' ')[0]);
};

// extract document metadata
PsdUtils.getDocumentMetadata = function(document) {
	return {
		width : PsdUtils.normalizeDimension(document.width),
		height : PsdUtils.normalizeDimension(document.height),
		resolution : document.resolution,
		name : (document.name.split("."))[0],
		path : document.path ? document.path.toString() : '',
		layers : PsdUtils.getLayersMetadata(document, document.layers)
	};
};

// extract document metadata
PsdUtils.getLayersMetadata = function(document, layers) {
	var layersMetadata = [];
	for (var i = 0; i < layers.length; i++) {
		// ignoring layers with name starting "."
		if (layers[i].name.substr(0, 1) != ".") {
			layersMetadata.push(PsdUtils.layerMetadata(document, layers[i], i));
		}
	}
	return layersMetadata;
};

// extract metadata from layer
PsdUtils.layerMetadata = function(document, layer, layerIndex) {
	var nameParts = layer.name.split('$');
	var layerMetadata = PsdUtils.crateLayerGenericMetadata(nameParts[0], layer,
			layerIndex);
	if(nameParts[1]){
		if(layerMetadata.scaleX != 1 || layerMetadata.scaleY != 1){
			PsdUtils.setLayerPivot([0,0.5,0.5], layerMetadata);
		}
		var rotation = (new RegExp("r\\(([-0-9.]+)\\)", "gi")).exec(nameParts[1]);
		if (rotation && rotation[1]) {
			PsdUtils.setLayerRotation(rotation, layerMetadata);
			PsdUtils.setLayerPivot([0,0.5,0.5], layerMetadata);
		}
		var pivot = (new RegExp("p\\(([-0-9.]+),([-0-9.]+)\\)", "gi")).exec(nameParts[1]);
		if (pivot) {
			if(pivot[1] || pivot[2]){
				PsdUtils.setLayerPivot(pivot, layerMetadata);
			}
		}
	}
	PsdUtils.setLayerSpecificMetadata(layerMetadata, layer);
	if (layer.typename == "LayerSet") {
		layerMetadata.layers = PsdUtils.getLayersMetadata(document,
				layer.layers);
	}
	return layerMetadata;
};

PsdUtils.setLayerScale = function(scale, layerMetadata) {
	if (scale[1]) {
		layerMetadata.scaleX = parseFloat(scale[1]);
//		layerMetadata.width = layerMetadata.width/layerMetadata.scaleX;
	}
	if (scale[2]) {
		layerMetadata.scaleY = parseFloat(scale[2]);
//		layerMetadata.height = layerMetadata.height/layerMetadata.scaleY;
	}
};

PsdUtils.setLayerRotation = function(rotation, layerMetadata) {
	layerMetadata.rotation =  parseFloat(rotation[1]) / 180.0 * Math.PI;//Converts an angle from degrees into radians
};

PsdUtils.setLayerPivot = function(pivot, layerMetadata) {
	if (pivot[1]) {
		layerMetadata.pivotX = parseFloat(pivot[1]) * layerMetadata.width;
		layerMetadata.left += layerMetadata.pivotX; 
	}
	if (pivot[2]) {
		layerMetadata.pivotY = parseFloat(pivot[2]) * layerMetadata.height;
		layerMetadata.top += layerMetadata.pivotY; 
	}
};


PsdUtils.getLayerOriginalWidth = function(layer, scaleX) {
	if(layer.kind == LayerKind.TEXT){
		var textItem = layer.textItem;
		return parseInt(textItem.width.value)/scaleX;
	}else{
		var leftBound = PsdUtils.normalizeDimension(layer.bounds[0]);
		return (PsdUtils.normalizeDimension(layer.bounds[2]) - leftBound)/scaleX;
	}
};

PsdUtils.getLayerOriginalHeight = function(layer, scaleY) {
	if(layer.kind == LayerKind.TEXT){
		var textItem = layer.textItem;
		var heightAdjustment = Math.ceil(parseInt(textItem.size) * .4);
		return (parseInt(textItem.height.value) + heightAdjustment)/scaleY;
	}else{
		var topBound = PsdUtils.normalizeDimension(layer.bounds[1]);
		return (PsdUtils.normalizeDimension(layer.bounds[3]) - topBound)/scaleY;
	}
};


PsdUtils.setLayerSpecificMetadata = function(layerMetadata, layer) {
	switch (layer.kind) {
	case LayerKind.TEXT:
		PsdUtils.setTextLayerMetadata(layerMetadata, layer);
		break;
	default:
		break;
	}
};

PsdUtils.setTextLayerMetadata = function(layerMetadata, layer) {
	var textItem = layer.textItem;
	try {
		var fontSize = parseInt(textItem.size);
	} catch (e) {
	}
	try {
		var color = textItem.color.rgb.hexValue;
	} catch (e) {
		color = "000000";
	}
	try {
		var font = textItem.font;
	} catch (e) {
	}
	try {
		var fontStyle = textItem.fauxItalic;
	} catch (e) {
		fontStyle = false;
	}
	try {
		var fontWeight = textItem.fauxBold;
	} catch (e) {
		fontWeight = false;
	}
	var fontFamilyData = app.fonts.getByName(font);
	try {
		var fontFamilyStyle = fontFamilyData.style;
	} catch (e) {
	}
	try {
		var fontFamily = fontFamilyData.family;
	} catch (e) {
	}
	try {
		var letterSpacing = textItem.tracking;
	} catch (e) {
		letterSpacing = 0;
	}
	if (letterSpacing != 0) {
		letterSpacing = (letterSpacing * fontSize) * .001;
	}
	try {
		var lineHeight = parseInt(textItem.leading);
	} catch (e) {
		lineHeight = 0;
	}
	try {
		var fontExist = fontFamilyData.name;
	} catch (e) {
		fontExist = false;
	}
	var effects = PsdUtils.activeLayerHasEffects();
	//
	var heightAdjustment = Math.ceil(fontSize * .4);
	layerMetadata.content = textItem.contents;
	layerMetadata.fontSize = fontSize;
	layerMetadata.color = "0x" + color.toLowerCase();
	layerMetadata.fontFamily = fontFamily;
	layerMetadata.fontExist = fontExist;
	layerMetadata.fontStyle = fontStyle;
	layerMetadata.fontWeight = fontWeight;
	layerMetadata.fontFamilyStyle = fontFamilyStyle;
	layerMetadata.bold = fontFamilyStyle.indexOf("Bold") != -1;
	layerMetadata.italic = fontFamilyStyle.indexOf("Italic") != -1;
	layerMetadata.justification = PsdUtils.getTextItemJustification(textItem);
	layerMetadata.letterSpacing = letterSpacing;
	layerMetadata.lineHeight = lineHeight;
	layerMetadata.effects = effects;
	layerMetadata.left = PsdUtils.normalizeDimension(textItem.position[0]); //+ ((layerMetadata.width * layerMetadata.scaleX) >> 1);
	layerMetadata.top = PsdUtils.normalizeDimension(textItem.position[1]) - heightAdjustment; // +  ((parseInt(textItem.height.value) * layerMetadata.scaleY) >> 1);
};

PsdUtils.getTextItemJustification = function(textItem) {
	var justification = "center";
	try {
		switch (textItem.justification) {
		case Justification.CENTER:
			return "center";
			break;
		case Justification.LEFT:
			return "left";
			break;
		case Justification.RIGHT:
			return "right";
			break;
		default:
			return "center";
			break;
		}
	} catch (e) {

	}
	return justification;

};

PsdUtils.getDescriptor = function(psClass, psKey) { // integer:Class,
	// integer:key
	var ref = new ActionReference();
	if (psKey != undefined) {
		ref.putProperty(charIDToTypeID("Prpr"), psKey);
	}
	ref.putEnumerated(psClass, charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
	return executeActionGet(ref);
};
// check layer for effects
PsdUtils.activeLayerHasEffects = function() {
	return PsdUtils.getDescriptor(charIDToTypeID('Lyr ')).hasKey(
			stringIDToTypeID('layerEffects'));
};

PsdUtils.crateLayerGenericMetadata = function(name, layer, layerIndex) {
	
	var scaleX = 1;
	var scaleY = 1;
	var nameParts = layer.name.split('$');
	if(nameParts[1]){
		var scale = (new RegExp("t\\(([-0-9.]+),([-0-9.]+)\\)", "gi")).exec(nameParts[1]);
		if (scale) {
			if(scale[1]){
				scaleX = scale[1];
			}
			if(scale[2]){
				scaleY = scale[2];
			}
		}
	}
	var layerOriginalWidth = PsdUtils.getLayerOriginalWidth(layer, scaleX);
	var layerOriginalHeight = PsdUtils.getLayerOriginalHeight(layer,scaleY);
	var width = layerOriginalWidth* scaleX;
	var height = layerOriginalHeight* scaleY;
	
	
	var leftBound = PsdUtils.normalizeDimension(layer.bounds[0]);
	var topBound = PsdUtils.normalizeDimension(layer.bounds[1]);
	return {
		name : name,
		left : leftBound - (layerOriginalWidth - width)/2,
		top : topBound - (layerOriginalHeight - height)/2,
		width : layerOriginalWidth,
		height : layerOriginalHeight,
		rotation : 0,
		scaleX : scaleX,
		scaleY : scaleY,
		pivotX : 0,
		pivotY : 0,
		opacity : layer.opacity / 100,
		fillOpacity : layer.fillOpacity,
		kind : PsdUtils.getLayerKind(layer), // layer.kind,
		layerIndex : layerIndex,
	};
};

PsdUtils.getLayerKind = function(layer) {
	switch (layer.kind) {
		case LayerKind.TEXT:
			return "text";
			break;
		case LayerKind.SOLIDFILL:
			return "quad";
			break;
		case LayerKind.SMARTOBJECT:
		case LayerKind.NORMAL:
			return "image";
			break;
		default:
			if (layer.typename == "LayerSet") {
				return "sprite";
			}
			break;
	}
	throw new Error("Layers kind can be only on from [TEXT, SMARTOBJECT, NORMAL, SOLIDFILL]");
};

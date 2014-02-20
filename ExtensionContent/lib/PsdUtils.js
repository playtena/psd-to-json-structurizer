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
	PsdUtils.setLayerPin(nameParts[1], layerMetadata);
	PsdUtils.setLayerRotation(nameParts[1], layerMetadata);
	PsdUtils.setLayerScale(nameParts[1], layerMetadata);
	PsdUtils.setLayerSpecificMetadata(layerMetadata, layer);
	if (layer.typename == "LayerSet") {
		layerMetadata.layers = PsdUtils.getLayersMetadata(document,
				layer.layers);
	}
	return layerMetadata;
};

PsdUtils.setLayerScale = function(rawName, layerMetadata) {
	if (rawName) {
		var pin = (new RegExp("t\\(([-0-9.]+),([-0-9.]+)\\)", "gi")).exec(rawName);
		if (!pin){
			return;
		}
		if (pin[1]) {
			layerMetadata.scaleX = parseFloat(pin[1]);
		}
		if (pin[2]) {
			layerMetadata.scaleY = parseFloat(pin[2]);
		}
	}
};

PsdUtils.setLayerRotation = function(rawName, layerMetadata) {
	if (rawName) {
		var pin = (new RegExp("r\\(([-0-9.]+)\\)", "gi")).exec(rawName);
		if (!pin){
			return;
		}
		if (pin[1]) {
			layerMetadata.rotation =  parseFloat(pin[1]) / 180.0 * Math.PI;//Converts an angle from degrees into radians
		}
		
	}
};

PsdUtils.setLayerPin = function(rawName, layerMetadata) {
	if (rawName) {
		var pin = (new RegExp("p\\(([-0-9.]+),([-0-9.]+)\\)", "gi")).exec(rawName);
		if (!pin){
			return;
		}
		if (pin[1]) {
			layerMetadata.pinX = parseFloat(pin[1]) * layerMetadata.width;
		}
		if (pin[2]) {
			layerMetadata.pinY = parseFloat(pin[2]) * layerMetadata.height;
		}
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
	layerMetadata.width = parseInt(textItem.width.value);
	layerMetadata.height = parseInt(textItem.height.value) + heightAdjustment;
	layerMetadata.left = PsdUtils.normalizeDimension(textItem.position[0]) + ((layerMetadata.width * layerMetadata.scaleX) >> 1);
	layerMetadata.top = PsdUtils.normalizeDimension(textItem.position[1]) - heightAdjustment  +  ((parseInt(textItem.height.value) * layerMetadata.scaleY) >> 1);
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
	var leftBound = PsdUtils.normalizeDimension(layer.bounds[0]);
	var rightBound = PsdUtils.normalizeDimension(layer.bounds[1]);
	var width = PsdUtils.normalizeDimension(layer.bounds[2]) - leftBound;
	var height = PsdUtils.normalizeDimension(layer.bounds[3]) - rightBound;
	return {
		name : name,
		left : leftBound + (width >> 1),
		top : rightBound + (height >> 1),
		width : width,
		height : height,
		rotation : 0,
		scaleX : 1,
		scaleY : 1,
		opacity : layer.opacity / 100,
		fillOpacity : layer.fillOpacity,
		kind : PsdUtils.getLayerKind(layer), // layer.kind,
		layerIndex : layerIndex
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

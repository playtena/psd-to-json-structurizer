/**
 * Created by Sargis Sargsyan on 2/11/14.
 */

function Structurizer() {

    this.originalVisibilityList = [];

    this.document = null;

    this.structurize = function (activeDocument, outputFolder) {
    	var progressWindow = createProgressWindow("Structurizing in process!", 0, 1);
    	progressWindow.show();
        this.document = activeDocument;
        // store the layer visibility going in so we can return to it
        // and hide everything
        this.hideLayers();
        progressWindow.bar.value = 0.2;
        // show each "top level" layer, export a trimmed version
        var metadata = PsdUtils.getDocumentMetadata(this.document);
        progressWindow.bar.value = 0.7;
        if (metadata.layers.length > 0) {
            FileUtils.saveFile(outputFolder + "/" + metadata.name + ".json", JSON.stringify(metadata));
        }
        progressWindow.bar.value = .95;
        this.restoreLayersOriginalVisibility();
        progressWindow.bar.value = 1;
        progressWindow.hide();
    };

    this.hideLayers = function () {
        var layers = this.document.layers;
        for (var i = 0; i < layers.length; i++) {
            this.originalVisibilityList.push(layers[i].visible);
            layers[i].visible = false;
        }
    };

    this.restoreLayersOriginalVisibility = function () {
        var layers = this.document.layers;
        for (var i = 0; i < layers.length; i++) {
            layers[i].visible = this.originalVisibilityList[i];
        }
    };

};

function createProgressWindow(title, min, max) {
	  var win = new Window('palette', title);
	  win.bar = win.add('progressbar', undefined, min, max);
	  win.bar.preferredSize = [180, 18];
	  return win;
}


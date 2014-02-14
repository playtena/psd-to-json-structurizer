/**
 * Created by Sargis Sargsyan on 2/11/14.
 */

function Structurizer() {

    this.originalVisibilityList = [];

    this.document = null;

    this.structurize = function (activeDocument, outputFolder) {
        this.document = activeDocument;
        // store the layer visibility going in so we can return to it
        // and hide everything
        this.hideLayers();
        // show each "top level" layer, export a trimmed version
        var metadata = PsdUtils.getDocumentMetadata(this.document);
        if (metadata.layers.length > 0) {
            FileUtils.saveFile(outputFolder + "/" + metadata.name + "_metadata.json", JSON.stringify(metadata));
        }
        this.restoreLayersOriginalVisibility();
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
    }

}


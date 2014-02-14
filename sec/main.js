/**
 *  Created by Sargis Sargsyan on 2/11/14.
 */

function main(app) {
    if (app.documents.length == 0) {
        alert("No document to process!");
    } else {
        var document = app.activeDocument;
        var path = document.path + "";
        var outputFolder = path.substring(0, path.lastIndexOf("/")) + "/json";
        var structurizer = new Structurizer();
        structurizer.structurize(document, outputFolder);
    }
}
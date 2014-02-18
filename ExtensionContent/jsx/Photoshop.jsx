#include "../lib/JSON.js"
#include "../lib/PsdUtils.js"
#include "../lib/FileUtils.js"
#include "../Structurizer.js"
$._ext_PHXS={
    run : function() {
         	if (app.documents.length == 0) {
        		alert("No document to process!");
    		} 
    		else {
        		var document = app.activeDocument;
        		var path = document.path + "";
        		var outputFolder = path.substring(0, path.lastIndexOf("/")) + "/json";
        		try {
	        		var structurizer = new Structurizer();
	        		structurizer.structurize(document, outputFolder);
	        		alert("DONE!");
			    } catch (e) {
			    	alert(e);
			    }
        	}
        	return 0;
    },
};
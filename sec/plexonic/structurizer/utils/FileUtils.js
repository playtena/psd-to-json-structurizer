/**
 * Created by Sargis Sargsyan on 2/14/14.
 */

if (typeof FileUtils !== 'object') {
    FileUtils = {};
}

FileUtils.saveFile = function (path, content) {
    var fileObj = new File(path);
    if (fileObj.open("w")) {
        fileObj.write(content);
        fileObj.close();
    } else {
        alert("Could not create file: " + path);
    }
};
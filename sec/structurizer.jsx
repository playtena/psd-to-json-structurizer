// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

#include "plexonic/structurizer/utils/JSON.js"
#include "plexonic/structurizer/utils/PsdUtils.js"
#include "plexonic/structurizer/utils/FileUtils.js"
#include "plexonic/structurizer/Structurizer.js"
#include "main.js"

app.bringToFront();

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
$.level = 1;

main(app);
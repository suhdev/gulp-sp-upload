# gulp-sp-upload

A simple gulp plugin to upload files when working on platforms where you cannot use mapped drives. 


## Usage

```javascript 


var gulp = require('gulp'); 
var uploader = require('./test'); 



gulp.task('js:upload',()=>{
    gulp.src('./testfolder/*.js')
        .pipe(uploader({
            //register the app using appregnew.aspx to get appId and appSecret, and appinv.aspx (to grant permissions)
            spAppId:'__APP_ID__',           
            spAppSecret:'__APP_SECRET__',   
            siteCollectionUrl:'__SITE_COLLECTION_URL__', //e.g. https://tenant.sharepoint.com/sites/mysite
            //folder path to upload files to e.g. SiteAssets or _catalogs/masterpage
            folderName:"_catalogs/masterpage" 

        })); 
}); 

gulp.task('default',()=>{
    gulp.watch('./testfolder/*.js',['js:upload']); 
}); 

```
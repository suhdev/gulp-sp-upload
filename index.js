var $pnp = require("@pnp/nodejs-commonjs");
var $sp = require("@pnp/sp-commonjs");
var through = require("through2");
var path = require("path");

module.exports = function (config) {
  if (!config.siteCollectionUrl) {
    throw new Error(`Please provide site collection URL 'siteCollectionUrl'`);
  }
  if (!config.spAppId) {
    throw new Error(`Please provide app id 'spAppId'`);
  }
  if (!config.spAppSecret) {
    throw new Error(`Please provide app secret 'spAppSecret'`);
  }
  if (!config.folderName) {
    throw new Error(
      `Please provide folder name to which you want to upload your files 'folderName' i.e. SiteAssets`
    );
  }

  $sp.sp.setup({
    sp: {
      fetchClientFactory: () => {
        return new $pnp.SPFetchClient(
          config.siteCollectionUrl,
          config.spAppId,
          config.spAppSecret
        );
      },
    },
  });

  console.info(
    `No webUrl has been provided, going to use SiteCollection Web instead`
  );
  var web = new $sp.Web(
    config.siteCollectionUrl + (config.webUrl ? `/${config.webUrl}` : "")
  );
  var folder = web.getFolderByServerRelativeUrl(config.folderName);

  return through.obj(async function (file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }
    if (file.isBuffer() || file.isStream()) {
      try {
        var tx = await folder.files.add(
          path.basename(file.path),
          file.contents,
          true
        );
        if (typeof config.data === "function") {
          var data = config.data(path.basename(file.path), file.path);
          if (data) {
            try {
              var item = await tx.file.getItem();
              var updated = await item.update(data);
            } catch (err) {
              console.error(err);
            }
          }
        }
        if (config.majorCheckIn || config.publish) {
          var f = await folder.files.getByName(path.basename(file.path));
          try {
            console.log("Attempting to performing a major check in");
            await f.checkin(
              "Checked in using gulp-sp-upload",
              $sp.CheckinType.Major
            );
          } catch (err) {
            console.log(
              "Major check in has failed, attempting to publish instead"
            );
            await f.publish("publishing");
          }
        }
        if (config.minorCheckIn || config.draft) {
          var f = await folder.files.getByName(path.basename(file.path));
          try {
            console.log("Attempting to performing a minor check in");
            await tx.file.checkin(
              "Checked in using gulp-sp-upload",
              $sp.CheckinType.Minor
            );
          } catch (err) {
            console.log(
              "Minor check in has failed, attempting to publish instead"
            );
            await f.publish("publishing");
          }
        }
        if (config.verbose) {
          console.log(`Uploaded file ${path.basename(file.path)} successfully`);
        }
      } catch (err) {
        console.error(`Could not upload file ${file.path}`);
      }
      cb(null, file);
      return;
    }
    cb(null, file);
  });
};
